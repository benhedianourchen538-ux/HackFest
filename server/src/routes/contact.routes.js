// URL de /api/contact -> middlewares -> controller
import { Router } from 'express';
import { envoyer } from '../controllers/contact.controller.js';
import { valider } from '../middlewares/valider.js';
import { schemaMessage } from '../validators/contact.validator.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();

router.post('/', valider({ body: schemaMessage }), gererAsync(envoyer));

export default router;
