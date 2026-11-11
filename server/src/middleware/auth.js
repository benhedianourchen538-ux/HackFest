import jwt from 'jsonwebtoken';
import { requete, versUtilisateur } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'hackfest-dev-secret-a-changer';

export function createToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

/** Retire les champs sensibles avant d'envoyer un utilisateur au client */
export function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

/** Permet d'utiliser des fonctions async dans les routes Express 4 (les erreurs vont au gestionnaire 500) */
export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Vérifie l'en-tête "Authorization: Bearer <token>" et ajoute req.user */
export const requireAuth = asyncRoute(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Connexion requise.' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expirée, reconnecte-toi.' });
  }
  const [ligne] = await requete('select * from utilisateurs where id = $1', [payload.sub]);
  if (!ligne) return res.status(401).json({ message: 'Utilisateur introuvable.' });
  req.user = versUtilisateur(ligne);
  return next();
});
