import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'hackfest-dev-secret-a-changer';

export function createToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

/** Retire les champs sensibles avant d'envoyer un utilisateur au client */
export function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

/** Vérifie l'en-tête "Authorization: Bearer <token>" et ajoute req.user */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Connexion requise.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getDb().users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Session expirée, reconnecte-toi.' });
  }
}
