// URL de /api/auth -> middlewares -> controller
import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { limiteConnexion, limiteRenvoiCode, limiteVerification } from '../middlewares/limites.js';
import { valider } from '../middlewares/valider.js';
import { schemaConnexion, schemaInscription, schemaRenvoiCode, schemaVerification } from '../validators/auth.validator.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

// Inscription : crée le compte (non vérifié) et envoie un code à 6 chiffres par e-mail
router.post('/register', valider({ body: schemaInscription }), gererAsync(auth.register));
// Saisie du code : active le compte et connecte l'utilisateur
router.post('/verifier-email', limiteVerification, valider({ body: schemaVerification }, { message: (e) => Object.values(e)[0] }), gererAsync(auth.verifierEmail));
router.post('/renvoyer-code', limiteRenvoiCode, valider({ body: schemaRenvoiCode }), gererAsync(auth.renvoyerCode));
// 5 échecs max en 15 min (par IP et par e-mail) : bloque les essais de mots de passe en boucle
router.post('/login', limiteConnexion, valider({ body: schemaConnexion }, { message: 'E-mail et mot de passe requis.' }), gererAsync(auth.login));
router.get('/me', requireAuth, auth.me);

export default router;
