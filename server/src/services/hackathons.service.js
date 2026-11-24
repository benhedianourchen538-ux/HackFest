// Règles métier des hackathons : liste, détail, publication, suppression, liste des inscrits.
import { prisma } from '../prisma.js';
import { AVEC_INSCRITS, versDonneesHackathon, versHackathon, versInscription } from '../conversions.js';
import { enrich, filterHackathons } from '../utils/hackathons.js';
import { ErreurApi } from '../utils/erreurs.js';

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

/** Publie un hackathon (données déjà validées) et le renvoie */
export async function publier(b, utilisateur) {
  const cree = await prisma.hackathon.create({
    data: {
      ...versDonneesHackathon({
        titre: b.titre.trim(),
        description: b.description.trim(),
        organisateur: { nom: b.organisateur.nom.trim(), type: b.organisateur.type },
        domaine: b.domaine,
        region: b.region,
        format: b.format,
        lieu: b.lieu.trim(),
        dateDebut: b.dateDebut,
        dateFin: b.dateFin,
        dateLimite: b.dateLimite,
        places: Number(b.places),
        tailleEquipeMax: Number(b.tailleEquipeMax) || 4,
        prix: Array.isArray(b.prix) ? b.prix.filter(Boolean) : [],
        programme: Array.isArray(b.programme) ? b.programme.filter((p) => p?.titre) : [],
        reglement: (b.reglement || '').trim(),
      }),
      creePar: utilisateur.id,
    },
  });
  return trouver(cree.id);
}

/** Supprime un hackathon que l'on a publié, ou n'importe lequel pour un admin (inscriptions et équipes partent avec) */
export async function supprimer(id, utilisateur) {
  const hackathon = await prisma.hackathon.findUnique({ where: { id }, select: { creePar: true } });
  if (!hackathon) throw new ErreurApi(404, 'Hackathon introuvable.');
  if (!peutGerer(hackathon.creePar, utilisateur)) throw new ErreurApi(403, 'Action non autorisée.');
  await prisma.hackathon.delete({ where: { id } });
}
