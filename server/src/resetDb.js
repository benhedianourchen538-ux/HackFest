// Remet la base à zéro à partir de data/seed.json (npm run reset-db).
// ATTENTION : supprime tous les comptes, inscriptions et publications (sur Supabase si DATABASE_URL est défini).
import './env.js';
import { fermerDb, initialiserDb } from './db.js';

const base = await initialiserDb({ reset: true });
await fermerDb();
console.log(`Base réinitialisée à partir de data/seed.json (${base})`);
