// Lit la requête (déjà validée par Zod), appelle le service, envoie la réponse.
import { envoyerMessage } from '../services/contact.service.js';

// POST /api/contact  { nom, email, message }
export async function envoyer(req, res) {
  await envoyerMessage(req.body);
  res.status(201).json({ message: 'Message envoyé.' });
}
