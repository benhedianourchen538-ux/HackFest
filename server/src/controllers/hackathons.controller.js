// Lit la requête (déjà validée par Zod), appelle le service, envoie la réponse. Aucune règle métier ici.
import * as hackathonsService from '../services/hackathons.service.js';

// GET /api/hackathons?q=&organisateur=&region=&domaine=&statut=&format=&tri=
export async function lister(req, res) {
  const hackathons = await hackathonsService.lister(req.query);
  res.json({ total: hackathons.length, hackathons });
}

// GET /api/hackathons/mine
export async function mesPublications(req, res) {
  res.json({ hackathons: await hackathonsService.listerPublications(req.user.id) });
}

// GET /api/hackathons/:id
export async function detail(req, res) {
  res.json({ hackathon: await hackathonsService.trouver(req.params.id) });
}

// GET /api/hackathons/:id/inscrits
export async function inscrits(req, res) {
  res.json({ inscrits: await hackathonsService.listerInscrits(req.params.id, req.user) });
}

// POST /api/hackathons
export async function publier(req, res) {
  res.status(201).json({ hackathon: await hackathonsService.publier(req.body, req.user) });
}

// DELETE /api/hackathons/:id
export async function supprimer(req, res) {
  await hackathonsService.supprimer(req.params.id, req.user);
  res.status(204).end();
}
