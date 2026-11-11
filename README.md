# HackFest – Plateforme de hackathons étudiants

**Projet Web · Objectif 3 : développement et intégration des fonctionnalités principales**
Groupe : _GroupeX_ (à compléter : noms des membres)

HackFest réunit les hackathons étudiants de Tunisie sur une seule plateforme. Un visiteur peut **consulter et filtrer** les hackathons ; une fois connecté, il peut **s’inscrire** (en solo ou en équipe), retrouver **ses événements à venir** et **publier ses propres hackathons**.

---

## 1. Choix techniques

| Couche | Technologies | Pourquoi |
|---|---|---|
| Structure & style | HTML5, CSS3, JavaScript + **Tailwind CSS 4** | Langages déjà maîtrisés. Tailwind applique la palette du projet (Navy `#123B63`, Bleu Tech `#1769AA`, Rouge SUP’COM `#D92735`…) sous forme de classes réutilisables (`bg-navy`, `text-sup`…). |
| Frontend | **React 18 + Vite**, React Router 6 | React est connu de l’équipe (même logique qu’Expo). Vite remplace `create-react-app`, qui n’est plus maintenu : démarrage et rechargement beaucoup plus rapides. |
| Gestion d’état | React Hooks (`useState`, `useEffect`) + Context API | Suffisant pour ce projet : `AuthContext` (utilisateur connecté) et `ToastContext` (notifications). Pas besoin de Redux. |
| Backend | **Node.js + Express** (API REST) | Le même langage (JavaScript) côté client et côté serveur. |
| Données | **PostgreSQL** : **Supabase** en ligne, ou **PGlite** (PostgreSQL intégré) en local, avec le pilote `pg` | Vraie base relationnelle (tables, clés étrangères, contraintes). Le même schéma (`server/db/schema.sql`) sert en local et sur Supabase : sans configuration, le projet se lance quand même. |
| Authentification | **JWT** (`jsonwebtoken`) + mots de passe hachés (`bcryptjs`) | Connexion sécurisée sans service externe, donc le projet se lance sans configuration. Prévu ensuite : Supabase Auth. |
| Icônes / polices | lucide-react, Poppins (titres) et Inter (texte) | Icônes légères ; polices de la charte graphique. |

## 2. Fonctionnalités développées

**Pages publiques (sans compte)**
- **Accueil** : hero, chiffres clés, 3 prochains hackathons, accès par domaine, « Comment ça marche », **Qui sommes-nous**, **FAQ** en accordéon, **formulaire de contact** (validé puis enregistré par l’API).
- **Hackathons** : liste complète avec
  - recherche texte (titre, organisateur, ville, sans tenir compte des accents) ;
  - filtres **Organisé par** (université / club / organisation), **Région**, **Domaine** (Tech & IA, environnement, santé…), **Statut** et **Format** ;
  - tri (date, ajout récent, places) et filtres actifs affichés en « chips » supprimables ;
  - filtres enregistrés dans l’URL (on peut partager un lien filtré) ;
  - panneau de filtres plein écran sur mobile, et un message quand aucun résultat ne correspond.
- **Détail d’un hackathon** : présentation, programme, prix, règlement, places restantes (barre de progression) et une carte d’inscription qui reste visible. Sans compte, le bouton devient « Connecte-toi pour t’inscrire » et ramène sur la page après la connexion.
- **Connexion / Création de compte** : onglets, validation des champs, affichage du mot de passe, compte de démonstration.

**Pages réservées aux utilisateurs connectés**
- **Inscription à un hackathon** en 3 étapes : informations → participation (solo, **créer une équipe** avec un code à partager, **rejoindre une équipe** avec un code) → confirmation avec acceptation du règlement.
- **Mes événements** : onglets À venir / Passés, compte à rebours, équipe et coéquipiers, annulation de l’inscription.
- **Publier un hackathon** en 5 étapes (infos → dates & lieu → programme & prix → règlement → aperçu), **brouillon** enregistré dans le navigateur, validation côté client et côté serveur.
- **Mes publications** : nombre d’inscrits, liste des inscrits, **export CSV**, suppression.

**Transversal**
- Barre de navigation différente pour un visiteur et pour un utilisateur connecté, menu mobile, routes protégées.
- Notifications (toasts) de succès et d’erreur, états de chargement, page 404.
- Responsive (mobile, tablette, ordinateur) et accessibilité : balises sémantiques, labels, `aria-*`, focus visible, lien « Aller au contenu », contrastes de la palette.

## 3. Lancer le projet

Prérequis : **Node.js 18.18 ou plus récent** (`node -v`) et npm.

**Terminal 1 : l’API**
```bash
cd server
npm install
npm run dev          # API sur http://localhost:5000/api
```

**Terminal 2 : le site**
```bash
cd client
npm install
npm run dev          # site sur http://localhost:5173
```

**Compte de démonstration :** `demo@hackfest.tn` / `demo1234` (ou crée ton propre compte).

Sans configuration, l’API utilise une base PostgreSQL locale (`server/data/pglite`), créée et remplie automatiquement au premier lancement.

