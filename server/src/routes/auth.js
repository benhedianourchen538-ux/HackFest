import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requete, versUtilisateur } from '../db.js';
import { asyncRoute, createToken, publicUser, requireAuth } from '../middleware/auth.js';

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
    const existe = await requete('select 1 from utilisateurs where email = $1', [emailNormalise]);
    if (existe.length) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet e-mail.', errors: { email: 'E-mail déjà utilisé.' } });
    }

    const [ligne] = await requete(
      `insert into utilisateurs (nom, email, universite, mot_de_passe_hash) values ($1, $2, $3, $4) returning *`,
      [nom.trim(), emailNormalise, (universite || '').trim(), await bcrypt.hash(password, 10)],
    );
    const user = versUtilisateur(ligne);
    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  }),
);

// POST /api/auth/login  { email, password }
router.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'E-mail et mot de passe requis.' });

    const [ligne] = await requete('select * from utilisateurs where email = $1', [String(email).trim().toLowerCase()]);
    const ok = ligne && (await bcrypt.compare(String(password), ligne.mot_de_passe_hash));
    if (!ok) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });

    const user = versUtilisateur(ligne);
    return res.json({ token: createToken(user), user: publicUser(user) });
  }),
);

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
