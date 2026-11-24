import { ErreurApi } from '../utils/erreurs.js';

/** Lance une erreur 400 si le validateur a trouvé des erreurs (message général + erreurs par champ) */
export function exigerValide(errors, message = 'Formulaire invalide.') {
  if (Object.keys(errors).length) throw new ErreurApi(400, message, errors);
}
