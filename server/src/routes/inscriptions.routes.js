// URL de /api/inscriptions -> controller (et middlewares à passer avant)
import { Router } from 'express';
import * as inscriptions from '../controllers/inscriptions.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.get('/me', requireAuth, gererAsync(inscriptions.mesInscriptions));
router.delete('/:id', requireAuth, gererAsync(inscriptions.annuler));

export default router;
