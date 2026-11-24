import { utilisateurDepuisJeton } from '../services/auth.service.js';
import { ErreurApi, gererAsync } from '../utils/erreurs.js';

/** Vérifie l'en-tête "Authorization: Bearer <jeton>" et ajoute req.user */
export const requireAuth = gererAsync(async (req, res, next) => {
  const entete = req.headers.authorization || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : null;
  if (!jeton) throw new ErreurApi(401, 'Connexion requise.');
  req.user = await utilisateurDepuisJeton(jeton);
  next();
});
