import './env.js';
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import authRoutes from './routes/auth.js';
import hackathonRoutes from './routes/hackathons.js';
import inscriptionRoutes from './routes/inscriptions.js';
import contactRoutes from './routes/contact.js';
import { DOMAINES, FORMATS, REGIONS, STATUTS, TYPES_ORGANISATEUR } from './constants.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/meta', (req, res) => {
  res.json({ typesOrganisateur: TYPES_ORGANISATEUR, domaines: DOMAINES, regions: REGIONS, formats: FORMATS, statuts: STATUTS });
});

app.use('/api/auth', authRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route introuvable.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur.' });
});

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
