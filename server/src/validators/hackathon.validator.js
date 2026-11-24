// Données attendues pour publier un hackathon. Renvoie { champ: message } (vide si tout est bon).
import { DOMAINES, FORMATS, REGIONS, TYPES_ORGANISATEUR } from '../constants.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validerHackathon(b = {}) {
  const errors = {};
  if (!b.titre || b.titre.trim().length < 5) errors.titre = 'Titre trop court (5 caractères min.).';
  if (!b.description || b.description.trim().length < 30) errors.description = 'Décris le hackathon en 30 caractères minimum.';
  if (!b.organisateur?.nom) errors.organisateurNom = 'Nom de l’organisateur requis.';
  if (!TYPES_ORGANISATEUR.includes(b.organisateur?.type)) errors.organisateurType = 'Type d’organisateur invalide.';
  if (!DOMAINES.includes(b.domaine)) errors.domaine = 'Domaine invalide.';
  if (!FORMATS.includes(b.format)) errors.format = 'Format invalide.';
  if (!REGIONS.includes(b.region)) errors.region = 'Région invalide.';
  if (!b.lieu) errors.lieu = 'Lieu requis.';
  // Les dates doivent être au format "AAAA-MM-JJ" (valeur d'un <input type="date">)
  for (const champ of ['dateDebut', 'dateFin', 'dateLimite']) {
    if (b[champ] && !DATE_RE.test(b[champ])) errors[champ] = 'Date invalide (format AAAA-MM-JJ).';
  }
  if (!b.dateDebut) errors.dateDebut = 'Date de début requise.';
  if (!b.dateFin) errors.dateFin = 'Date de fin requise.';
  if (b.dateDebut && b.dateFin && b.dateFin < b.dateDebut) errors.dateFin = 'La fin doit être après le début.';
  if (!b.dateLimite) errors.dateLimite = 'Date limite d’inscription requise.';
  if (b.dateLimite && b.dateDebut && b.dateLimite > b.dateDebut) errors.dateLimite = 'Doit être avant le début.';
  const places = Number(b.places);
  if (!Number.isInteger(places) || places < 1) errors.places = 'Nombre de places invalide.';
  return errors;
}
