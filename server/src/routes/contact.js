import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from '../db.js';

const router = Router();

// POST /api/contact  { nom, email, message }
router.post('/', (req, res) => {
  const { nom, email, message } = req.body || {};
  const errors = {};
  if (!nom) errors.nom = 'Nom requis.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'E-mail invalide.';
  if (!message || message.trim().length < 10) errors.message = 'Message trop court (10 caractères min.).';
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Formulaire invalide.', errors });

  const db = getDb();
  db.messages.push({ id: randomUUID(), nom, email, message: message.trim(), createdAt: new Date().toISOString() });
  saveDb();
  return res.status(201).json({ message: 'Message envoyé.' });
});

export default router;
