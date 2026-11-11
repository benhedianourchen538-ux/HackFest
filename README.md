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
| Données | Fichier JSON (`server/data/db.json`) | « Backend minimal » demandé pour cet objectif. Prévu ensuite : PostgreSQL (Supabase) + Prisma. |
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

Commandes utiles :
- `npm run reset-db` (dans `server/`) remet les données de départ (12 hackathons d’exemple).
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
    ├── data/seed.json           # Données de départ
    └── src/
        ├── index.js             # Création du serveur
        ├── db.js                # Lecture / écriture du fichier JSON
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

Règles vérifiées par le serveur : pas de double inscription, places limitées, inscriptions fermées après la date limite, taille maximale des équipes, seul l’organisateur voit ses inscrits.

## 6. Travail en équipe

- **Git :** une branche par fonctionnalité (`feature/filtres-hackathons`, `feature/auth`, `feature/publier`…), fusion dans `main` par Pull Request relue par un coéquipier. Commits clairs : `feat: ajout du filtre par région`, `fix: date limite d'inscription`.
- **Suivi des tâches :** GitHub Projects (colonnes À faire / En cours / En revue / Terminé).
- **Répartition suggérée :** (1) mise en page, Accueil, palette ; (2) liste, filtres, détail ; (3) API, authentification, inscriptions ; (4) publication, mes publications, tests.

## 7. Tests effectués

- **API :** tous les endpoints testés (inscription, connexion, filtres combinés, inscription solo/équipe, double inscription refusée, hackathon terminé refusé, publication valide et invalide, droits d’accès 401/403, routes inconnues 404).
- **Interface, à vérifier sur Chrome, Firefox, Edge et Safari :** navigation, menu mobile, filtres, formulaires (messages d’erreur), redirection après connexion, responsive en 390 px / 768 px / 1440 px.

## 8. Prochaines étapes

1. Remplacer le fichier JSON par **PostgreSQL (Supabase) + Prisma**.
2. Passer l’authentification sur **Supabase Auth** (vérification d’e-mail, mot de passe oublié, connexion Google).
3. Ajouter l’envoi d’images (bannières) avec Supabase Storage, puis déployer (Vercel pour le site, Render pour l’API).
