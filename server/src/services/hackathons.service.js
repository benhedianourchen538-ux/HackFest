// Règles métier des hackathons : liste, détail, publication, bannière, suppression, liste des inscrits.
import fs from 'node:fs/promises';
import { prisma } from '../prisma.js';
import { AVEC_INSCRITS, versDonneesHackathon, versHackathon, versInscription } from '../conversions.js';
import { enrich, filterHackathons } from '../utils/hackathons.js';
import { ErreurApi } from '../utils/erreurs.js';
import { URL_BANNIERES, estVraieImage, supprimerBanniere } from '../utils/fichiers.js';

/** Un hackathon enrichi (statut, places restantes), ou une erreur 404 */
export async function trouver(id) {
  const hackathon = await prisma.hackathon.findUnique({ where: { id }, include: AVEC_INSCRITS });
  if (!hackathon) throw new ErreurApi(404, 'Hackathon introuvable.');
  return enrich(versHackathon(hackathon));
}

/** Tous les hackathons, filtrés et triés selon les paramètres de l'URL (?q=&domaine=…) */
export async function lister(filtres) {
  const hackathons = await prisma.hackathon.findMany({ include: AVEC_INSCRITS });
  return filterHackathons(hackathons.map((h) => enrich(versHackathon(h))), filtres);
}

/** Hackathons publiés par un utilisateur, du plus récent au plus ancien */
export async function listerPublications(utilisateurId) {
  const hackathons = await prisma.hackathon.findMany({
    where: { creePar: utilisateurId },
    orderBy: { creeLe: 'desc' },
    include: AVEC_INSCRITS,
  });
  return hackathons.map((h) => enrich(versHackathon(h)));
}

/** L'auteur d'un hackathon, ou un admin (modération) */
const peutGerer = (creePar, utilisateur) => creePar === utilisateur.id || utilisateur.role === 'admin';

/** Inscrits d'un hackathon : réservé à l'organisateur qui l'a publié (ou à un admin) */
export async function listerInscrits(id, utilisateur) {
  const hackathon = await trouver(id);
  if (!peutGerer(hackathon.createdBy, utilisateur)) throw new ErreurApi(403, 'Accès réservé à l’organisateur.');

  const inscriptions = await prisma.inscription.findMany({
    where: { hackathonId: hackathon.id },
    orderBy: { creeLe: 'asc' },
    include: { equipe: true, utilisateur: { select: { nom: true, email: true, universite: true } } },
  });
  return inscriptions.map((i) => {
    const { id: inscriptionId, mode, equipe, createdAt } = versInscription(i);
    return { id: inscriptionId, ...i.utilisateur, mode, equipe, createdAt };
  });
}

/** Publie un hackathon et le renvoie (données déjà nettoyées par Zod : textes sans espaces, nombres convertis) */
export async function publier(donnees, utilisateur) {
  const cree = await prisma.hackathon.create({
    data: { ...versDonneesHackathon(donnees), creePar: utilisateur.id },
  });
  return trouver(cree.id);
}

/** Vérifie que l'utilisateur peut modifier ce hackathon (auteur ou admin) : 404 / 403 sinon */
export async function verifierGestion(id, utilisateur) {
  const hackathon = await prisma.hackathon.findUnique({ where: { id }, select: { creePar: true, banniere: true } });
  if (!hackathon) throw new ErreurApi(404, 'Hackathon introuvable.');
  if (!peutGerer(hackathon.creePar, utilisateur)) throw new ErreurApi(403, 'Action non autorisée.');
  return hackathon;
}

/** Supprime un hackathon que l'on a publié, ou n'importe lequel pour un admin (inscriptions, équipes et bannière partent avec) */
export async function supprimer(id, utilisateur) {
  const { banniere } = await verifierGestion(id, utilisateur);
  await prisma.hackathon.delete({ where: { id } });
  await supprimerBanniere(banniere);
}

/**
 * Enregistre la bannière reçue par Multer (req.file) et remplace l'ancienne.
 * En cas de problème, le fichier reçu est supprimé : aucun fichier orphelin sur le disque.
 */
export async function changerBanniere(id, utilisateur, fichier) {
  if (!fichier) throw new ErreurApi(400, 'Choisis une image.', { banniere: 'Choisis une image.' });
  try {
    if (!(await estVraieImage(fichier.path, fichier.mimetype))) {
      throw new ErreurApi(400, 'Ce fichier n’est pas une vraie image JPEG, PNG ou WebP.', { banniere: 'Image illisible.' });
    }
    const { banniere: ancienne } = await verifierGestion(id, utilisateur);
    await prisma.hackathon.update({ where: { id }, data: { banniere: `${URL_BANNIERES}/${fichier.filename}` } });
    await supprimerBanniere(ancienne);
  } catch (err) {
    await fs.rm(fichier.path, { force: true });
    throw err;
  }
  return trouver(id);
}
