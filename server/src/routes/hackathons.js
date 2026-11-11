import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { enrich, filterHackathons, generateTeamCode } from '../utils/hackathons.js';
import { DOMAINES, FORMATS, REGIONS, TYPES_ORGANISATEUR } from '../constants.js';

const router = Router();

// GET /api/hackathons?q=&organisateur=&region=&domaine=&statut=&format=&tri=
router.get('/', (req, res) => {
  const db = getDb();
  const list = db.hackathons.map((h) => enrich(h, db.inscriptions));
  const result = filterHackathons(list, req.query);
  res.json({ total: result.length, hackathons: result });
});

// GET /api/hackathons/mine : hackathons publiés par l'utilisateur connecté
// (déclarée avant "/:id" pour ne pas être confondue avec un identifiant)
router.get('/mine', requireAuth, (req, res) => {
  const db = getDb();
  const mine = db.hackathons
    .filter((h) => h.createdBy === req.user.id)
    .map((h) => enrich(h, db.inscriptions))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ hackathons: mine });
});

// GET /api/hackathons/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const hackathon = db.hackathons.find((h) => h.id === req.params.id);
  if (!hackathon) return res.status(404).json({ message: 'Hackathon introuvable.' });
  return res.json({ hackathon: enrich(hackathon, db.inscriptions) });
});

// GET /api/hackathons/:id/inscrits : réservé à l'organisateur qui l'a publié
router.get('/:id/inscrits', requireAuth, (req, res) => {
  const db = getDb();
  const hackathon = db.hackathons.find((h) => h.id === req.params.id);
  if (!hackathon) return res.status(404).json({ message: 'Hackathon introuvable.' });
  if (hackathon.createdBy !== req.user.id) return res.status(403).json({ message: 'Accès réservé à l’organisateur.' });

  const inscrits = db.inscriptions
    .filter((i) => i.hackathonId === hackathon.id)
    .map((i) => {
      const user = db.users.find((u) => u.id === i.userId);
      return {
        id: i.id,
        nom: user?.nom,
        email: user?.email,
        universite: user?.universite,
        mode: i.mode,
        equipe: i.equipe,
        createdAt: i.createdAt,
      };
    });
  return res.json({ inscrits });
});

function validateHackathon(body) {
  const errors = {};
  const b = body || {};
  if (!b.titre || b.titre.trim().length < 5) errors.titre = 'Titre trop court (5 caractères min.).';
  if (!b.description || b.description.trim().length < 30) errors.description = 'Décris le hackathon en 30 caractères minimum.';
  if (!b.organisateur?.nom) errors.organisateurNom = 'Nom de l’organisateur requis.';
  if (!TYPES_ORGANISATEUR.includes(b.organisateur?.type)) errors.organisateurType = 'Type d’organisateur invalide.';
  if (!DOMAINES.includes(b.domaine)) errors.domaine = 'Domaine invalide.';
  if (!FORMATS.includes(b.format)) errors.format = 'Format invalide.';
  if (!REGIONS.includes(b.region)) errors.region = 'Région invalide.';
  if (!b.lieu) errors.lieu = 'Lieu requis.';
  if (!b.dateDebut) errors.dateDebut = 'Date de début requise.';
  if (!b.dateFin) errors.dateFin = 'Date de fin requise.';
  if (b.dateDebut && b.dateFin && new Date(b.dateFin) < new Date(b.dateDebut)) errors.dateFin = 'La fin doit être après le début.';
  if (!b.dateLimite) errors.dateLimite = 'Date limite d’inscription requise.';
  if (b.dateLimite && b.dateDebut && new Date(b.dateLimite) > new Date(b.dateDebut)) errors.dateLimite = 'Doit être avant le début.';
  const places = Number(b.places);
  if (!Number.isInteger(places) || places < 1) errors.places = 'Nombre de places invalide.';
  return errors;
}

