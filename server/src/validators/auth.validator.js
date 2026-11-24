// Données attendues par les routes /api/auth (schémas Zod).
import { z } from 'zod';
import { ROLES_INSCRIPTION } from '../constants.js';
import { email, texte, texteFacultatif } from './commun.js';

export const schemaInscription = z.object({
  nom: texte(2, 100, 'Indique ton nom complet.'),
  email: email(),
  // bcrypt ne lit que les 72 premiers octets : au-delà, la fin du mot de passe serait ignorée
  password: z.string({ error: 'Au moins 8 caractères.' }).min(8, 'Au moins 8 caractères.').max(72, '72 caractères maximum.'),
  universite: texteFacultatif(120),
  // Facultatif (participant par défaut) ; "admin" est refusé
  role: z.enum(ROLES_INSCRIPTION, { error: 'Type de compte invalide.' }).optional().default('participant'),
});

export const schemaConnexion = z.object({
  email: z.string({ error: 'E-mail requis.' }).trim().toLowerCase().min(1, 'E-mail requis.').max(254),
  password: z.string({ error: 'Mot de passe requis.' }).min(1, 'Mot de passe requis.').max(200),
});
