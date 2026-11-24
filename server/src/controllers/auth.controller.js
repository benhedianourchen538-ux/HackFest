// Lit la requête, appelle le service, envoie la réponse. Aucune règle métier ici.
import * as authService from '../services/auth.service.js';
import { exigerValide } from '../validators/index.js';
import { validerConnexion, validerInscription } from '../validators/auth.validator.js';

// POST /api/auth/register  { nom, email, password, universite }
export async function register(req, res) {
  exigerValide(validerInscription(req.body));
  res.status(201).json(await authService.inscrire(req.body));
}

// POST /api/auth/login  { email, password }
export async function login(req, res) {
  exigerValide(validerConnexion(req.body), 'E-mail et mot de passe requis.');
  res.json(await authService.connecter(req.body));
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: req.user });
}
