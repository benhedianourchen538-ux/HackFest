const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const shortFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

// Les dates "AAAA-MM-JJ" sont lues en heure locale pour éviter les décalages d'un jour.
export function parseDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

/** Date du jour au format "AAAA-MM-JJ" en heure locale (toISOString() donnerait la date UTC) */
export function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : '';
}

/** "5 – 6 déc. 2026" ou "30 janv. 2027" */
export function formatPeriode(debut, fin) {
  if (!fin || debut === fin) return formatDate(debut);
  const d1 = parseDate(debut);
  const d2 = parseDate(fin);
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    return `${d1.getDate()} – ${dateFormatter.format(d2)}`;
  }
  return `${shortFormatter.format(d1)} – ${dateFormatter.format(d2)}`;
}

/** Nombre de jours entre aujourd'hui et une date (négatif si passée) */
export function joursAvant(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(value) - today) / 86400000);
}

/** dateLimite ou places à null = non communiqué : ce critère ne bloque pas l'inscription */
export function inscriptionsOuvertes(hackathon) {
  const limiteOk = !hackathon.dateLimite || joursAvant(hackathon.dateLimite) >= 0;
  const placesOk = hackathon.placesRestantes == null || hackathon.placesRestantes > 0;
  return hackathon.statut === 'a-venir' && limiteOk && placesOk;
}

/** Texte affiché quand une information n'a pas encore été communiquée */
export const A_CONFIRMER = 'À confirmer';
