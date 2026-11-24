// Réception d'une image (multipart/form-data) avec Multer : un seul fichier, 2 Mo max, JPEG / PNG / WebP.
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { DOSSIER_BANNIERES, TAILLE_MAX_BANNIERE, TYPES_IMAGE } from '../utils/fichiers.js';
import { ErreurApi } from '../utils/erreurs.js';

const stockage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(DOSSIER_BANNIERES, { recursive: true });
    cb(null, DOSSIER_BANNIERES);
  },
  // Nom aléatoire : on n'utilise jamais le nom choisi par l'utilisateur (risque "../", écrasement, caractères spéciaux)
  filename: (req, file, cb) => cb(null, `${randomUUID()}${TYPES_IMAGE[file.mimetype]}`),
});

/** Champ de formulaire "banniere" -> req.file */
export const uploadBanniere = multer({
  storage: stockage,
  limits: { fileSize: TAILLE_MAX_BANNIERE, files: 1, fields: 0 },
  fileFilter: (req, file, cb) => {
    if (TYPES_IMAGE[file.mimetype]) return cb(null, true);
    return cb(new ErreurApi(400, 'Format refusé : JPEG, PNG ou WebP uniquement.', { banniere: 'Format refusé (JPEG, PNG ou WebP).' }));
  },
}).single('banniere');
