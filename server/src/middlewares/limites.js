// Limites de requêtes (express-rate-limit) : freine les robots qui essaient des mots de passe en boucle.
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const QUINZE_MINUTES = 15 * 60 * 1000;

/**
 * Toute l'API : 300 requêtes max en 15 minutes par adresse IP (largement assez pour un vrai visiteur).
 * Protège contre les robots qui aspirent les données ou saturent le serveur.
 * Désactivée pendant les tests automatiques (NODE_ENV=test), qui envoient beaucoup de requêtes d'un coup.
 */
export const limiteGenerale = rateLimit({
  windowMs: QUINZE_MINUTES,
  limit: Number(process.env.LIMITE_REQUETES) || 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({ message: 'Trop de requêtes. Réessaie dans quelques minutes.' });
  },
});

/**
 * Code de vérification : 10 échecs max en 15 min par (IP, e-mail), en plus des 5 essais par code.
 * Renvoi du code : 5 demandes max en 15 min par IP (évite d'inonder une boîte mail).
 */
export const limiteVerification = rateLimit({
  windowMs: QUINZE_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').trim().toLowerCase()}`,
  handler: (req, res) => res.status(429).json({ message: 'Trop de tentatives. Réessaie dans 15 minutes.' }),
});

export const limiteRenvoiCode = rateLimit({
  windowMs: QUINZE_MINUTES,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ message: 'Trop de demandes de code. Réessaie dans 15 minutes.' }),
});

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
