import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { versUtilisateur } from '../conversions.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'hackfest-dev-secret-a-changer';

export function createToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
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
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: payload.sub } });
  if (!utilisateur) return res.status(401).json({ message: 'Utilisateur introuvable.' });
  req.user = versUtilisateur(utilisateur);
  return next();
});
