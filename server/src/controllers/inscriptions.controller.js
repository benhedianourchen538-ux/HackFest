// Lit la requête (déjà validée par Zod), appelle le service, envoie la réponse. Aucune règle métier ici.
import * as inscriptionsService from '../services/inscriptions.service.js';

// POST /api/hackathons/:id/inscriptions  { mode: solo|creer|rejoindre, nomEquipe?, codeEquipe?, motivation? }
export async function sInscrire(req, res) {
  res.status(201).json({ inscription: await inscriptionsService.sInscrire(req.params.id, req.user, req.body) });
}

// GET /api/inscriptions/me
export async function mesInscriptions(req, res) {
  res.json({ inscriptions: await inscriptionsService.listerMesInscriptions(req.user.id) });
}

// DELETE /api/inscriptions/:id
export async function annuler(req, res) {
  await inscriptionsService.annuler(req.params.id, req.user);
  res.status(204).end();
}
