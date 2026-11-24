// Briques Zod réutilisées par plusieurs validators.
import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Texte obligatoire, espaces retirés, longueur bornée */
export const texte = (min, max, message) => z.string({ error: message }).trim().min(min, message).max(max, `${max} caractères maximum.`);

/** Texte facultatif ('' par défaut) */
export const texteFacultatif = (max) => z.string().trim().max(max, `${max} caractères maximum.`).optional().default('');

/** E-mail normalisé (espaces retirés, minuscules) */
export const email = (message = 'Adresse e-mail invalide.') =>
  z.string({ error: message }).trim().toLowerCase().max(254, message).regex(EMAIL_RE, message);

/** "AAAA-MM-JJ" et date qui existe vraiment (pas de 2026-02-31) */
export const dateTexte = (messageRequis) =>
  z
    .string({ error: messageRequis })
    .min(1, messageRequis)
    .regex(DATE_RE, 'Date invalide (format AAAA-MM-JJ).')
    .refine((s) => {
      const [a, m, j] = s.split('-').map(Number);
      const d = new Date(Date.UTC(a, m - 1, j));
      return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
    }, 'Cette date n’existe pas.');

/**
 * Règles d'un mot de passe à l'inscription (les mêmes existent côté client : client/src/data/constants.js).
 * 72 caractères max. : bcrypt ignore ce qui dépasse.
 */
export const REGLES_MOT_DE_PASSE = [
  { test: (m) => m.length >= 8, manque: '8 caractères minimum' },
  { test: (m) => /[A-Z]/.test(m), manque: 'une majuscule' },
  { test: (m) => /[a-z]/.test(m), manque: 'une minuscule' },
  { test: (m) => /[0-9]/.test(m), manque: 'un chiffre' },
  { test: (m) => /[^A-Za-z0-9]/.test(m), manque: 'un symbole (! ? # @ …)' },
];

/** Mot de passe fort : le message liste exactement ce qui manque */
export const motDePasseFort = z
  .string({ error: 'Mot de passe requis.' })
  .max(72, '72 caractères maximum.')
  .superRefine((m, ctx) => {
    const manquants = REGLES_MOT_DE_PASSE.filter((r) => !r.test(m)).map((r) => r.manque);
    if (manquants.length) ctx.addIssue({ code: 'custom', message: `Il manque : ${manquants.join(', ')}.` });
  });

/** Code de vérification : exactement 6 chiffres (espaces tolérés : "123 456") */
export const codeVerification = z
  .string({ error: 'Saisis le code à 6 chiffres.' })
  .transform((c) => c.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{6}$/, 'Saisis le code à 6 chiffres.'));

/** Paramètre ":id" d'une URL */
export const schemaId = z.object({ id: z.string().trim().min(1).max(100, 'Identifiant invalide.') });

/** Liste de valeurs séparées par des virgules, toutes autorisées : "sante,fintech" */
export const listeDe = (valeurs) =>
  z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || v.split(',').map((x) => x.trim()).filter(Boolean).every((x) => valeurs.includes(x)), 'Valeur de filtre inconnue.');
