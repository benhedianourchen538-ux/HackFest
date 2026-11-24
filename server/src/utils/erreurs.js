// Erreur "prévue" (404, 403, 409…) : un service la lance avec throw,
// le gestionnaire d'erreurs (middlewares/erreurs.js) la transforme en réponse JSON.
export class ErreurApi extends Error {
  /**
   * @param {number} status code HTTP (400, 401, 403, 404, 409…)
   * @param {string} message message affiché à l'utilisateur
   * @param {Record<string, string>} [errors] erreurs par champ de formulaire
   * @param {string} [code] identifiant lisible par le client (ex. "EMAIL_NON_VERIFIE")
   */
  constructor(status, message, errors, code) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

/** Permet d'utiliser des fonctions async dans Express 4 : une erreur lancée part vers le gestionnaire d'erreurs */
export const gererAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
