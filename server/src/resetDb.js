// Remet la base à zéro à partir de data/seed.json (npm run reset-db).
import { loadDb } from './db.js';

loadDb({ reset: true });
console.log('Base réinitialisée à partir de data/seed.json');
