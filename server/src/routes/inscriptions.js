import { Router } from 'express';
import { COLONNES_HACKATHON, requete, versHackathon, versInscription } from '../db.js';
import { asyncRoute, requireAuth } from '../middleware/auth.js';
import { enrich } from '../utils/hackathons.js';

const router = Router();

// GET /api/inscriptions/me : "Mes événements"
router.get(
  '/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const lignes = await requete(
      `select i.*,
         -- noms des membres de l'équipe (vide en solo)
         (select coalesce(json_agg(u2.nom order by i2.cree_le), '[]'::json)
            from inscriptions i2 join utilisateurs u2 on u2.id = i2.utilisateur_id
            where i2.hackathon_id = i.hackathon_id and i2.equipe_code = i.equipe_code) as membres
       from inscriptions i where i.utilisateur_id = $1`,
      [req.user.id],
    );
    if (!lignes.length) return res.json({ inscriptions: [] });

    const hackathons = await requete(
      `select ${COLONNES_HACKATHON} from hackathons h where h.id in (select hackathon_id from inscriptions where utilisateur_id = $1)`,
      [req.user.id],
    );
    const parId = new Map(hackathons.map((l) => [l.id, enrich(versHackathon(l))]));

    const mine = lignes
      .map((l) => ({ ...versInscription(l), membres: l.membres ?? [], hackathon: parId.get(l.hackathon_id) ?? null }))
      .filter((i) => i.hackathon)
      .sort((a, b) => a.hackathon.dateDebut.localeCompare(b.hackathon.dateDebut));

    return res.json({ inscriptions: mine });
  }),
);

// DELETE /api/inscriptions/:id : annuler son inscription
router.delete(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const [ligne] = await requete('select utilisateur_id from inscriptions where id = $1', [req.params.id]);
    if (!ligne) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (ligne.utilisateur_id !== req.user.id) return res.status(403).json({ message: 'Action non autorisée.' });

    await requete('delete from inscriptions where id = $1', [req.params.id]);
    return res.status(204).end();
  }),
);

export default router;
