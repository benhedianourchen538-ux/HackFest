// Outils communs aux tests : base vide, comptes, hackathons, dates.
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/prisma.js';

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

/** Crée un compte par l'API (rôle participant ou organisateur) ; admin : promu directement en base */
export async function creerCompte(role = 'participant') {
  compteur += 1;
  const email = `${role}-${compteur}-${Date.now()}@test.tn`;
  const res = await api()
    .post('/api/auth/register')
    .send({ nom: `Test ${role} ${compteur}`, email, password: 'motdepasse1', role: role === 'admin' ? 'participant' : role });
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
