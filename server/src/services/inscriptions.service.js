// Règles métier des inscriptions : s'inscrire (solo / créer / rejoindre une équipe), mes inscriptions, annuler.
import { prisma } from '../prisma.js';
import { AVEC_INSCRITS, versHackathon, versInscription } from '../conversions.js';
import { enrich, generateTeamCode } from '../utils/hackathons.js';
import { ErreurApi } from '../utils/erreurs.js';
import { trouver } from './hackathons.service.js';

/** Inscrit l'utilisateur à un hackathon (données déjà validées) et renvoie l'inscription */
export async function sInscrire(hackathonId, utilisateur, { mode, nomEquipe, codeEquipe, motivation }) {
  const hackathon = await trouver(hackathonId);

  // dateLimite ou places à null = non communiqué : on ne bloque pas sur ce critère
  const limiteDepassee = hackathon.dateLimite && new Date() > new Date(`${hackathon.dateLimite}T23:59:59`);
  if (hackathon.statut !== 'a-venir' || limiteDepassee) throw new ErreurApi(400, 'Les inscriptions sont fermées pour ce hackathon.');
  if (hackathon.placesRestantes !== null && hackathon.placesRestantes <= 0) throw new ErreurApi(400, 'Plus de places disponibles.');

  const deja = await prisma.inscription.findUnique({
    where: { hackathonId_utilisateurId: { hackathonId: hackathon.id, utilisateurId: utilisateur.id } },
  });
  if (deja) throw new ErreurApi(409, 'Tu es déjà inscrit(e) à ce hackathon.');

  let equipeExistante = null;
  let nouvelleEquipe = null;
  if (mode === 'creer') {
    let code = generateTeamCode();
    // eslint-disable-next-line no-await-in-loop
    while (await prisma.equipe.findUnique({ where: { code } })) code = generateTeamCode();
    nouvelleEquipe = { nom: nomEquipe.trim(), code };
  } else if (mode === 'rejoindre') {
    equipeExistante = await prisma.equipe.findFirst({
      where: { code: codeEquipe.trim().toUpperCase(), hackathonId: hackathon.id },
      include: { _count: { select: { membres: true } } },
    });
    if (!equipeExistante) throw new ErreurApi(400, 'Code d’équipe introuvable pour ce hackathon.', { codeEquipe: 'Code introuvable.' });
    // tailleEquipeMax null = non communiquée : pas de limite imposée
    if (hackathon.tailleEquipeMax && equipeExistante._count.membres >= hackathon.tailleEquipeMax) {
      throw new ErreurApi(400, 'Cette équipe est complète.', { codeEquipe: 'Équipe complète.' });
    }
  }

  try {
    // Transaction : l'équipe et l'inscription sont créées ensemble, ou pas du tout
    const inscription = await prisma.$transaction(async (tx) => {
      const equipe = nouvelleEquipe ? await tx.equipe.create({ data: { ...nouvelleEquipe, hackathonId: hackathon.id } }) : equipeExistante;
      return tx.inscription.create({
        data: {
          utilisateurId: utilisateur.id,
          hackathonId: hackathon.id,
          mode,
          equipeId: equipe?.id ?? null,
          motivation: String(motivation || '').trim(),
        },
        include: { equipe: true },
      });
    });
    return versInscription(inscription);
  } catch (err) {
    // P2002 = contrainte "unique" : deux clics très rapprochés
    if (err.code === 'P2002') throw new ErreurApi(409, 'Tu es déjà inscrit(e) à ce hackathon.');
    throw err;
  }
}

/** "Mes événements" : inscriptions de l'utilisateur avec le hackathon et les membres de l'équipe */
export async function listerMesInscriptions(utilisateurId) {
  const inscriptions = await prisma.inscription.findMany({
    where: { utilisateurId },
    include: {
      hackathon: { include: AVEC_INSCRITS },
      equipe: { include: { membres: { orderBy: { creeLe: 'asc' }, select: { utilisateur: { select: { nom: true } } } } } },
    },
  });
  return inscriptions
    .map((i) => ({
      ...versInscription(i),
      membres: i.equipe ? i.equipe.membres.map((m) => m.utilisateur.nom) : [], // vide en solo
      hackathon: enrich(versHackathon(i.hackathon)),
    }))
    .sort((a, b) => a.hackathon.dateDebut.localeCompare(b.hackathon.dateDebut));
}

/** Annule sa propre inscription ; le dernier membre qui part supprime l'équipe vide */
export async function annuler(id, utilisateur) {
  const inscription = await prisma.inscription.findUnique({ where: { id } });
  if (!inscription) throw new ErreurApi(404, 'Inscription introuvable.');
  if (inscription.utilisateurId !== utilisateur.id) throw new ErreurApi(403, 'Action non autorisée.');

  await prisma.$transaction(async (tx) => {
    await tx.inscription.delete({ where: { id } });
    if (inscription.equipeId) await tx.equipe.deleteMany({ where: { id: inscription.equipeId, membres: { none: {} } } });
  });
}
