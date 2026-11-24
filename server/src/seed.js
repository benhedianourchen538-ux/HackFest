// Données de départ : compte démo + hackathons réels de data/seed.json.
// Sans danger à relancer : rien n'est supprimé, les hackathons du fichier sont créés ou mis à jour.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { versDonneesHackathon } from './conversions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');

export const DEMO_USER = { email: 'demo@hackfest.tn', password: 'demo1234' };

export async function semer(prisma) {
  // Compte démo (organisateur : il peut tout tester, y compris "Publier")
  await prisma.utilisateur.upsert({
    where: { email: DEMO_USER.email },
    update: {},
    create: {
      id: 'u-demo',
      nom: 'Compte Démo',
      email: DEMO_USER.email,
      universite: "SUP'COM",
      role: 'organisateur',
      motDePasseHash: await bcrypt.hash(DEMO_USER.password, 10),
    },
  });

  // Compte admin seulement s'il est demandé dans server/.env (jamais de mot de passe admin dans le code)
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await prisma.utilisateur.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: { role: 'admin' },
      create: {
        nom: 'Administrateur',
        email: ADMIN_EMAIL.toLowerCase(),
        role: 'admin',
        motDePasseHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      },
    });
  }

  const { hackathons } = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  for (const h of hackathons) {
    const donnees = versDonneesHackathon(h);
    // eslint-disable-next-line no-await-in-loop
    await prisma.hackathon.upsert({ where: { id: h.id }, update: donnees, create: { id: h.id, ...donnees } });
  }
  return hackathons.length;
}
