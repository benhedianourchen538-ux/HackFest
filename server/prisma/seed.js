// Lancé par "npx prisma db seed" (et automatiquement après "prisma migrate reset").
import { prisma } from '../src/prisma.js';
import { semer } from '../src/seed.js';

const n = await semer(prisma);
await prisma.$disconnect();
console.log(`Seed terminé : compte démo + ${n} hackathons de data/seed.json`);
