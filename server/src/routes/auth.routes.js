// URL de /api/auth -> controller (et middlewares à passer avant)
import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.post('/register', gererAsync(auth.register));
router.post('/login', gererAsync(auth.login));
router.get('/me', requireAuth, auth.me);

export default router;
