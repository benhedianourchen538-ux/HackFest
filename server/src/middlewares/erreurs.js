import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ErreurApi } from '../utils/erreurs.js';

/** Aucune route ne correspond à l'URL demandée */
export function routeIntrouvable(req, res) {
  res.status(404).json({ message: 'Route introuvable.' });
}

/** Transforme n'importe quelle erreur en { status, message, errors? } */
function traduire(err) {
  // Erreurs prévues, lancées par nos services ou par valider() (Zod)
  if (err instanceof ErreurApi) return err;

  // Erreurs d'express.json() : corps illisible ou trop gros
  if (err.type === 'entity.parse.failed') return new ErreurApi(400, 'Données JSON invalides.');
  if (err.type === 'entity.too.large') return new ErreurApi(413, 'Données trop volumineuses.');

  // Erreurs de Multer (upload de fichier)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return new ErreurApi(413, 'Image trop lourde (2 Mo maximum).', { banniere: 'Image trop lourde (2 Mo maximum).' });
    return new ErreurApi(400, 'Envoie une seule image, dans le champ « banniere ».', { banniere: 'Fichier invalide.' });
  }

  // Erreurs de Prisma qui ont un sens pour l'utilisateur
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return new ErreurApi(409, 'Cet élément existe déjà.'); // contrainte "unique"
    if (err.code === 'P2025') return new ErreurApi(404, 'Élément introuvable.'); // ligne supprimée entre-temps
  }
  return null;
}

/**
 * Gestionnaire d'erreurs unique (Express le reconnaît à ses 4 paramètres).
 * Toutes les erreurs de l'API arrivent ici : la réponse a toujours la forme { message, errors? }.
 */
// eslint-disable-next-line no-unused-vars
export function gestionnaireErreurs(err, req, res, next) {
  const erreur = traduire(err);
  if (erreur) {
    return res.status(erreur.status).json({
      message: erreur.message,
      ...(erreur.errors && { errors: erreur.errors }),
      ...(erreur.code && { code: erreur.code }),
    });
  }
  // Erreur imprévue : détail dans le terminal, message neutre pour le client (on ne dévoile rien du serveur)
  console.error(err);
  return res.status(500).json({ message: 'Erreur serveur.' });
}
