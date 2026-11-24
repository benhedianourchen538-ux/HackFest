// Choix de la base des tests : DATABASE_URL_TEST (server/.env), jamais la vraie base.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

/** Renvoie l'adresse de la base de test, ou arrête tout si elle risque d'être la vraie base */
export function adresseBaseTest() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error('DATABASE_URL_TEST manquant dans server/.env (même base que DATABASE_URL, avec "?schema=test" à la fin).');
  }
  // Garde-fou : les tests vident les tables, ils ne doivent jamais toucher au schéma "public" (les vraies données)
  const schema = new URL(url).searchParams.get('schema');
  if (!schema || schema === 'public' || url === process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST doit utiliser un schéma séparé (ex. "?schema=test"), jamais "public".');
  }
  return url;
}
