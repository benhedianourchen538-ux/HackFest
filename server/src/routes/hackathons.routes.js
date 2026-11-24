// URL de /api/hackathons -> middlewares -> controller
import { Router } from 'express';
import * as hackathons from '../controllers/hackathons.controller.js';
import * as inscriptions from '../controllers/inscriptions.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { uploadBanniere } from '../middlewares/upload.js';
import { valider } from '../middlewares/valider.js';
import { schemaId } from '../validators/commun.js';
import { schemaFiltres, schemaHackathon } from '../validators/hackathon.validator.js';
import { schemaInscriptionHackathon } from '../validators/inscription.validator.js';
import { gererAsync } from '../utils/erreurs.js';

const router = Router();
const id = valider({ params: schemaId });

router.get('/', valider({ query: schemaFiltres }, { message: 'Paramètres de recherche invalides.' }), gererAsync(hackathons.lister));
// "/mine" est déclarée avant "/:id" pour ne pas être confondue avec un identifiant
router.get('/mine', requireAuth, gererAsync(hackathons.mesPublications));
router.get('/:id', id, gererAsync(hackathons.detail));
router.get('/:id/inscrits', requireAuth, id, gererAsync(hackathons.inscrits));
// Publier : seulement les comptes organisateur (et les admins)
router.post('/', requireAuth, requireRole('organisateur', 'admin'), valider({ body: schemaHackathon }), gererAsync(hackathons.publier));
router.delete('/:id', requireAuth, id, gererAsync(hackathons.supprimer));
// Bannière : connexion -> droits sur ce hackathon -> réception du fichier (Multer) -> enregistrement
router.put('/:id/banniere', requireAuth, id, gererAsync(hackathons.verifierGestion), uploadBanniere, gererAsync(hackathons.changerBanniere));
router.post(
  '/:id/inscriptions',
  requireAuth,
  // Le message du toast reprend la première erreur ("Nom d'équipe requis.", …)
  valider({ params: schemaId, body: schemaInscriptionHackathon }, { message: (errors) => Object.values(errors)[0] }),
  gererAsync(inscriptions.sInscrire),
);

export default router;
