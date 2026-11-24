import { Router } from 'express';
import { prisma } from '../prisma.js';
import { AVEC_INSCRITS, versDonneesHackathon, versHackathon, versInscription } from '../conversions.js';
import { asyncRoute, requireAuth } from '../middleware/auth.js';
import { enrich, filterHackathons, generateTeamCode } from '../utils/hackathons.js';
import { DOMAINES, FORMATS, REGIONS, TYPES_ORGANISATEUR } from '../constants.js';

const router = Router();

/** Un hackathon enrichi (statut, places restantes), ou null s'il n'existe pas */
async function trouverHackathon(id) {
  const hackathon = await prisma.hackathon.findUnique({ where: { id }, include: AVEC_INSCRITS });
  return hackathon ? enrich(versHackathon(hackathon)) : null;
}

// GET /api/hackathons?q=&organisateur=&region=&domaine=&statut=&format=&tri=
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const hackathons = await prisma.hackathon.findMany({ include: AVEC_INSCRITS });
    const result = filterHackathons(hackathons.map((h) => enrich(versHackathon(h))), req.query);
    res.json({ total: result.length, hackathons: result });
  }),
);

// GET /api/hackathons/mine : hackathons publiés par l'utilisateur connecté
// (déclarée avant "/:id" pour ne pas être confondue avec un identifiant)
router.get(
  '/mine',
  requireAuth,
  asyncRoute(async (req, res) => {
    const hackathons = await prisma.hackathon.findMany({
      where: { creePar: req.user.id },
      orderBy: { creeLe: 'desc' },
      include: AVEC_INSCRITS,
    });
    res.json({ hackathons: hackathons.map((h) => enrich(versHackathon(h))) });
  }),
);

// GET /api/hackathons/:id
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const hackathon = await trouverHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ message: 'Hackathon introuvable.' });
    return res.json({ hackathon });
  }),
);

// GET /api/hackathons/:id/inscrits : réservé à l'organisateur qui l'a publié
router.get(
  '/:id/inscrits',
  requireAuth,
  asyncRoute(async (req, res) => {
    const hackathon = await trouverHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ message: 'Hackathon introuvable.' });
    if (hackathon.createdBy !== req.user.id) return res.status(403).json({ message: 'Accès réservé à l’organisateur.' });

    const inscriptions = await prisma.inscription.findMany({
      where: { hackathonId: hackathon.id },
      orderBy: { creeLe: 'asc' },
      include: { equipe: true, utilisateur: { select: { nom: true, email: true, universite: true } } },
    });
    const inscrits = inscriptions.map((i) => {
      const { id, mode, equipe, createdAt } = versInscription(i);
      return { id, ...i.utilisateur, mode, equipe, createdAt };
    });
    return res.json({ inscrits });
  }),
);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  // Les dates doivent être au format "AAAA-MM-JJ" (valeur d'un <input type="date">)
  for (const champ of ['dateDebut', 'dateFin', 'dateLimite']) {
    if (b[champ] && !DATE_RE.test(b[champ])) errors[champ] = 'Date invalide (format AAAA-MM-JJ).';
  }
  if (!b.dateDebut) errors.dateDebut = 'Date de début requise.';
  if (!b.dateFin) errors.dateFin = 'Date de fin requise.';
  if (b.dateDebut && b.dateFin && b.dateFin < b.dateDebut) errors.dateFin = 'La fin doit être après le début.';
  if (!b.dateLimite) errors.dateLimite = 'Date limite d’inscription requise.';
  if (b.dateLimite && b.dateDebut && b.dateLimite > b.dateDebut) errors.dateLimite = 'Doit être avant le début.';
  const places = Number(b.places);
  if (!Number.isInteger(places) || places < 1) errors.places = 'Nombre de places invalide.';
  return errors;
}

