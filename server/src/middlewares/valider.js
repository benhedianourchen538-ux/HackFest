// Validation des entrées avec Zod, AVANT le controller.
// Usage : router.post('/', valider({ body: schemaHackathon }), controller)
// Si tout est bon, req.body / req.query / req.params sont remplacés par les données nettoyées par Zod
// (espaces retirés, nombres convertis, champs inconnus supprimés). Sinon : erreur 400 avec un message par champ.
import { ErreurApi } from '../utils/erreurs.js';

/** Chemin Zod -> nom du champ attendu par le client : ['organisateur', 'nom'] -> "organisateurNom", ['prix', 0] -> "prix" */
function nomDuChamp(chemin) {
  return chemin
    .filter((p) => typeof p === 'string')
    .map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1)))
    .join('');
}

/**
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 * @param {{ message?: string | ((errors: Record<string, string>) => string) }} [options] message général de l'erreur 400
 */
export function valider(schemas, { message = 'Formulaire invalide.' } = {}) {
  return (req, res, next) => {
    const errors = {};
    const propres = {};
    for (const [source, schema] of Object.entries(schemas)) {
      const resultat = schema.safeParse(req[source] ?? {});
      if (resultat.success) {
        propres[source] = resultat.data;
      } else {
        // On garde la première erreur de chaque champ
        for (const issue of resultat.error.issues) {
          const champ = nomDuChamp(issue.path) || source;
          errors[champ] ??= issue.message;
        }
      }
    }
    if (Object.keys(errors).length) {
      return next(new ErreurApi(400, typeof message === 'function' ? message(errors) : message, errors));
    }
    Object.assign(req, propres); // Express 4 : req.body, req.query et req.params sont remplaçables
    return next();
  };
}
