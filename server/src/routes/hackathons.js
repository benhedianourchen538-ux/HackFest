import { Router } from 'express';
import { COLONNES_HACKATHON, insererHackathon, requete, versHackathon, versInscription } from '../db.js';
import { asyncRoute, requireAuth } from '../middleware/auth.js';
import { enrich, filterHackathons, generateTeamCode } from '../utils/hackathons.js';
import { DOMAINES, FORMATS, REGIONS, TYPES_ORGANISATEUR } from '../constants.js';

const router = Router();

/** Un hackathon enrichi (statut, places restantes), ou null s'il n'existe pas */
async function trouverHackathon(id) {
  const [ligne] = await requete(`select ${COLONNES_HACKATHON} from hackathons h where h.id = $1`, [id]);
  return ligne ? enrich(versHackathon(ligne)) : null;
}

// GET /api/hackathons?q=&organisateur=&region=&domaine=&statut=&format=&tri=
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const lignes = await requete(`select ${COLONNES_HACKATHON} from hackathons h`);
    const result = filterHackathons(lignes.map((l) => enrich(versHackathon(l))), req.query);
    res.json({ total: result.length, hackathons: result });
  }),
);

// GET /api/hackathons/mine : hackathons publiés par l'utilisateur connecté
// (déclarée avant "/:id" pour ne pas être confondue avec un identifiant)
router.get(
  '/mine',
  requireAuth,
  asyncRoute(async (req, res) => {
    const lignes = await requete(`select ${COLONNES_HACKATHON} from hackathons h where h.cree_par = $1 order by h.cree_le desc`, [req.user.id]);
    res.json({ hackathons: lignes.map((l) => enrich(versHackathon(l))) });
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

    const lignes = await requete(
      `select i.*, u.nom, u.email, u.universite
       from inscriptions i join utilisateurs u on u.id = i.utilisateur_id
       where i.hackathon_id = $1 order by i.cree_le`,
      [hackathon.id],
    );
    const inscrits = lignes.map((l) => {
      const i = versInscription(l);
      return { id: i.id, nom: l.nom, email: l.email, universite: l.universite, mode: i.mode, equipe: i.equipe, createdAt: i.createdAt };
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
    const id = await insererHackathon(
      {
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
      },
      req.user.id,
    );
    return res.status(201).json({ hackathon: await trouverHackathon(id) });
  }),
);

// DELETE /api/hackathons/:id : supprimer un hackathon que l'on a publié (ses inscriptions partent avec : "on delete cascade")
router.delete(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const [ligne] = await requete('select cree_par from hackathons where id = $1', [req.params.id]);
    if (!ligne) return res.status(404).json({ message: 'Hackathon introuvable.' });
    if (ligne.cree_par !== req.user.id) return res.status(403).json({ message: 'Action non autorisée.' });

    await requete('delete from hackathons where id = $1', [req.params.id]);
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
    const deja = await requete('select 1 from inscriptions where hackathon_id = $1 and utilisateur_id = $2', [hackathon.id, req.user.id]);
    if (deja.length) return res.status(409).json({ message: 'Tu es déjà inscrit(e) à ce hackathon.' });

    const { mode, nomEquipe, codeEquipe, motivation } = req.body || {};
    let equipe = null;

    if (mode === 'creer') {
      if (!nomEquipe || nomEquipe.trim().length < 2) {
        return res.status(400).json({ message: 'Nom d’équipe requis.', errors: { nomEquipe: 'Nom d’équipe requis.' } });
      }
      let code = generateTeamCode();
      // eslint-disable-next-line no-await-in-loop
      while ((await requete('select 1 from inscriptions where equipe_code = $1', [code])).length) code = generateTeamCode();
      equipe = { nom: nomEquipe.trim(), code };
    } else if (mode === 'rejoindre') {
      const code = String(codeEquipe || '').trim().toUpperCase();
      const membres = await requete('select equipe_nom from inscriptions where hackathon_id = $1 and equipe_code = $2', [hackathon.id, code]);
      if (!membres.length) {
        return res.status(400).json({ message: 'Code d’équipe introuvable pour ce hackathon.', errors: { codeEquipe: 'Code introuvable.' } });
      }
      if (membres.length >= (hackathon.tailleEquipeMax || 4)) {
        return res.status(400).json({ message: 'Cette équipe est complète.', errors: { codeEquipe: 'Équipe complète.' } });
      }
      equipe = { nom: membres[0].equipe_nom, code };
    } else if (mode !== 'solo') {
      return res.status(400).json({ message: 'Mode de participation invalide.' });
    }

    try {
      const [ligne] = await requete(
        `insert into inscriptions (utilisateur_id, hackathon_id, mode, equipe_nom, equipe_code, motivation)
         values ($1, $2, $3, $4, $5, $6) returning *`,
        [req.user.id, hackathon.id, mode, equipe?.nom ?? null, equipe?.code ?? null, String(motivation || '').trim()],
      );
      return res.status(201).json({ inscription: versInscription(ligne) });
    } catch (err) {
      // 23505 = contrainte "unique" : deux clics très rapprochés
      if (err.code === '23505') return res.status(409).json({ message: 'Tu es déjà inscrit(e) à ce hackathon.' });
      throw err;
    }
  }),
);

export default router;
