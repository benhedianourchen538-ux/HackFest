// Accès à la base PostgreSQL.
// - Si DATABASE_URL est défini (fichier server/.env) : base Supabase en ligne.
// - Sinon : PostgreSQL local intégré (PGlite), stocké dans server/data/pglite. Aucune installation nécessaire.
// Les deux utilisent le même schéma (db/schema.sql) et les mêmes requêtes SQL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');
const PGLITE_DIR = path.join(__dirname, '..', 'data', 'pglite');

export const DEMO_USER = {
  email: 'demo@hackfest.tn',
  password: 'demo1234',
};

let client = null;

async function connecter() {
  if (client) return client;
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase impose une connexion chiffrée (SSL)
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    client = {
      nom: 'Supabase',
      query: (texte, params) => pool.query(texte, params),
      exec: (sql) => pool.query(sql),
      fermer: () => pool.end(),
    };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite(PGLITE_DIR);
    client = {
      nom: 'PostgreSQL local (PGlite)',
      query: (texte, params) => db.query(texte, params),
      exec: (sql) => db.exec(sql),
      fermer: () => db.close(),
    };
  }
  return client;
}

/** Exécute une requête SQL paramétrée ($1, $2…) et renvoie les lignes */
export async function requete(texte, params = []) {
  const c = await connecter();
  const resultat = await c.query(texte, params);
  return resultat.rows;
}

export async function fermerDb() {
  if (client) await client.fermer();
  client = null;
}

// ---------- Conversion lignes SQL (snake_case) -> objets envoyés au client (camelCase) ----------

/** Colonnes d'un hackathon + nombre d'inscrits (les dates sont renvoyées en texte "AAAA-MM-JJ") */
export const COLONNES_HACKATHON = `
  h.id, h.titre, h.description, h.organisateur_nom, h.organisateur_type, h.domaine, h.region, h.format, h.lieu,
  h.date_debut::text as date_debut, h.date_fin::text as date_fin, h.date_limite::text as date_limite,
  h.places, h.taille_equipe_max, h.prix, h.programme, h.reglement, h.lien, h.source, h.cree_par, h.cree_le,
  (select count(*)::int from inscriptions i where i.hackathon_id = h.id) as inscrits`;

export function versHackathon(l) {
  return {
    id: l.id,
    titre: l.titre,
    description: l.description,
    organisateur: { nom: l.organisateur_nom, type: l.organisateur_type },
    domaine: l.domaine,
    region: l.region,
    format: l.format,
    lieu: l.lieu,
    dateDebut: l.date_debut,
    dateFin: l.date_fin,
    dateLimite: l.date_limite,
    places: l.places,
    tailleEquipeMax: l.taille_equipe_max,
    prix: l.prix ?? [],
    programme: l.programme ?? [],
    reglement: l.reglement,
    lien: l.lien,
    source: l.source,
    createdBy: l.cree_par,
    createdAt: new Date(l.cree_le).toISOString(),
    inscrits: l.inscrits ?? 0,
  };
}

export function versUtilisateur(l) {
  return {
    id: l.id,
    nom: l.nom,
    email: l.email,
    universite: l.universite,
    passwordHash: l.mot_de_passe_hash,
    createdAt: new Date(l.cree_le).toISOString(),
  };
}

export function versInscription(l) {
  return {
    id: l.id,
    userId: l.utilisateur_id,
    hackathonId: l.hackathon_id,
    mode: l.mode,
    equipe: l.equipe_code ? { nom: l.equipe_nom, code: l.equipe_code } : null,
    motivation: l.motivation,
    statut: l.statut,
    createdAt: new Date(l.cree_le).toISOString(),
  };
}

// ---------- Création des tables et données de départ ----------

/**
 * Insère un hackathon et renvoie son id.
 * majSiExiste = true : si l'id existe déjà, met à jour ses informations (utilisé par npm run sync-seed).
 */
export async function insererHackathon(h, creePar = null, { majSiExiste = false } = {}) {
  const conflit = majSiExiste
    ? `on conflict (id) do update set titre = excluded.titre, description = excluded.description,
         organisateur_nom = excluded.organisateur_nom, organisateur_type = excluded.organisateur_type,
         domaine = excluded.domaine, region = excluded.region, format = excluded.format, lieu = excluded.lieu,
         date_debut = excluded.date_debut, date_fin = excluded.date_fin, date_limite = excluded.date_limite,
         places = excluded.places, taille_equipe_max = excluded.taille_equipe_max, prix = excluded.prix,
         programme = excluded.programme, reglement = excluded.reglement, lien = excluded.lien, source = excluded.source`
    : '';
  const lignes = await requete(
    `insert into hackathons (id, titre, description, organisateur_nom, organisateur_type, domaine, region, format, lieu,
       date_debut, date_fin, date_limite, places, taille_equipe_max, prix, programme, reglement, lien, source, cree_par)
     values (coalesce($1, gen_random_uuid()::text), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
       $15::jsonb, $16::jsonb, $17, $18, $19, $20)
     ${conflit}
     returning id`,
    [
      h.id ?? null,
      h.titre,
      h.description,
      h.organisateur.nom,
      h.organisateur.type,
      h.domaine,
      h.region,
      h.format,
      h.lieu,
      h.dateDebut,
      h.dateFin,
      h.dateLimite ?? null,
      h.places ?? null,
      h.tailleEquipeMax ?? 4,
      JSON.stringify(h.prix ?? []),
      JSON.stringify(h.programme ?? []),
      h.reglement ?? '',
      h.lien ?? null,
      h.source ?? null,
      creePar,
    ],
  );
  return lignes[0].id;
}

async function insererDonneesDeDepart() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  await requete(
    `insert into utilisateurs (id, nom, email, universite, mot_de_passe_hash) values ($1, $2, $3, $4, $5)
     on conflict (email) do nothing`,
    ['u-demo', 'Compte Démo', DEMO_USER.email, "SUP'COM", bcrypt.hashSync(DEMO_USER.password, 10)],
  );
  for (const h of seed.hackathons) await insererHackathon(h);
}

/** Ajoute ou met à jour les hackathons de data/seed.json, sans toucher aux comptes ni aux inscriptions */
export async function synchroniserHackathons() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  for (const h of seed.hackathons) await insererHackathon(h, null, { majSiExiste: true });
  return seed.hackathons.length;
}

/**
 * Crée les tables si besoin. Au tout premier lancement (aucun utilisateur), insère les données de départ.
 * reset = true : supprime tout et recommence (npm run reset-db).
 */
export async function initialiserDb({ reset = false } = {}) {
  const c = await connecter();
  if (reset) await c.exec('drop table if exists inscriptions, messages, hackathons, utilisateurs cascade;');
  await c.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const [{ n }] = await requete('select count(*)::int as n from utilisateurs');
  if (n === 0) await insererDonneesDeDepart();
  return c.nom;
}
