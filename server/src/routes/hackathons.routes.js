// URL de /api/hackathons -> controller (et middlewares à passer avant)
import { Router } from 'express';
import * as hackathons from '../controllers/hackathons.controller.js';
import * as inscriptions from '../controllers/inscriptions.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.get('/', gererAsync(hackathons.lister));
// "/mine" est déclarée avant "/:id" pour ne pas être confondue avec un identifiant
router.get('/mine', requireAuth, gererAsync(hackathons.mesPublications));
router.get('/:id', gererAsync(hackathons.detail));
router.get('/:id/inscrits', requireAuth, gererAsync(hackathons.inscrits));
router.post('/', requireAuth, gererAsync(hackathons.publier));
router.delete('/:id', requireAuth, gererAsync(hackathons.supprimer));
router.post('/:id/inscriptions', requireAuth, gererAsync(inscriptions.sInscrire));

export default router;
