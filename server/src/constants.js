// Valeurs autorisées pour les filtres et les formulaires.
// Les mêmes listes existent côté client (client/src/data/constants.js).

export const TYPES_ORGANISATEUR = ['universite', 'club', 'organisation'];

// Rôles qu'on peut choisir en créant son compte ("admin" ne se choisit pas : il est donné par le seed ou en base)
export const ROLES_INSCRIPTION = ['participant', 'organisateur'];

export const DOMAINES = [
  'tech-ia',
  'environnement',
  'sante',
  'fintech',
  'education',
  'impact-social',
  'cybersecurite',
  'programmation',
];

export const REGIONS = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Bizerte',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Gabès',
  'Médenine',
  'En ligne',
];

export const FORMATS = ['presentiel', 'en-ligne'];

export const STATUTS = ['a-venir', 'en-cours', 'termine'];
