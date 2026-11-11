// Met à jour les hackathons de data/seed.json dans la base (npm run sync-seed).
// Contrairement à reset-db, ne supprime rien : comptes, inscriptions et publications sont conservés.
import './env.js';
import { fermerDb, initialiserDb, synchroniserHackathons } from './db.js';

const base = await initialiserDb();
const n = await synchroniserHackathons();
await fermerDb();
console.log(`${n} hackathons de data/seed.json synchronisés (${base})`);
