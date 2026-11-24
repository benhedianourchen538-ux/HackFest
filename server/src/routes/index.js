// Toutes les routes de l'API, montées sous /api dans app.js
import { Router } from 'express';
import { meta, sante } from '../controllers/meta.controller.js';
import authRoutes from './auth.routes.js';
import hackathonRoutes from './hackathons.routes.js';
import inscriptionRoutes from './inscriptions.routes.js';
import contactRoutes from './contact.routes.js';

const router = Router();

router.get('/health', sante);
router.get('/meta', meta);
router.use('/auth', authRoutes);
router.use('/hackathons', hackathonRoutes);
router.use('/inscriptions', inscriptionRoutes);
router.use('/contact', contactRoutes);

export default router;
