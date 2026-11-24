// Fichiers envoyés par les utilisateurs (bannières) : dossier, vérification du contenu, suppression.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** server/uploads/bannieres (non versionné) */
export const DOSSIER_BANNIERES = path.join(__dirname, '..', '..', 'uploads', 'bannieres');
/** Adresse publique des bannières : /uploads/bannieres/<nom> */
export const URL_BANNIERES = '/uploads/bannieres';

/** Types d'image acceptés -> extension donnée au fichier enregistré */
export const TYPES_IMAGE = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const TAILLE_MAX_BANNIERE = 2 * 1024 * 1024; // 2 Mo

/**
 * Le type annoncé par le navigateur (mimetype) peut être falsifié :
 * on vérifie aussi les premiers octets du fichier ("signature" propre à chaque format).
 */
export async function estVraieImage(chemin, mimetype) {
  const fichier = await fs.open(chemin, 'r');
  try {
    const { buffer } = await fichier.read(Buffer.alloc(12), 0, 12, 0);
    if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimetype === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    return false;
  } finally {
    await fichier.close();
  }
}

/** Supprime une bannière à partir de son adresse publique (sans erreur si elle n'existe plus) */
export async function supprimerBanniere(adresse) {
  if (!adresse?.startsWith(`${URL_BANNIERES}/`)) return;
  // basename : on ne sort jamais du dossier des bannières, même avec un nom piégé ("../../")
  await fs.rm(path.join(DOSSIER_BANNIERES, path.basename(adresse)), { force: true });
}
