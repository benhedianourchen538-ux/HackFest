import { Router } from 'express';
import { prisma } from '../prisma.js';
import { AVEC_INSCRITS, versHackathon, versInscription } from '../conversions.js';
import { asyncRoute, requireAuth } from '../middleware/auth.js';
import { enrich } from '../utils/hackathons.js';

const router = Router();

// GET /api/inscriptions/me : "Mes événements"
router.get(
  '/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const inscriptions = await prisma.inscription.findMany({
      where: { utilisateurId: req.user.id },
      include: {
        hackathon: { include: AVEC_INSCRITS },
        // noms des membres de l'équipe (vide en solo)
        equipe: { include: { membres: { orderBy: { creeLe: 'asc' }, select: { utilisateur: { select: { nom: true } } } } } },
      },
    });

    const mine = inscriptions
      .map((i) => ({
        ...versInscription(i),
        membres: i.equipe ? i.equipe.membres.map((m) => m.utilisateur.nom) : [],
        hackathon: enrich(versHackathon(i.hackathon)),
      }))
      .sort((a, b) => a.hackathon.dateDebut.localeCompare(b.hackathon.dateDebut));

    return res.json({ inscriptions: mine });
  }),
);

// DELETE /api/inscriptions/:id : annuler son inscription
router.delete(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const inscription = await prisma.inscription.findUnique({ where: { id: req.params.id } });
    if (!inscription) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (inscription.utilisateurId !== req.user.id) return res.status(403).json({ message: 'Action non autorisée.' });

    await prisma.$transaction(async (tx) => {
      await tx.inscription.delete({ where: { id: inscription.id } });
      // Le dernier membre qui part : l'équipe vide est supprimée
      if (inscription.equipeId) await tx.equipe.deleteMany({ where: { id: inscription.equipeId, membres: { none: {} } } });
    });
    return res.status(204).end();
  }),
);

export default router;
