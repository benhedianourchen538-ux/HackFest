// Données attendues par le formulaire de contact (schéma Zod).
import { z } from 'zod';
import { email, texte } from './commun.js';

export const schemaMessage = z.object({
  nom: texte(1, 100, 'Nom requis.'),
  email: email('E-mail invalide.'),
  message: texte(10, 5000, 'Message trop court (10 caractères min.).'),
});
