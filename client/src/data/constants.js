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

export const labelOf = (list, value) => list.find((item) => item.value === value)?.label ?? value;
export const domaineOf = (value) => DOMAINES.find((d) => d.value === value) ?? DOMAINES[0];
export const statutOf = (value) => STATUTS.find((s) => s.value === value) ?? STATUTS[0];
