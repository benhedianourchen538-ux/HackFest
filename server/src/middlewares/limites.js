// Limites de requêtes (express-rate-limit) : freine les robots qui essaient des mots de passe en boucle.
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const QUINZE_MINUTES = 15 * 60 * 1000;

/**
 * Connexion : 5 échecs maximum en 15 minutes pour un même couple (adresse IP, e-mail).
 * Les connexions réussies ne comptent pas (skipSuccessfulRequests).
 */
export const limiteConnexion = rateLimit({
  windowMs: QUINZE_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8', // en-tête RateLimit : le client sait quand réessayer
  legacyHeaders: false,
  // ipKeyGenerator regroupe les adresses IPv6 d'un même réseau (sinon on contournerait la limite en changeant d'adresse)
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').trim().toLowerCase()}`,
  handler: (req, res) => {
    res.status(429).json({ message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' });
  },
});
