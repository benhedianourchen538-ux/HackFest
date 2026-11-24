// Lit la requête, appelle le service, envoie la réponse. Aucune règle métier ici.
import * as inscriptionsService from '../services/inscriptions.service.js';
import { exigerValide } from '../validators/index.js';
import { validerInscriptionHackathon } from '../validators/inscription.validator.js';

// POST /api/hackathons/:id/inscriptions  { mode: solo|creer|rejoindre, nomEquipe?, codeEquipe?, motivation? }
export async function sInscrire(req, res) {
  const errors = validerInscriptionHackathon(req.body);
  // Le message du toast reprend la première erreur ("Nom d'équipe requis.", …)
  exigerValide(errors, Object.values(errors)[0]);
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
