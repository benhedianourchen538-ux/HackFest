// Lit la requête, appelle le service, envoie la réponse. Aucune règle métier ici.
import { envoyerMessage } from '../services/contact.service.js';
import { exigerValide } from '../validators/index.js';
import { validerMessage } from '../validators/contact.validator.js';

// POST /api/contact  { nom, email, message }
export async function envoyer(req, res) {
  exigerValide(validerMessage(req.body));
  await envoyerMessage(req.body);
  res.status(201).json({ message: 'Message envoyé.' });
}
