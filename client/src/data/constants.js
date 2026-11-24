// Libellés affichés pour les valeurs envoyées par l'API.

export const TYPES_ORGANISATEUR = [
  { value: 'universite', label: 'Université' },
  { value: 'club', label: 'Club étudiant' },
  { value: 'organisation', label: 'Organisation' },
];

export const DOMAINES = [
  { value: 'tech-ia', label: 'Tech & IA', color: 'bg-glace text-tech' },
  { value: 'environnement', label: 'Environnement', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'sante', label: 'Santé', color: 'bg-rose-50 text-rose-700' },
  { value: 'fintech', label: 'Fintech', color: 'bg-amber-50 text-amber-700' },
  { value: 'education', label: 'Éducation', color: 'bg-violet-50 text-violet-700' },
  { value: 'impact-social', label: 'Impact social', color: 'bg-orange-50 text-orange-700' },
  { value: 'cybersecurite', label: 'Cybersécurité', color: 'bg-slate-100 text-slate-700' },
  { value: 'programmation', label: 'Programmation compétitive', color: 'bg-glace text-navy' },
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

export const FORMATS = [
  { value: 'presentiel', label: 'Présentiel' },
  { value: 'en-ligne', label: 'En ligne' },
];

export const STATUTS = [
  { value: 'a-venir', label: 'À venir', color: 'bg-glace text-tech' },
  { value: 'en-cours', label: 'En cours', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'termine', label: 'Terminé', color: 'bg-slate-100 text-slate-600' },
];

export const TRIS = [
  { value: 'date', label: 'Date la plus proche' },
  { value: 'recent', label: 'Ajoutés récemment' },
  { value: 'places', label: 'Places disponibles' },
];

// Rôles qu'on peut choisir en créant son compte (mêmes valeurs que server/src/constants.js ; "admin" ne se choisit pas)
export const ROLES_INSCRIPTION = [
  { value: 'participant', label: 'Participant', description: 'Je m’inscris aux hackathons.' },
  { value: 'organisateur', label: 'Organisateur', description: 'Je publie aussi des hackathons.' },
];

// Règles du mot de passe à l'inscription (mêmes règles que server/src/validators/commun.js)
export const REGLES_MOT_DE_PASSE = [
  { label: '8 caractères minimum', test: (m) => m.length >= 8 },
  { label: 'Une majuscule', test: (m) => /[A-Z]/.test(m) },
  { label: 'Une minuscule', test: (m) => /[a-z]/.test(m) },
  { label: 'Un chiffre', test: (m) => /[0-9]/.test(m) },
  { label: 'Un symbole (! ? # @ …)', test: (m) => /[^A-Za-z0-9]/.test(m) },
];

// Vérification de l'e-mail (mêmes valeurs que server/src/services/auth.service.js)
export const VERIFICATION = { dureeMinutes: 15, delaiRenvoiSecondes: 60 };

// Rôles autorisés à publier (même règle que requireRole côté serveur)
export const ROLES_PUBLICATION = ['organisateur', 'admin'];
export const peutPublier = (user) => Boolean(user && ROLES_PUBLICATION.includes(user.role));

// Bannière d'un hackathon : mêmes limites que le serveur (server/src/utils/fichiers.js)
export const BANNIERE = {
  types: ['image/jpeg', 'image/png', 'image/webp'],
  tailleMax: 2 * 1024 * 1024, // 2 Mo
};

export const labelOf = (list, value) => list.find((item) => item.value === value)?.label ?? value;
export const domaineOf = (value) => DOMAINES.find((d) => d.value === value) ?? DOMAINES[0];
export const statutOf = (value) => STATUTS.find((s) => s.value === value) ?? STATUTS[0];
