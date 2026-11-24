// Configuration des tests automatiques (npm test)
export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {}, // code ESM natif, pas de Babel
  globalSetup: './tests/preparation/avantTout.js', // tables du schéma de test
  setupFiles: ['./tests/preparation/environnement.js'], // base de test + NODE_ENV=test
  testTimeout: 30000, // la base est en ligne (Supabase) : requêtes plus lentes qu'en local
};
