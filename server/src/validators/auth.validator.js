// Données attendues par les routes /api/auth (schémas Zod).
import { z } from 'zod';
import { ROLES_INSCRIPTION } from '../constants.js';
import { codeVerification, email, motDePasseFort, texte, texteFacultatif } from './commun.js';

export const schemaInscription = z.object({
  nom: texte(2, 100, 'Indique ton nom complet.'),
  email: email(),
  // 8 caractères min. avec majuscule, minuscule, chiffre et symbole
  password: motDePasseFort,
  universite: texteFacultatif(120),
  // Facultatif (participant par défaut) ; "admin" est refusé
  role: z.enum(ROLES_INSCRIPTION, { error: 'Type de compte invalide.' }).optional().default('participant'),
});

// À la connexion, on ne vérifie pas la force du mot de passe : les anciens comptes (ex. compte démo) restent valides
export const schemaConnexion = z.object({
  email: z.string({ error: 'E-mail requis.' }).trim().toLowerCase().min(1, 'E-mail requis.').max(254),
  password: z.string({ error: 'Mot de passe requis.' }).min(1, 'Mot de passe requis.').max(200),
});

export const schemaVerification = z.object({
  email: email(),
  code: codeVerification,
});

export const schemaRenvoiCode = z.object({
  email: email(),
});
