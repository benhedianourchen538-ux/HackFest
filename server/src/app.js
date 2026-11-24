// Création de l'application Express (sans la démarrer) : index.js la lance, les tests l'utilisent directement.
import './env.js';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { gestionnaireErreurs, routeIntrouvable } from './middlewares/erreurs.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

// Toujours en dernier : URL inconnue, puis gestion de toutes les erreurs
app.use(routeIntrouvable);
app.use(gestionnaireErreurs);

export default app;
