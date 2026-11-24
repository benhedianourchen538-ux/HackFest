// Démarrage du serveur : vérifie la base, puis écoute sur le port.
import app from './app.js';
import { prisma } from './prisma.js';

const PORT = process.env.PORT || 5000;

try {
  // Vérifie la connexion à PostgreSQL avant d'ouvrir le serveur
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`API HackFest prête sur http://localhost:${PORT}/api`);
  });
} catch (err) {
  console.error('Impossible de se connecter à la base de données :', err.message);
  console.error('Vérifie DATABASE_URL dans server/.env, puis lance : npm run db:migrate');
  process.exit(1);
}
