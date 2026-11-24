import { utilisateurDepuisJeton } from '../services/auth.service.js';
import { ErreurApi, gererAsync } from '../utils/erreurs.js';

/** Vérifie l'en-tête "Authorization: Bearer <jeton>" et ajoute req.user (avec son rôle, relu en base) */
export const requireAuth = gererAsync(async (req, res, next) => {
  const entete = req.headers.authorization || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : null;
  if (!jeton) throw new ErreurApi(401, 'Connexion requise.');
  req.user = await utilisateurDepuisJeton(jeton);
  next();
});

/**
 * Autorise seulement certains rôles. À placer après requireAuth :
 *   router.post('/', requireAuth, requireRole('organisateur', 'admin'), …)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new ErreurApi(403, 'Ton type de compte ne permet pas cette action.'));
    }
    return next();
  };
}
