// Conversion des objets Prisma vers le format JSON envoyé au client (identique à l'ancienne API),
// et du format reçu du client vers les champs Prisma.

// Une colonne PostgreSQL "date" arrive dans Prisma sous forme de Date à minuit UTC :
// on la relit donc en UTC pour retrouver "AAAA-MM-JJ" (ici, l'UTC est voulu, contrairement au client).
export function versTexteDate(date) {
  if (!date) return null;
  const mois = String(date.getUTCMonth() + 1).padStart(2, '0');
  const jour = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${mois}-${jour}`;
}

/** "AAAA-MM-JJ" -> Date à minuit UTC, ce que Prisma attend pour une colonne "date" */
export function depuisTexteDate(texte) {
  return texte ? new Date(`${texte}T00:00:00Z`) : null;
}

/** À passer dans "include" pour compter les inscrits d'un hackathon */
export const AVEC_INSCRITS = { _count: { select: { inscriptions: true } } };

export function versHackathon(h) {
  return {
    id: h.id,
    titre: h.titre,
    description: h.description,
    organisateur: { nom: h.organisateurNom, type: h.organisateurType },
    domaine: h.domaine,
    region: h.region,
    format: h.format,
    lieu: h.lieu,
    dateDebut: versTexteDate(h.dateDebut),
    dateFin: versTexteDate(h.dateFin),
    dateLimite: versTexteDate(h.dateLimite),
    places: h.places,
    tailleEquipeMax: h.tailleEquipeMax,
    prix: h.prix ?? [],
    programme: h.programme ?? [],
    reglement: h.reglement,
    lien: h.lien,
    source: h.source,
    banniere: h.banniere ?? null, // null : le site affiche le visuel généré
    createdBy: h.creePar,
    createdAt: h.creeLe.toISOString(),
    inscrits: h._count?.inscriptions ?? 0,
  };
}

/** Hackathon au format de l'API (seed.json, formulaire "Publier") -> données Prisma */
export function versDonneesHackathon(h) {
  return {
    titre: h.titre,
    description: h.description,
    organisateurNom: h.organisateur.nom,
    organisateurType: h.organisateur.type,
    domaine: h.domaine,
    region: h.region,
    format: h.format,
    lieu: h.lieu,
    dateDebut: depuisTexteDate(h.dateDebut),
    dateFin: depuisTexteDate(h.dateFin),
    dateLimite: depuisTexteDate(h.dateLimite),
    places: h.places ?? null,
    tailleEquipeMax: h.tailleEquipeMax ?? null,
    prix: h.prix ?? [],
    programme: h.programme ?? [],
    reglement: h.reglement ?? '',
    lien: h.lien ?? null,
    source: h.source ?? null,
  };
}

/** Utilisateur sans le hash du mot de passe (seuls ces champs partent vers le client) */
export function versUtilisateur(u) {
  return {
    id: u.id,
    nom: u.nom,
    email: u.email,
    universite: u.universite,
    role: u.role,
    createdAt: u.creeLe.toISOString(),
  };
}

/** Inscription (avec "include: { equipe: true }" pour avoir le nom et le code de l'équipe) */
export function versInscription(i) {
  return {
    id: i.id,
    userId: i.utilisateurId,
    hackathonId: i.hackathonId,
    mode: i.mode,
    equipe: i.equipe ? { nom: i.equipe.nom, code: i.equipe.code } : null,
    motivation: i.motivation,
    statut: i.statut,
    createdAt: i.creeLe.toISOString(),
  };
}
