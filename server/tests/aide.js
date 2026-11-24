// Outils communs aux tests : base vide, comptes, hackathons, dates.
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { boiteDeTest } from '../src/services/email.service.js';

export { boiteDeTest };

export const api = () => request(app);

/** Vide toutes les tables du schéma de test (ordre : d'abord ce qui dépend des autres) */
export async function viderBase() {
  await prisma.$transaction([
    prisma.inscription.deleteMany(),
    prisma.equipe.deleteMany(),
    prisma.hackathon.deleteMany(),
    prisma.message.deleteMany(),
    prisma.utilisateur.deleteMany(),
  ]);
}

let compteur = 0;

/** Mot de passe qui respecte les règles (majuscule, minuscule, chiffre, symbole) */
export const MOT_DE_PASSE = 'Hackfest#2026';

/** Dernier code à 6 chiffres "envoyé" à cette adresse (boîte de test en mémoire) */
export function dernierCode(email) {
  const mail = [...boiteDeTest].reverse().find((m) => m.a === email);
  return mail?.texte.match(/\b\d{6}\b/)?.[0];
}

/**
 * Crée un compte par l'API, comme un vrai utilisateur : inscription -> code reçu par e-mail -> saisie du code.
 * Rôle participant ou organisateur ; admin : promu directement en base.
 */
export async function creerCompte(role = 'participant') {
  compteur += 1;
  const email = `${role}-${compteur}-${Date.now()}@test.tn`;
  await api()
    .post('/api/auth/register')
    .send({ nom: `Test ${role} ${compteur}`, email, password: MOT_DE_PASSE, role: role === 'admin' ? 'participant' : role });
  const res = await api().post('/api/auth/verifier-email').send({ email, code: dernierCode(email) });
  if (res.status !== 200) throw new Error(`Vérification impossible : ${res.status} ${JSON.stringify(res.body)}`);
  if (role === 'admin') await prisma.utilisateur.update({ where: { email }, data: { role: 'admin' } });
  return { token: res.body.token, user: res.body.user, email };
}

/** Date "AAAA-MM-JJ" dans n jours (heure locale, comme le reste du projet) */
export function dansNJours(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Données valides pour publier un hackathon à venir */
export function donneesHackathon(changements = {}) {
  return {
    titre: 'Hackathon de test',
    description: 'Un hackathon créé par les tests automatiques de HackFest.',
    organisateur: { nom: 'Club Test', type: 'club' },
    domaine: 'tech-ia',
    region: 'Tunis',
    format: 'presentiel',
    lieu: 'Campus de test',
    dateDebut: dansNJours(30),
    dateFin: dansNJours(31),
    dateLimite: dansNJours(20),
    places: 10,
    tailleEquipeMax: 3,
    ...changements,
  };
}

/** Publie un hackathon avec le jeton d'un organisateur et renvoie son objet JSON */
export async function publierHackathon(token, changements) {
  const res = await api().post('/api/hackathons').set('Authorization', `Bearer ${token}`).send(donneesHackathon(changements));
  if (res.status !== 201) throw new Error(`Publication impossible : ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.hackathon;
}

export { prisma };
