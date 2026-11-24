import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { versUtilisateur } from '../conversions.js';
import { asyncRoute, createToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  { nom, email, password, universite }
router.post(
  '/register',
  asyncRoute(async (req, res) => {
    const { nom, email, password, universite } = req.body || {};
    const errors = {};
    if (!nom || nom.trim().length < 2) errors.nom = 'Indique ton nom complet.';
    if (!email || !EMAIL_RE.test(email)) errors.email = 'Adresse e-mail invalide.';
    if (!password || password.length < 8) errors.password = 'Au moins 8 caractères.';
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Formulaire invalide.', errors });

    const emailNormalise = email.trim().toLowerCase();
    if (await prisma.utilisateur.findUnique({ where: { email: emailNormalise } })) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet e-mail.', errors: { email: 'E-mail déjà utilisé.' } });
    }

    const utilisateur = await prisma.utilisateur.create({
      data: { nom: nom.trim(), email: emailNormalise, universite: (universite || '').trim(), motDePasseHash: await bcrypt.hash(password, 10) },
    });
    return res.status(201).json({ token: createToken(utilisateur), user: versUtilisateur(utilisateur) });
  }),
);

// POST /api/auth/login  { email, password }
router.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'E-mail et mot de passe requis.' });

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    const ok = utilisateur && (await bcrypt.compare(String(password), utilisateur.motDePasseHash));
    if (!ok) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });

    return res.json({ token: createToken(utilisateur), user: versUtilisateur(utilisateur) });
  }),
);

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
