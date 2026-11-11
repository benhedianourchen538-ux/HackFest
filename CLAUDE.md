# HackFest : règles du projet

Plateforme de hackathons étudiants en Tunisie. Frontend React 18 + Vite + Tailwind CSS 4 (`client/`), API Node.js + Express avec PostgreSQL (`server/`) : Supabase si `DATABASE_URL` est défini dans `server/.env`, sinon PGlite local (`server/data/pglite`). Le détail est dans le [README.md](README.md).

## Base de données

- Schéma unique : `server/db/schema.sql` (tables et colonnes en français, `snake_case`). Il doit rester ré-exécutable (`if not exists`).
- Toutes les requêtes passent par `requete(sql, params)` de `server/src/db.js`, **toujours paramétrées** (`$1`, `$2`…), jamais de concaténation de valeurs dans le SQL.
- Les lignes SQL sont converties en objets `camelCase` par `versHackathon`, `versUtilisateur`, `versInscription` : le format JSON envoyé au client ne change pas.
- Ne jamais versionner `server/.env` ni coller la chaîne de connexion Supabase dans le code ou dans un message.
- Données réelles uniquement dans `server/data/seed.json` : une information inconnue reste `null` (le site affiche « À confirmer »), on n'invente pas de chiffres.
- RLS doit rester activé sur toutes les tables (sinon l'API publique de Supabase exposerait les comptes).

## Lancer le projet

```bash
cd server && npm install && npm run dev   # API : http://localhost:5000/api
cd client && npm install && npm run dev   # site : http://localhost:5173
```

- Compte de démonstration : `demo@hackfest.tn` / `demo1234`
- `npm run reset-db` (dans `server/`) remet les données de départ (`data/seed.json`).
- `npm run build` (dans `client/`) doit passer sans erreur avant chaque Pull Request.

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
    ├── .env.example             # Modèle de server/.env (DATABASE_URL, JWT_SECRET)
    ├── db/schema.sql            # Tables PostgreSQL
    ├── data/seed.json           # Vrais hackathons (data/pglite est généré, non versionné)
    └── src/
        ├── index.js             # Création du serveur
        ├── env.js               # Chargement de server/.env (importé en premier)
        ├── db.js                # Connexion PostgreSQL (Supabase / PGlite) et conversions
        ├── constants.js         # Valeurs autorisées (mêmes listes que le client)
        ├── middleware/auth.js   # Vérification du jeton JWT
        ├── routes/              # auth, hackathons, inscriptions, contact
        └── utils/hackathons.js  # Filtres, tri, statut (fonctions pures)
```

Règles :
- Une nouvelle page va dans `client/src/pages/`, et sa route dans `App.jsx` (dans `<ProtectedRoute>` si elle demande un compte).
- Pas de `fetch` dans les composants : ajouter une fonction dans `services/api.js`.
- Une liste de valeurs modifiée (domaines, régions…) se modifie **des deux côtés** : `client/src/data/constants.js` et `server/src/constants.js`.
- Toute validation de formulaire existe côté client **et** côté serveur.
- Réutiliser les classes `.btn`, `.btn-primary`, `.card`, `.input`, `.label` et les composants de `ui.jsx` avant d'en créer de nouveaux.

## Git : une branche par fonctionnalité

- Ne jamais travailler directement sur `main`.
- Une branche par fonctionnalité ou correction : `feature/filtres-hackathons`, `feature/auth`, `fix/date-limite-inscription`.
- Commits courts au format `type: description en français` : `feat: ajout du filtre par région`, `fix: date limite d'inscription`, `docs: mise à jour du README`.
- Fusion dans `main` uniquement par Pull Request relue par un coéquipier.

## Avant de rendre une modification

- Aucune erreur ni avertissement dans le terminal et dans la console du navigateur.
- Tester en visiteur **et** connecté (compte démo), en largeur 390 px et 1440 px.
