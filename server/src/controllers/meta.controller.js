import { DOMAINES, FORMATS, REGIONS, STATUTS, TYPES_ORGANISATEUR } from '../constants.js';

// GET /api/health : l'API répond-elle ?
export function sante(req, res) {
  res.json({ status: 'ok' });
}

// GET /api/meta : valeurs autorisées (domaines, régions…)
export function meta(req, res) {
  res.json({ typesOrganisateur: TYPES_ORGANISATEUR, domaines: DOMAINES, regions: REGIONS, formats: FORMATS, statuts: STATUTS });
}
