// URL de /api/inscriptions -> middlewares -> controller
import { Router } from 'express';
import * as inscriptions from '../controllers/inscriptions.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { valider } from '../middlewares/valider.js';
import { schemaId } from '../validators/commun.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.get('/me', requireAuth, gererAsync(inscriptions.mesInscriptions));
router.delete('/:id', requireAuth, valider({ params: schemaId }), gererAsync(inscriptions.annuler));

export default router;
