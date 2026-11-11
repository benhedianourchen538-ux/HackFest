// Fonctions pures (sans Express) : faciles à tester.

/** Statut calculé à partir des dates : a-venir | en-cours | termine */
export function getStatut(hackathon, now = new Date()) {
  // "AAAA-MM-JJT00:00:00" (sans "Z") est lu en heure locale, comme côté client.
  // new Date("AAAA-MM-JJ") seul serait lu en UTC : le statut changerait à 1h du matin en Tunisie.
  const debut = new Date(`${hackathon.dateDebut}T00:00:00`);
  const fin = new Date(`${hackathon.dateFin}T23:59:59.999`);
  if (now < debut) return 'a-venir';
  if (now <= fin) return 'en-cours';
  return 'termine';
}

/** Les filtres peuvent contenir plusieurs valeurs séparées par des virgules : ?domaine=sante,fintech */
function toList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // retire les accents (é -> e)
}

/** Ajoute les champs calculés (statut, inscrits, places restantes) */
export function enrich(hackathon, inscriptions, now = new Date()) {
  const inscrits = inscriptions.filter((i) => i.hackathonId === hackathon.id).length;
  return {
    ...hackathon,
    statut: getStatut(hackathon, now),
    inscrits,
    placesRestantes: Math.max(hackathon.places - inscrits, 0),
  };
}

/**
 * Filtre et trie une liste de hackathons déjà enrichis.
 * query : { q, organisateur, region, domaine, statut, format, tri }
 */
export function filterHackathons(list, query = {}) {
  const q = normalize(query.q);
  const organisateurs = toList(query.organisateur);
  const regions = toList(query.region);
  const domaines = toList(query.domaine);
  const statuts = toList(query.statut);
  const formats = toList(query.format);

  let result = list.filter((h) => {
    if (q) {
      const texte = normalize(`${h.titre} ${h.description} ${h.organisateur.nom} ${h.lieu}`);
      if (!texte.includes(q)) return false;
    }
    if (organisateurs.length && !organisateurs.includes(h.organisateur.type)) return false;
    if (regions.length && !regions.includes(h.region)) return false;
    if (domaines.length && !domaines.includes(h.domaine)) return false;
    if (statuts.length && !statuts.includes(h.statut)) return false;
    if (formats.length && !formats.includes(h.format)) return false;
    return true;
  });

  const tri = query.tri || 'date';
  result = [...result].sort((a, b) => {
    if (tri === 'places') return b.placesRestantes - a.placesRestantes;
    if (tri === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
    // Par défaut : les hackathons à venir/en cours d'abord, du plus proche au plus lointain
    const ordre = { 'en-cours': 0, 'a-venir': 1, termine: 2 };
    if (ordre[a.statut] !== ordre[b.statut]) return ordre[a.statut] - ordre[b.statut];
    if (a.statut === 'termine') return new Date(b.dateDebut) - new Date(a.dateDebut);
    return new Date(a.dateDebut) - new Date(b.dateDebut);
  });

  return result;
}

/** Code d'équipe lisible, ex. "HF-7K2Q9" */
export function generateTeamCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HF-';
  for (let i = 0; i < 5; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
