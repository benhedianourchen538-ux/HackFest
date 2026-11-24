// Données attendues pour s'inscrire à un hackathon. Renvoie { champ: message } (vide si tout est bon).
const MODES = ['solo', 'creer', 'rejoindre'];

export function validerInscriptionHackathon(b = {}) {
  const errors = {};
  if (!MODES.includes(b.mode)) errors.mode = 'Mode de participation invalide.';
  if (b.mode === 'creer' && (!b.nomEquipe || String(b.nomEquipe).trim().length < 2)) errors.nomEquipe = 'Nom d’équipe requis.';
  if (b.mode === 'rejoindre' && !String(b.codeEquipe || '').trim()) errors.codeEquipe = 'Code d’équipe requis.';
  return errors;
}