// POST /api/hackathons : publier un hackathon
router.post('/', requireAuth, (req, res) => {
  const errors = validateHackathon(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Formulaire invalide.', errors });

  const b = req.body;
  const hackathon = {
    id: randomUUID(),
    titre: b.titre.trim(),
    description: b.description.trim(),
    organisateur: { nom: b.organisateur.nom.trim(), type: b.organisateur.type },
    domaine: b.domaine,
    region: b.region,
    format: b.format,
    lieu: b.lieu.trim(),
    dateDebut: b.dateDebut,
    dateFin: b.dateFin,
    dateLimite: b.dateLimite,
    places: Number(b.places),
    tailleEquipeMax: Number(b.tailleEquipeMax) || 4,
    prix: Array.isArray(b.prix) ? b.prix.filter(Boolean) : [],
    programme: Array.isArray(b.programme) ? b.programme.filter((p) => p?.titre) : [],
    reglement: (b.reglement || '').trim(),
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };

  const db = getDb();
  db.hackathons.push(hackathon);
  saveDb();
  return res.status(201).json({ hackathon: enrich(hackathon, db.inscriptions) });
});

// DELETE /api/hackathons/:id : supprimer un hackathon que l'on a publié
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const index = db.hackathons.findIndex((h) => h.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Hackathon introuvable.' });
  if (db.hackathons[index].createdBy !== req.user.id) return res.status(403).json({ message: 'Action non autorisée.' });

  db.inscriptions = db.inscriptions.filter((i) => i.hackathonId !== req.params.id);
  db.hackathons.splice(index, 1);
  saveDb();
  return res.status(204).end();
});

// POST /api/hackathons/:id/inscriptions  { mode: solo|creer|rejoindre, nomEquipe?, codeEquipe?, motivation? }
router.post('/:id/inscriptions', requireAuth, (req, res) => {
  const db = getDb();
  const raw = db.hackathons.find((h) => h.id === req.params.id);
  if (!raw) return res.status(404).json({ message: 'Hackathon introuvable.' });

  const hackathon = enrich(raw, db.inscriptions);
  if (hackathon.statut !== 'a-venir' || new Date() > new Date(`${hackathon.dateLimite}T23:59:59`)) {
    return res.status(400).json({ message: 'Les inscriptions sont fermées pour ce hackathon.' });
  }
  if (hackathon.placesRestantes <= 0) return res.status(400).json({ message: 'Plus de places disponibles.' });
  if (db.inscriptions.some((i) => i.hackathonId === raw.id && i.userId === req.user.id)) {
    return res.status(409).json({ message: 'Tu es déjà inscrit(e) à ce hackathon.' });
  }

  const { mode, nomEquipe, codeEquipe, motivation } = req.body || {};
  let equipe = null;

  if (mode === 'creer') {
    if (!nomEquipe || nomEquipe.trim().length < 2) {
      return res.status(400).json({ message: 'Nom d’équipe requis.', errors: { nomEquipe: 'Nom d’équipe requis.' } });
    }
    let code = generateTeamCode();
    while (db.inscriptions.some((i) => i.equipe?.code === code)) code = generateTeamCode();
    equipe = { nom: nomEquipe.trim(), code };
  } else if (mode === 'rejoindre') {
    const code = String(codeEquipe || '').trim().toUpperCase();
    const membres = db.inscriptions.filter((i) => i.hackathonId === raw.id && i.equipe?.code === code);
    if (!membres.length) {
      return res.status(400).json({ message: 'Code d’équipe introuvable pour ce hackathon.', errors: { codeEquipe: 'Code introuvable.' } });
    }
    if (membres.length >= (raw.tailleEquipeMax || 4)) {
      return res.status(400).json({ message: 'Cette équipe est complète.', errors: { codeEquipe: 'Équipe complète.' } });
    }
    equipe = { ...membres[0].equipe };
  } else if (mode !== 'solo') {
    return res.status(400).json({ message: 'Mode de participation invalide.' });
  }

  const inscription = {
    id: randomUUID(),
    userId: req.user.id,
    hackathonId: raw.id,
    mode,
    equipe,
    motivation: (motivation || '').trim(),
    statut: 'confirme',
    createdAt: new Date().toISOString(),
  };
  db.inscriptions.push(inscription);
  saveDb();
  return res.status(201).json({ inscription });
});

export default router;