### Brancher la base Supabase
1. Créer un compte sur [supabase.com](https://supabase.com), puis **New project** (région *Central EU (Frankfurt)*, plan Free). **Noter le mot de passe de la base.**
2. Dans le projet : bouton **Connect** → **Connection string** → **Session pooler** → copier l’URI.
3. Copier `server/.env.example` en `server/.env` et remplir :
   ```
   DATABASE_URL=postgresql://postgres.xxxx:MOT_DE_PASSE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=une-longue-chaine-aleatoire
   ```
4. Relancer `npm run dev` dans `server/` : les tables sont créées et les hackathons insérés automatiquement. Le terminal affiche `base : Supabase`.

`server/.env` n’est jamais versionné (`.gitignore`) : chaque membre de l’équipe crée le sien. Les tables ont la sécurité RLS activée, donc l’API REST publique de Supabase ne peut pas les lire ; seule notre API Express y accède.

Commandes utiles :
- `npm run sync-seed` (dans `server/`) ajoute ou met à jour dans la base les hackathons de `data/seed.json`, **sans rien supprimer**. À lancer après avoir complété des informations dans ce fichier.
- `npm run reset-db` (dans `server/`) supprime **toutes** les données (comptes, inscriptions) et remet les hackathons de `data/seed.json`. Sur Supabase si `DATABASE_URL` est défini.
- `npm run build` (dans `client/`) crée la version de production dans `client/dist`.
- Pour changer l’adresse de l’API, copie `client/.env.example` en `client/.env`.

## 4. Organisation du code

```
hackfest/
├── client/                      # Frontend React + Vite
│   ├── index.html
│   └── src/
│       ├── main.jsx             # Point d'entrée (Router + contextes)
│       ├── App.jsx              # Déclaration des routes
│       ├── index.css            # Tailwind + palette + composants CSS (.btn, .card…)
│       ├── components/          # Composants réutilisables
│       │   ├── layout/          # Navbar, Footer, Layout
│       │   ├── HackathonCard.jsx, Cover.jsx, ProtectedRoute.jsx
│       │   └── ui.jsx           # Spinner, Stepper, Field, EmptyState…
│       ├── context/             # AuthContext, ToastContext
│       ├── pages/               # Une page = un fichier
│       ├── services/api.js      # Tous les appels à l'API
│       ├── data/constants.js    # Domaines, régions, types d'organisateurs
│       └── utils/format.js      # Dates en français, règles d'inscription
└── server/                      # API Node.js + Express
    ├── .env.example             # Modèle de configuration (DATABASE_URL Supabase, JWT_SECRET)
    ├── db/schema.sql            # Tables PostgreSQL (utilisateurs, hackathons, inscriptions, messages)
    ├── data/seed.json           # Vrais hackathons insérés au premier lancement
    └── src/
        ├── index.js             # Création du serveur
        ├── env.js               # Chargement de server/.env
        ├── db.js                # Connexion PostgreSQL (Supabase ou PGlite local), conversion des lignes
        ├── middleware/auth.js   # Vérification du jeton JWT
        ├── routes/              # auth, hackathons, inscriptions, contact
        └── utils/hackathons.js  # Filtres, tri, statut (fonctions pures)
```

Conventions : composants et pages en `PascalCase.jsx`, fonctions et variables en `camelCase`, noms métier en français (`inscription`, `hackathon`, `organisateur`).

## 5. API REST

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/api/auth/register` | public | Créer un compte |
| POST | `/api/auth/login` | public | Se connecter (renvoie un jeton) |
| GET | `/api/auth/me` | connecté | Utilisateur courant |
| GET | `/api/hackathons?q=&organisateur=&region=&domaine=&statut=&format=&tri=` | public | Liste filtrée (plusieurs valeurs séparées par des virgules) |
| GET | `/api/hackathons/:id` | public | Détail |
| POST | `/api/hackathons` | connecté | Publier |
| GET | `/api/hackathons/mine` | connecté | Mes publications |
| GET | `/api/hackathons/:id/inscrits` | organisateur | Liste des inscrits |
| DELETE | `/api/hackathons/:id` | organisateur | Supprimer |
| POST | `/api/hackathons/:id/inscriptions` | connecté | S’inscrire (`solo`, `creer`, `rejoindre`) |
| GET | `/api/inscriptions/me` | connecté | Mes événements |
| DELETE | `/api/inscriptions/:id` | connecté | Annuler une inscription |
| POST | `/api/contact` | public | Formulaire de contact |

Règles vérifiées par le serveur : pas de double inscription (aussi garanti par une contrainte `unique` en base), places limitées, inscriptions fermées après la date limite, taille maximale des équipes, seul l’organisateur voit ses inscrits. Une date limite ou un nombre de places à `null` signifie « non communiqué » : le site affiche « À confirmer » et ce critère ne bloque pas l’inscription.

## 6. Travail en équipe

- **Git :** une branche par fonctionnalité (`feature/filtres-hackathons`, `feature/auth`, `feature/publier`…), fusion dans `main` par Pull Request relue par un coéquipier. Commits clairs : `feat: ajout du filtre par région`, `fix: date limite d'inscription`.
- **Suivi des tâches :** GitHub Projects (colonnes À faire / En cours / En revue / Terminé).
- **Répartition suggérée :** (1) mise en page, Accueil, palette ; (2) liste, filtres, détail ; (3) API, authentification, inscriptions ; (4) publication, mes publications, tests.

## 7. Tests effectués

- **API :** tous les endpoints testés (inscription, connexion, filtres combinés, inscription solo/équipe, double inscription refusée, hackathon terminé refusé, publication valide et invalide, droits d’accès 401/403, routes inconnues 404).
- **Interface, à vérifier sur Chrome, Firefox, Edge et Safari :** navigation, menu mobile, filtres, formulaires (messages d’erreur), redirection après connexion, responsive en 390 px / 768 px / 1440 px.

## 8. Prochaines étapes

1. ~~Remplacer le fichier JSON par PostgreSQL (Supabase)~~ : fait. Compléter les informations des vrais hackathons (places, dates limites, prix) dans `server/data/seed.json` ou directement dans Supabase.
2. Passer l’authentification sur **Supabase Auth** (vérification d’e-mail, mot de passe oublié, connexion Google).
3. Ajouter l’envoi d’images (bannières) avec Supabase Storage, puis déployer (Vercel pour le site, Render pour l’API).
