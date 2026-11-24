// Lit la requête (déjà validée par Zod), appelle le service, envoie la réponse. Aucune règle métier ici.
import * as authService from '../services/auth.service.js';

// POST /api/auth/register  { nom, email, password, universite, role } -> code envoyé par e-mail (pas encore de jeton)
export async function register(req, res) {
  res.status(201).json(await authService.inscrire(req.body));
}

// POST /api/auth/verifier-email  { email, code } -> { token, user }
export async function verifierEmail(req, res) {
  res.json(await authService.verifierEmail(req.body));
}

// POST /api/auth/renvoyer-code  { email }
export async function renvoyerCode(req, res) {
  res.json(await authService.renvoyerCode(req.body));
}

// POST /api/auth/login  { email, password }
export async function login(req, res) {
  res.json(await authService.connecter(req.body));
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: req.user });
}
