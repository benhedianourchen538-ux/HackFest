// Création de l'application Express (sans la démarrer) : index.js la lance, les tests l'utilisent directement.
import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { gestionnaireErreurs, routeIntrouvable } from './middlewares/erreurs.js';
import { limiteGenerale } from './middlewares/limites.js';
import { DOSSIER_BANNIERES, URL_BANNIERES } from './utils/fichiers.js';

// Adresse(s) du site autorisées à appeler l'API, séparées par des virgules
const ORIGINES = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();

// Derrière un hébergeur (proxy), l'IP du visiteur est dans X-Forwarded-For : TRUST_PROXY=1 pour la lire
// (sinon tous les visiteurs auraient l'IP du proxy et partageraient la même limite de requêtes)
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// 1) En-têtes de sécurité (anti-sniffing, anti-iframe, HSTS…) et suppression de "X-Powered-By: Express"
app.use(helmet());

// 2) CORS : seul notre site peut appeler l'API depuis un navigateur
app.use(cors({ origin: ORIGINES }));

// 3) Limite générale de requêtes par IP (en plus de la limite de connexion)
app.use('/api', limiteGenerale);

app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

// Images des bannières, servies telles quelles (seulement ce dossier, pas de liste des fichiers).
// helmet bloque par défaut le chargement depuis un autre site : on l'autorise ici pour que le site affiche les images.
app.use(
  URL_BANNIERES,
  express.static(DOSSIER_BANNIERES, {
    index: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

// Toujours en dernier : URL inconnue, puis gestion de toutes les erreurs
app.use(routeIntrouvable);
app.use(gestionnaireErreurs);

export default app;
