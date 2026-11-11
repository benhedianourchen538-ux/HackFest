import { Router } from 'express';
import { getDb, saveDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { enrich } from '../utils/hackathons.js';

const router = Router();

// GET /api/inscriptions/me : "Mes événements"
router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const mine = db.inscriptions
    .filter((i) => i.userId === req.user.id)
    .map((i) => {
      const raw = db.hackathons.find((h) => h.id === i.hackathonId);
      const membres = i.equipe
        ? db.inscriptions
            .filter((x) => x.hackathonId === i.hackathonId && x.equipe?.code === i.equipe.code)
            .map((x) => db.users.find((u) => u.id === x.userId)?.nom)
            .filter(Boolean)
        : [];
      return { ...i, membres, hackathon: raw ? enrich(raw, db.inscriptions) : null };
    })
    .filter((i) => i.hackathon)
    .sort((a, b) => new Date(a.hackathon.dateDebut) - new Date(b.hackathon.dateDebut));

  res.json({ inscriptions: mine });
});

// DELETE /api/inscriptions/:id : annuler son inscription
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const inscription = db.inscriptions.find((i) => i.id === req.params.id);
  if (!inscription) return res.status(404).json({ message: 'Inscription introuvable.' });
  if (inscription.userId !== req.user.id) return res.status(403).json({ message: 'Action non autorisée.' });

  db.inscriptions = db.inscriptions.filter((i) => i.id !== req.params.id);
  saveDb();
  return res.status(204).end();
});

export default router;
