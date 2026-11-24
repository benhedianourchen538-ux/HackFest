// Données attendues pour publier un hackathon et pour filtrer la liste (schémas Zod).
import { z } from 'zod';
import { DOMAINES, FORMATS, REGIONS, STATUTS, TYPES_ORGANISATEUR } from '../constants.js';
import { dateTexte, listeDe, texte, texteFacultatif } from './commun.js';

const messagePlaces = 'Nombre de places invalide.';
const messageEquipe = 'Taille d’équipe invalide (1 à 20).';

export const schemaHackathon = z
  .object({
    titre: texte(5, 120, 'Titre trop court (5 caractères min.).'),
    description: texte(30, 5000, 'Décris le hackathon en 30 caractères minimum.'),
    // Absent -> {} : les erreurs portent alors les noms "organisateurNom" / "organisateurType" attendus par le formulaire
    organisateur: z.preprocess(
      (v) => v ?? {},
      z.object({
        nom: texte(1, 120, 'Nom de l’organisateur requis.'),
        type: z.enum(TYPES_ORGANISATEUR, { error: 'Type d’organisateur invalide.' }),
      }),
    ),
    domaine: z.enum(DOMAINES, { error: 'Domaine invalide.' }),
    format: z.enum(FORMATS, { error: 'Format invalide.' }),
    region: z.enum(REGIONS, { error: 'Région invalide.' }),
    lieu: texte(1, 200, 'Lieu requis.'),
    dateDebut: dateTexte('Date de début requise.'),
    dateFin: dateTexte('Date de fin requise.'),
    dateLimite: dateTexte('Date limite d’inscription requise.'),
    // z.coerce : "12" (texte) devient 12 (nombre)
    places: z.coerce.number({ error: messagePlaces }).int(messagePlaces).min(1, messagePlaces).max(100000, messagePlaces),
    // Vide ou 0 = 4 par défaut (comme avant)
    tailleEquipeMax: z.preprocess(
      (v) => (v === undefined || v === null || v === '' || v === 0 ? 4 : v),
      z.coerce.number({ error: messageEquipe }).int(messageEquipe).min(1, messageEquipe).max(20, messageEquipe),
    ),
    // Les lignes vides du formulaire sont retirées
    prix: z
      .array(z.string().trim().max(200, '200 caractères maximum.'))
      .max(20)
      .optional()
      .default([])
      .transform((liste) => liste.filter(Boolean)),
    programme: z
      .array(z.object({ moment: texteFacultatif(100), titre: texteFacultatif(200) }))
      .max(50)
      .optional()
      .default([])
      .transform((liste) => liste.filter((p) => p.titre)),
    reglement: texteFacultatif(5000),
  })
  // Règles qui comparent plusieurs champs (les dates "AAAA-MM-JJ" se comparent comme du texte)
  .superRefine((h, ctx) => {
    if (h.dateFin < h.dateDebut) ctx.addIssue({ code: 'custom', path: ['dateFin'], message: 'La fin doit être après le début.' });
    if (h.dateLimite > h.dateDebut) ctx.addIssue({ code: 'custom', path: ['dateLimite'], message: 'Doit être avant le début.' });
  });

/** Paramètres de recherche de GET /api/hackathons */
export const schemaFiltres = z.object({
  q: z.string().max(100, 'Recherche trop longue.').optional(),
  organisateur: listeDe(TYPES_ORGANISATEUR),
  region: listeDe(REGIONS),
  domaine: listeDe(DOMAINES),
  statut: listeDe(STATUTS),
  format: listeDe(FORMATS),
  tri: z.enum(['date', 'places', 'recent'], { error: 'Tri inconnu.' }).optional(),
});
