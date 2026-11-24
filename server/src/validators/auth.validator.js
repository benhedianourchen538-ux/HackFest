// Données attendues par les routes /api/auth. Chaque fonction renvoie { champ: message } (vide si tout est bon).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validerInscription(b = {}) {
  const errors = {};
  if (!b.nom || String(b.nom).trim().length < 2) errors.nom = 'Indique ton nom complet.';
  if (!b.email || !EMAIL_RE.test(b.email)) errors.email = 'Adresse e-mail invalide.';
  if (!b.password || String(b.password).length < 8) errors.password = 'Au moins 8 caractères.';
  return errors;
}

export function validerConnexion(b = {}) {
  const errors = {};
  if (!b.email) errors.email = 'E-mail requis.';
  if (!b.password) errors.password = 'Mot de passe requis.';
  return errors;
}
