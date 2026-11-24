import { ErreurApi } from '../utils/erreurs.js';

/** Aucune route ne correspond à l'URL demandée */
export function routeIntrouvable(req, res) {
  res.status(404).json({ message: 'Route introuvable.' });
}

/**
 * Gestionnaire d'erreurs unique (Express le reconnaît à ses 4 paramètres).
 * Toutes les erreurs de l'API arrivent ici : on renvoie toujours { message, errors? }.
 */
// eslint-disable-next-line no-unused-vars
export function gestionnaireErreurs(err, req, res, next) {
  if (err instanceof ErreurApi) {
    return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }
  // Erreur imprévue : détail dans le terminal, message neutre pour le client
  console.error(err);
  return res.status(500).json({ message: 'Erreur serveur.' });
}
