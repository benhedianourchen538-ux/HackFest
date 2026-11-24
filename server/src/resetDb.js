// Remet la base aux données de départ (npm run reset-db).
// ATTENTION : supprime tous les comptes, inscriptions, équipes, messages et publications.
// (On vide les tables plutôt que "prisma migrate reset", qui supprimerait le schéma "public" de Supabase.)
import { prisma } from './prisma.js';
import { semer } from './seed.js';

await prisma.$transaction([
  prisma.inscription.deleteMany(),
  prisma.equipe.deleteMany(),
  prisma.hackathon.deleteMany(),
  prisma.message.deleteMany(),
  prisma.utilisateur.deleteMany(),
]);
const n = await semer(prisma);
await prisma.$disconnect();
console.log(`Base réinitialisée : compte démo + ${n} hackathons de data/seed.json`);
