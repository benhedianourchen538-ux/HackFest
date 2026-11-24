# HackFest : règles du projet

Plateforme de hackathons étudiants en Tunisie. Frontend React 18 + Vite + Tailwind CSS 4 (`client/`), API Node.js + Express + **Prisma** sur PostgreSQL hébergé par Supabase (`server/`, `DATABASE_URL` dans `server/.env`, obligatoire). Le détail est dans le [README.md](README.md).

**Le client ne parle qu'à notre API Express** : pas de SDK Supabase, pas de Supabase Auth, pas de Supabase Storage dans `client/`. Supabase n'est qu'un hébergeur PostgreSQL.

## Base de données (Prisma)

- Structure : `server/prisma/schema.prisma`. Modèles et champs en `camelCase` dans le code, tables et colonnes en français `snake_case` en base grâce à `@map` / `@@map`.
- Tout changement de structure = `npx prisma migrate dev --name <nom>`, puis commiter le dossier créé dans `prisma/migrations/`. Ne jamais modifier une migration déjà appliquée. Les contraintes `CHECK` et RLS s'écrivent à la main dans le SQL de la migration.
- Accès à la base uniquement via le client unique `prisma` de `server/src/prisma.js`, dans les **services**. Pas de SQL brut (`$queryRawUnsafe`) avec des valeurs venant de l'utilisateur.
- Les objets Prisma sont convertis par `versHackathon`, `versUtilisateur`, `versInscription` (`server/src/conversions.js`) : le format JSON envoyé au client ne change pas. Les colonnes `date` arrivent en `Date` à minuit UTC : passer par `versTexteDate` / `depuisTexteDate`.
- Ne jamais versionner `server/.env` ni coller la chaîne de connexion Supabase dans le code ou dans un message.
- Données réelles uniquement dans `server/data/seed.json` : une information inconnue reste `null` (le site affiche « À confirmer »), on n'invente pas de chiffres.
- RLS doit rester activé sur toutes les tables, y compris `_prisma_migrations` et toute nouvelle table (sinon l'API publique de Supabase exposerait les comptes).

## Backend : où mettre le code

- `routes/` : URL → middlewares → controller. `controllers/` : lire `req`, appeler un service, répondre. `services/` : règles métier + Prisma ; une erreur prévue = `throw new ErreurApi(status, message, errors?)`.
- Toute entrée (body, query, params) est validée par un schéma **Zod** de `validators/` via le middleware `valider(...)`. Les noms d'erreurs suivent les champs du formulaire client (`organisateurNom`…).
- Droits : `requireAuth`, puis `requireRole('organisateur', 'admin')` ; « auteur ou admin » est vérifié dans le service.
- Les erreurs passent toutes par `middlewares/erreurs.js` (réponse `{ message, errors?, code? }`). Pas de `res.status(500)` ailleurs.
- Comptes : mot de passe fort (règles `REGLES_MOT_DE_PASSE`, identiques côté client et serveur) et e-mail vérifié par un code à 6 chiffres avant toute connexion. Les e-mails partent uniquement par `services/email.service.js` (Nodemailer, `SMTP_USER` / `SMTP_PASS` dans `server/.env`, jamais dans le code). Une valeur venant de l'utilisateur insérée dans le HTML d'un e-mail est toujours échappée.

## Lancer le projet

```bash
cd server && npm install && npm run db:migrate && npm run dev   # API : http://localhost:5000/api
cd client && npm install && npm run dev                         # site : http://localhost:5173
```

- Compte de démonstration : `demo@hackfest.tn` / `demo1234` (organisateur).
- `npm run db:seed` (dans `server/`) ajoute / met à jour les données de départ sans rien supprimer ; `npm run reset-db` supprime tout puis relance le seed.
- `npm test` (dans `server/`) et `npm run build` (dans `client/`) doivent passer avant chaque Pull Request. Les tests utilisent `DATABASE_URL_TEST` (`?schema=test`), jamais le schéma `public`.
- Projet Supabase gratuit en pause après ~7 jours d'inactivité (`tenant/user … not found`) : « Resume project » dans le dashboard.

## Palette (obligatoire)

N'utiliser que ces couleurs, via les classes Tailwind définies dans `client/src/index.css` (`@theme`). Pas de code hexadécimal en dur dans les composants.

| Nom | Hex | Classe Tailwind | Usage |
|---|---|---|---|
| Navy | `#123B63` | `navy` (`bg-navy`, `text-navy`) | Titres, fonds sombres, bouton secondaire |
| Bleu Tech | `#1769AA` | `tech` | Icônes, liens, focus |
| Rouge | `#D92735` | `sup` | Bouton principal, accents, erreurs |
| Corail | `#F05A5A` | `corail` | Mise en valeur sur fond navy |
| Bleu Glacé | `#EAF3FA` | `glace` | Fonds de section, badges |
| Menthe | `#36B7A0` | `menthe` | Succès, étapes validées |

Couleurs neutres déjà définies : `clair` (#F4F6F8, fond de page) et `texte` (#263445, texte courant). Polices : Poppins (`font-display`, titres) et Inter (`font-sans`, texte).

Pour une nouvelle couleur, l'ajouter d'abord dans `@theme` puis l'utiliser par son nom.

## Langue et nommage

- **Tous les textes visibles sont en français** (boutons, messages d'erreur, toasts, `aria-label`, messages de l'API). Tutoiement de l'utilisateur, comme dans le reste du site.
- **Noms de variables, fonctions, routes et champs en français** : `inscription`, `hackathon`, `organisateur`, `dateLimite`, `charger()`, `supprimer()`…
- Composants et pages en `PascalCase.jsx` ; fonctions et variables en `camelCase` ; constantes en `MAJUSCULES`.
- Commentaires en français.
- Les valeurs envoyées à l'API sont des identifiants sans accent (`tech-ia`, `a-venir`, `en-ligne`) ; les libellés affichés sont dans `client/src/data/constants.js`.
- Les dates sont des chaînes `AAAA-MM-JJ`, lues en heure locale (`parseDate()`, `aujourdhui()` dans `client/src/utils/format.js`). Ne jamais utiliser `new Date("AAAA-MM-JJ")` ni `toISOString().slice(0, 10)` : ils travaillent en UTC.

## Structure des dossiers

```
hackfest/
├── client/                      # Frontend React + Vite
│   └── src/
│       ├── main.jsx             # Point d'entrée (Router + contextes)
│       ├── App.jsx              # Déclaration des routes
│       ├── index.css            # Tailwind + palette (@theme) + classes .btn, .card, .input…
│       ├── components/          # Composants réutilisables
│       │   ├── layout/          # Navbar, Footer, Layout
│       │   └── ui.jsx           # Spinner, Stepper, Field, EmptyState, PageHeader…
│       ├── context/             # AuthContext, ToastContext
│       ├── pages/               # Une page = un fichier
│       ├── services/api.js      # TOUS les appels à l'API passent par ici
│       ├── data/constants.js    # Domaines, régions, statuts… (libellés)
│       └── utils/format.js      # Dates en français, règles d'inscription
└── server/                      # API Node.js + Express
    ├── .env.example             # Modèle de server/.env (DATABASE_URL, DATABASE_URL_TEST, JWT_SECRET…)
    ├── prisma/                  # schema.prisma, migrations/, seed.js
    ├── data/seed.json           # Vrais hackathons
    ├── uploads/bannieres/       # Images envoyées (non versionné)
    ├── tests/                   # Jest + Supertest (*.test.js, aide.js)
    └── src/
        ├── index.js             # Démarrage (connexion base + écoute)
        ├── app.js               # Application Express (helmet, cors, limites, routes, erreurs)
        ├── env.js               # Chargement de server/.env (importé en premier)
        ├── prisma.js            # Client Prisma unique
        ├── conversions.js       # Objets Prisma -> JSON du client
        ├── constants.js         # Valeurs autorisées (mêmes listes que le client)
        ├── routes/              # *.routes.js
        ├── controllers/         # *.controller.js
        ├── services/            # *.service.js (règles métier + Prisma)
        ├── validators/          # Schémas Zod
        ├── middlewares/         # auth, valider, upload (Multer), limites, erreurs
        └── utils/               # erreurs (ErreurApi), fichiers, hackathons (filtres, tri, statut)
```

Règles :
- Une nouvelle page va dans `client/src/pages/`, et sa route dans `App.jsx` (dans `<ProtectedRoute>` si elle demande un compte).
- Pas de `fetch` dans les composants : ajouter une fonction dans `services/api.js`.
- Une liste de valeurs modifiée (domaines, régions…) se modifie **des deux côtés** : `client/src/data/constants.js` et `server/src/constants.js`.
- Toute validation de formulaire existe côté client **et** côté serveur (schéma Zod).
- Les pages réservées à un rôle passent `roles` à `<ProtectedRoute>` ; l'API vérifie aussi le rôle (ne jamais compter sur le client seul).
- Réutiliser les classes `.btn`, `.btn-primary`, `.card`, `.input`, `.label` et les composants de `ui.jsx` avant d'en créer de nouveaux.

## Git : une branche par fonctionnalité

- Ne jamais travailler directement sur `main`.
- Une branche par fonctionnalité ou correction : `feature/filtres-hackathons`, `feature/auth`, `fix/date-limite-inscription`.
- Commits courts au format `type: description en français` : `feat: ajout du filtre par région`, `fix: date limite d'inscription`, `docs: mise à jour du README`.
- Fusion dans `main` uniquement par Pull Request relue par un coéquipier.

## Avant de rendre une modification

- Aucune erreur ni avertissement dans le terminal et dans la console du navigateur.
- Tester en visiteur **et** connecté (compte démo), en largeur 390 px et 1440 px.
