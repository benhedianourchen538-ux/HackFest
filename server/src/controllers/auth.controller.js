// Lit la requête (déjà validée par Zod), appelle le service, envoie la réponse. Aucune règle métier ici.
import * as authService from '../services/auth.service.js';

// POST /api/auth/register  { nom, email, password, universite, role }
export async function register(req, res) {
  res.status(201).json(await authService.inscrire(req.body));
}

// POST /api/auth/login  { email, password }
export async function login(req, res) {
  res.json(await authService.connecter(req.body));
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: req.user });
}
