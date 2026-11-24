// Données attendues par le formulaire de contact. Renvoie { champ: message } (vide si tout est bon).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validerMessage(b = {}) {
  const errors = {};
  if (!b.nom || !String(b.nom).trim()) errors.nom = 'Nom requis.';
  if (!b.email || !EMAIL_RE.test(b.email)) errors.email = 'E-mail invalide.';
  if (!b.message || String(b.message).trim().length < 10) errors.message = 'Message trop court (10 caractères min.).';
  return errors;
}
