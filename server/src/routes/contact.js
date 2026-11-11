import { Router } from 'express';
import { requete } from '../db.js';
import { asyncRoute } from '../middleware/auth.js';

const router = Router();

// POST /api/contact  { nom, email, message }
router.post(
  '/',
  asyncRoute(async (req, res) => {
    const { nom, email, message } = req.body || {};
    const errors = {};
    if (!nom || !String(nom).trim()) errors.nom = 'Nom requis.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'E-mail invalide.';
    if (!message || message.trim().length < 10) errors.message = 'Message trop court (10 caractères min.).';
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Formulaire invalide.', errors });

    await requete('insert into messages (nom, email, message) values ($1, $2, $3)', [String(nom).trim(), email.trim(), message.trim()]);
    return res.status(201).json({ message: 'Message envoyé.' });
  }),
);

export default router;
