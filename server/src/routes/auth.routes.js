// URL de /api/auth -> controller (et middlewares à passer avant)
import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { limiteConnexion } from '../middlewares/limites.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.post('/register', gererAsync(auth.register));
// 5 échecs max en 15 min (par IP et par e-mail) : bloque les essais de mots de passe en boucle
router.post('/login', limiteConnexion, gererAsync(auth.login));
router.get('/me', requireAuth, auth.me);

export default router;
