// Exécuté UNE fois avant tous les tests (globalSetup) : crée / met à jour les tables du schéma de test.
import { execSync } from 'node:child_process';
import { adresseBaseTest } from './base.js';

export default function avantTout() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: adresseBaseTest() },
    stdio: 'ignore',
  });
}
