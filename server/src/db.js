// "Base de données" minimale : un fichier JSON lu au démarrage et réécrit à chaque modification.
// Suffisant pour l'objectif 3 ; à remplacer plus tard par PostgreSQL (Supabase) + Prisma.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'seed.json');

let data = null;

export const DEMO_USER = {
  email: 'demo@hackfest.tn',
  password: 'demo1234',
};

function createFromSeed() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  const demo = {
    id: 'u-demo',
    nom: 'Compte Démo',
    email: DEMO_USER.email,
    universite: "SUP'COM",
    passwordHash: bcrypt.hashSync(DEMO_USER.password, 10),
    createdAt: new Date().toISOString(),
  };
  return {
    users: [demo],
    hackathons: seed.hackathons,
    inscriptions: [],
    messages: [],
  };
}

export function loadDb({ reset = false } = {}) {
  if (reset || !fs.existsSync(DB_PATH)) {
    data = createFromSeed();
    saveDb();
  } else {
    data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }
  return data;
}

export function getDb() {
  if (!data) loadDb();
  return data;
}

export function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
