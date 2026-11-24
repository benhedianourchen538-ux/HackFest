// URL de /api/contact -> controller
import { Router } from 'express';
import { envoyer } from '../controllers/contact.controller.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.post('/', gererAsync(envoyer));

export default router;
