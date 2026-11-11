import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from '../db.js';
import { createToken, publicUser, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  { nom, email, password, universite }
router.post('/register', async (req, res) => {
  const { nom, email, password, universite } = req.body || {};
  const errors = {};
  if (!nom || nom.trim().length < 2) errors.nom = 'Indique ton nom complet.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Adresse e-mail invalide.';
  if (!password || password.length < 8) errors.password = 'Au moins 8 caractères.';
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Formulaire invalide.', errors });

  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ message: 'Un compte existe déjà avec cet e-mail.', errors: { email: 'E-mail déjà utilisé.' } });
  }

  try {
    const user = {
      id: randomUUID(),
      nom: nom.trim(),
      email: normalizedEmail,
      universite: (universite || '').trim(),
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb();
    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'E-mail et mot de passe requis.' });

  const user = getDb().users.find((u) => u.email === String(email).trim().toLowerCase());
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });

  return res.json({ token: createToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
