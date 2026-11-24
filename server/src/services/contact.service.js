// Enregistre un message du formulaire de contact.
import { prisma } from '../prisma.js';

export async function envoyerMessage({ nom, email, message }) {
  await prisma.message.create({ data: { nom: String(nom).trim(), email: email.trim(), message: message.trim() } });
}