// POST /api/hackathons : publier un hackathon
router.post(
  '/',
  requireAuth,
  asyncRoute(async (req, res) => {
    const errors = validateHackathon(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Formulaire invalide.', errors });

    const b = req.body;
    const cree = await prisma.hackathon.create({
      data: {
        ...versDonneesHackathon({
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
        }),
        creePar: req.user.id,
      },
    });
    return res.status(201).json({ hackathon: await trouverHackathon(cree.id) });
  }),
);

// DELETE /api/hackathons/:id : supprimer un hackathon que l'on a publié
// (ses inscriptions et équipes partent avec : "on delete cascade")
router.delete(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: req.params.id }, select: { creePar: true } });
    if (!hackathon) return res.status(404).json({ message: 'Hackathon introuvable.' });
    if (hackathon.creePar !== req.user.id) return res.status(403).json({ message: 'Action non autorisée.' });

    await prisma.hackathon.delete({ where: { id: req.params.id } });
    return res.status(204).end();
  }),
);

// POST /api/hackathons/:id/inscriptions  { mode: solo|creer|rejoindre, nomEquipe?, codeEquipe?, motivation? }
router.post(
  '/:id/inscriptions',
  requireAuth,
  asyncRoute(async (req, res) => {
    const hackathon = await trouverHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ message: 'Hackathon introuvable.' });

    // dateLimite ou places à null = non communiqué : on ne bloque pas sur ce critère
    const limiteDepassee = hackathon.dateLimite && new Date() > new Date(`${hackathon.dateLimite}T23:59:59`);
    if (hackathon.statut !== 'a-venir' || limiteDepassee) {
      return res.status(400).json({ message: 'Les inscriptions sont fermées pour ce hackathon.' });
    }
    if (hackathon.placesRestantes !== null && hackathon.placesRestantes <= 0) {
      return res.status(400).json({ message: 'Plus de places disponibles.' });
    }
    const deja = await prisma.inscription.findUnique({
      where: { hackathonId_utilisateurId: { hackathonId: hackathon.id, utilisateurId: req.user.id } },
    });
    if (deja) return res.status(409).json({ message: 'Tu es déjà inscrit(e) à ce hackathon.' });

    const { mode, nomEquipe, codeEquipe, motivation } = req.body || {};
    let equipeExistante = null;
    let nouvelleEquipe = null;

    if (mode === 'creer') {
      if (!nomEquipe || nomEquipe.trim().length < 2) {
        return res.status(400).json({ message: 'Nom d’équipe requis.', errors: { nomEquipe: 'Nom d’équipe requis.' } });
      }
      let code = generateTeamCode();
      // eslint-disable-next-line no-await-in-loop
      while (await prisma.equipe.findUnique({ where: { code } })) code = generateTeamCode();
      nouvelleEquipe = { nom: nomEquipe.trim(), code };
    } else if (mode === 'rejoindre') {
      const code = String(codeEquipe || '').trim().toUpperCase();
      equipeExistante = await prisma.equipe.findFirst({
        where: { code, hackathonId: hackathon.id },
        include: { _count: { select: { membres: true } } },
      });
      if (!equipeExistante) {
        return res.status(400).json({ message: 'Code d’équipe introuvable pour ce hackathon.', errors: { codeEquipe: 'Code introuvable.' } });
      }
      // tailleEquipeMax null = non communiquée : pas de limite imposée
      if (hackathon.tailleEquipeMax && equipeExistante._count.membres >= hackathon.tailleEquipeMax) {
        return res.status(400).json({ message: 'Cette équipe est complète.', errors: { codeEquipe: 'Équipe complète.' } });
      }
    } else if (mode !== 'solo') {
      return res.status(400).json({ message: 'Mode de participation invalide.' });
    }

    try {
      // Transaction : l'équipe et l'inscription sont créées ensemble, ou pas du tout
      const inscription = await prisma.$transaction(async (tx) => {
        const equipe = nouvelleEquipe ? await tx.equipe.create({ data: { ...nouvelleEquipe, hackathonId: hackathon.id } }) : equipeExistante;
        return tx.inscription.create({
          data: {
            utilisateurId: req.user.id,
            hackathonId: hackathon.id,
            mode,
            equipeId: equipe?.id ?? null,
            motivation: String(motivation || '').trim(),
          },
          include: { equipe: true },
        });
      });
      return res.status(201).json({ inscription: versInscription(inscription) });
    } catch (err) {
      // P2002 = contrainte "unique" : deux clics très rapprochés
      if (err.code === 'P2002') return res.status(409).json({ message: 'Tu es déjà inscrit(e) à ce hackathon.' });
      throw err;
    }
  }),
);

export default router;
