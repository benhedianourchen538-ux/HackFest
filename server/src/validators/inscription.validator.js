// Données attendues pour s'inscrire à un hackathon (schéma Zod).
import { z } from 'zod';
import { texteFacultatif } from './commun.js';

export const schemaInscriptionHackathon = z
  .object({
    mode: z.enum(['solo', 'creer', 'rejoindre'], { error: 'Mode de participation invalide.' }),
    nomEquipe: texteFacultatif(60),
    codeEquipe: z.string().trim().toUpperCase().max(20, 'Code d’équipe invalide.').optional().default(''),
    motivation: texteFacultatif(1000),
  })
  // Le champ requis dépend du mode choisi
  .superRefine((b, ctx) => {
    if (b.mode === 'creer' && b.nomEquipe.length < 2) ctx.addIssue({ code: 'custom', path: ['nomEquipe'], message: 'Nom d’équipe requis.' });
    if (b.mode === 'rejoindre' && !b.codeEquipe) ctx.addIssue({ code: 'custom', path: ['codeEquipe'], message: 'Code d’équipe requis.' });
  });
