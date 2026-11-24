# HackFest – Plateforme de hackathons étudiants

**Projet Web · Objectif 3 : développement et intégration des fonctionnalités principales**
Projet : **HackFest** · Membres : **Nourchen Benhdia**, **Lina Sidhom**

HackFest réunit les hackathons étudiants de Tunisie sur une seule plateforme. Un visiteur peut **consulter et filtrer** les hackathons ; un **participant** peut **s’inscrire** (en solo ou en équipe) et retrouver **ses événements** ; un **organisateur** peut en plus **publier ses hackathons** (avec une bannière) et suivre leurs inscrits.

Le site (React) ne parle **qu’à notre API Express**. Toute la logique (comptes, droits, règles d’inscription, fichiers) est dans notre backend Node.js ; Supabase sert uniquement à héberger la base PostgreSQL.

---

## 1. Choix techniques

| Couche | Technologies | Pourquoi |
|---|---|---|
| Structure & style | HTML5, CSS3, JavaScript + **Tailwind CSS 4** | La palette du projet (Navy `#123B63`, Bleu Tech `#1769AA`, Rouge SUP’COM `#D92735`…) devient des classes réutilisables (`bg-navy`, `text-sup`…). |
| Frontend | **React 18 + Vite**, React Router 6 | Démarrage et rechargement rapides ; `create-react-app` n’est plus maintenu. |
| État côté client | Hooks + Context API | `AuthContext` (utilisateur connecté et son rôle) et `ToastContext` (notifications). |
| Backend | **Node.js + Express**, architecture **routes → controllers → services** | Même langage des deux côtés. Chaque couche a un seul rôle (voir § 4). |
| Base de données | **PostgreSQL** (hébergé sur **Supabase**) + **Prisma** (ORM et migrations) | Vraie base relationnelle (clés étrangères, contraintes). Prisma décrit la base dans un seul fichier et versionne chaque changement de structure (migrations). |
| Authentification | **Maison** : `bcryptjs` (mots de passe hachés) + **JWT** (`jsonwebtoken`) + **rôles** + **vérification de l’e-mail par code** | Aucun service d’authentification externe : on maîtrise et on peut expliquer tout le fonctionnement. |
| E-mails | **Nodemailer** (SMTP Gmail) | Envoi du code de vérification à 6 chiffres. Sans configuration, le code s’affiche dans le terminal de l’API. |
| Validation | **Zod** | Toutes les données reçues (corps, filtres, identifiants) sont vérifiées et nettoyées avant d’arriver au code métier. |
| Fichiers | **Multer** | Réception des bannières (2 Mo, JPEG/PNG/WebP). |
| Sécurité | **helmet**, **cors**, **express-rate-limit** | En-têtes de sécurité, API réservée à notre site, limite de requêtes et de tentatives de connexion. |
| Tests | **Jest** + **Supertest** | 70 tests automatiques de l’API sur une base de test séparée. |
| Icônes / polices | lucide-react, Poppins (titres) et Inter (texte) | Charte graphique du projet. |

## 2. Fonctionnalités

**Pages publiques (sans compte)**
- **Accueil** : hero, chiffres clés, prochains hackathons, accès par domaine, « Comment ça marche », **Qui sommes-nous**, **FAQ**, **formulaire de contact**.
- **Hackathons** : recherche texte (sans tenir compte des accents), filtres **Organisé par**, **Région**, **Domaine**, **Statut**, **Format**, tri, filtres en « chips », filtres enregistrés dans l’URL, panneau plein écran sur mobile.
- **Détail d’un hackathon** : bannière, présentation, programme, prix, règlement, places restantes. Sans compte, le bouton ramène sur la page après la connexion.
- **Connexion / Création de compte** : choix du **type de compte** (participant ou organisateur), **mot de passe fort** (8 caractères min. avec majuscule, minuscule, chiffre et symbole, règles cochées en direct), compte de démonstration.
- **Vérification de l’e-mail** : après l’inscription, un **code à 6 chiffres** est envoyé par e-mail ; il faut le saisir pour activer le compte et être connecté (valable 15 min, 5 essais, renvoi possible après 60 s). Un compte non vérifié qui tente de se connecter est renvoyé vers cet écran.

**Participants (et organisateurs)**
- **Inscription à un hackathon** en 3 étapes : solo, **créer une équipe** (code `HF-XXXXX` à partager) ou **rejoindre une équipe** avec son code.
- **Mes événements** : à venir / passés, compte à rebours, coéquipiers, annulation.

**Organisateurs (et admins)**
- **Publier un hackathon** en 5 étapes avec **bannière** facultative (aperçu avant envoi), brouillon dans le navigateur.
- **Mes publications** : inscrits (avec leur équipe), **export CSV**, suppression.
- Un participant qui ouvre ces pages voit une explication ; l’API refuse de toute façon (403).

**Transversal** : navigation adaptée au rôle, menu mobile, toasts, états de chargement, page 404, responsive (390 px → 1440 px), accessibilité (labels, `aria-*`, focus visible, contrastes).

## 3. Lancer le projet

Prérequis : **Node.js 20.11 ou plus récent** (`node -v`), npm, et une base **PostgreSQL** (Supabase, gratuit).

### 3.1 Configurer la base (une seule fois)

1. Sur [supabase.com](https://supabase.com) : ouvrir le projet de l’équipe (ou **New project**, plan Free, et **noter le mot de passe de la base**).
2. Bouton **Connect** → **Session pooler** → copier l’URI.
3. Copier `server/.env.example` en `server/.env` et remplir au minimum `DATABASE_URL`, `DATABASE_URL_TEST` et `JWT_SECRET` (voir § 3.3), puis l’envoi des e-mails (§ 3.5).
4. Créer les tables et les données de départ :
   ```bash
   cd server
   npm install          # installe aussi le client Prisma (prisma generate)
   npm run db:migrate   # applique les migrations (prisma/migrations)
   npm run db:seed      # compte démo + hackathons de data/seed.json
   ```

> **Projet Supabase en pause ?** Un projet gratuit se met en pause après ~7 jours sans activité (erreur `tenant/user … not found`). Dashboard Supabase → le projet → **Resume project**, puis attendre 2 à 5 minutes. Pensez-y avant une démonstration.

### 3.2 Démarrer

**Terminal 1 : l’API**
```bash
cd server
npm run dev          # http://localhost:5000/api
```

**Terminal 2 : le site**
```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

**Compte de démonstration :** `demo@hackfest.tn` / `demo1234` (organisateur : il peut tout tester).

### 3.3 Variables d’environnement

`server/.env` (jamais versionné, chacun crée le sien à partir de `server/.env.example`) :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | Adresse PostgreSQL utilisée par Prisma (Supabase : « Session pooler », port 5432). |
| `DATABASE_URL_TEST` | pour `npm test` | **Même adresse** avec `?schema=test` à la fin : les tests travaillent dans un schéma séparé et ne touchent jamais aux vraies données. |
| `JWT_SECRET` | oui (en production, l’API refuse de démarrer sans) | Longue chaîne aléatoire qui signe les jetons de connexion. |
| `CLIENT_URL` | non (`http://localhost:5173`) | Adresse(s) du site autorisée(s) par CORS, séparées par des virgules. |
| `PORT` | non (`5000`) | Port de l’API. |
| `SMTP_USER`, `SMTP_PASS` | en production | Compte Gmail et **mot de passe d’application** pour envoyer les codes (voir § 3.5). Sans eux en développement : code affiché dans le terminal de l’API. |
| `SMTP_HOST`, `SMTP_PORT`, `EMAIL_EXPEDITEUR` | non (`smtp.gmail.com`, `465`) | Autre serveur d’envoi ou autre nom d’expéditeur. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | non | Si remplis, `npm run db:seed` crée (ou promeut) ce compte **admin**. |
| `LIMITE_REQUETES` | non (`300`) | Requêtes max par adresse IP en 15 minutes. |
| `TRUST_PROXY` | non | `1` si l’API est hébergée derrière un proxy (Render, Railway…), pour lire la vraie IP des visiteurs. |

`client/.env` (facultatif, voir `client/.env.example`) : `VITE_API_URL` (par défaut `http://localhost:5000/api`).

### 3.4 Commandes utiles

| Dans | Commande | Effet |
|---|---|---|
| `server/` | `npm run dev` | API avec redémarrage automatique. |
| `server/` | `npm test` | Lance les 55 tests automatiques (base de test). |
| `server/` | `npm run db:migrate` | Applique les nouvelles migrations. |
| `server/` | `npm run db:seed` | Ajoute ou met à jour le compte démo et les hackathons de `data/seed.json`, **sans rien supprimer**. |
| `server/` | `npm run reset-db` | ⚠️ Supprime **toutes** les données (comptes, inscriptions, publications) puis relance le seed. |
| `server/` | `npx prisma migrate dev --name <nom>` | Après une modification de `prisma/schema.prisma` : crée la migration SQL correspondante. |
| `server/` | `npx prisma studio` | Interface web pour consulter la base. |
| `client/` | `npm run build` | Version de production dans `client/dist` (doit passer avant chaque Pull Request). |

### 3.5 Envoi des e-mails avec Gmail

1. Sur le compte Google qui enverra les e-mails : **Gérer votre compte Google** → **Sécurité** → activer la **Validation en 2 étapes**.
2. Toujours dans **Sécurité**, ouvrir **Mots de passe des applications**, créer une application nommée « HackFest » et copier le mot de passe de 16 lettres affiché.
3. Dans `server/.env` :
   ```
   SMTP_USER=adresse.gmail@gmail.com
   SMTP_PASS=lemotdepassede16lettres
   ```
4. Relancer l’API. Les codes partent alors par e-mail (penser aux spams lors du premier envoi).

Ne jamais utiliser le mot de passe habituel du compte Gmail, ni le copier dans le code ou dans un message : seulement dans `server/.env`, qui n’est pas versionné.

## 4. Organisation du code

```
hackfest/
├── client/                         # Frontend React + Vite
│   └── src/
│       ├── App.jsx                 # Routes (ProtectedRoute + rôles)
│       ├── components/             # Navbar, Footer, HackathonCard, Cover (bannière), ui.jsx…
│       ├── context/                # AuthContext, ToastContext
│       ├── pages/                  # Une page = un fichier
│       ├── services/api.js         # TOUS les appels à l'API (JSON et fichiers)
│       ├── data/constants.js       # Domaines, régions, rôles, limites de la bannière
│       └── utils/format.js         # Dates en français
└── server/                         # API Node.js + Express
    ├── prisma/
    │   ├── schema.prisma           # Modèles : Utilisateur, Hackathon, Equipe, Inscription, Message
    │   ├── migrations/             # Historique SQL de la structure de la base
    │   └── seed.js                 # npm run db:seed
    ├── data/seed.json              # Vrais hackathons
    ├── uploads/bannieres/          # Images envoyées (non versionné)
    ├── tests/                      # Jest + Supertest
    └── src/
        ├── index.js                # Démarrage (connexion base + écoute du port)
        ├── app.js                  # Application Express : sécurité, routes, erreurs
        ├── routes/                 # URL -> middlewares -> controller
        ├── controllers/            # Lit la requête, appelle le service, répond
        ├── services/               # Règles métier + Prisma (lancent des ErreurApi)
        ├── validators/             # Schémas Zod
        ├── middlewares/            # auth (requireAuth, requireRole), valider, upload, limites, erreurs
        ├── utils/                  # ErreurApi, fichiers, filtres/tri des hackathons
        ├── prisma.js               # Client Prisma unique
        └── conversions.js          # Objets Prisma -> JSON envoyé au client
```

**Le trajet d’une requête**, par exemple `POST /api/hackathons` :
`helmet` → `cors` → limite de requêtes → `requireAuth` (jeton valide ?) → `requireRole('organisateur', 'admin')` → `valider(schemaHackathon)` (Zod) → **controller** → **service** (Prisma) → réponse JSON. Si une étape échoue, l’erreur part vers le **gestionnaire d’erreurs unique**, qui répond toujours `{ message, errors? }`.

## 5. API REST

Rôles : **public** (sans compte), **connecté** (tout compte), **organisateur** (organisateur ou admin), **auteur** (celui qui a publié le hackathon, ou un admin).

| Méthode | Route | Accès | Rôle de la route |
|---|---|---|---|
| GET | `/api/health` | public | L’API répond-elle ? |
| GET | `/api/meta` | public | Valeurs autorisées (domaines, régions…) |
| POST | `/api/auth/register` | public | Créer un compte `{ nom, email, password, universite?, role? }` (`participant` par défaut ou `organisateur`) : compte **non vérifié**, code envoyé par e-mail, **pas de jeton** |
| POST | `/api/auth/verifier-email` | public | `{ email, code }` : active le compte → `{ token, user }` (15 min, 5 essais par code) |
| POST | `/api/auth/renvoyer-code` | public | `{ email }` : nouveau code (60 s minimum entre deux envois ; réponse identique que l’adresse existe ou non) |
| POST | `/api/auth/login` | public | Se connecter (5 échecs max / 15 min) → `{ token, user }` ; compte non vérifié : `403` avec `code: "EMAIL_NON_VERIFIE"` et un nouveau code envoyé |
| GET | `/api/auth/me` | connecté | Utilisateur courant (avec son rôle) |
| GET | `/api/hackathons?q=&organisateur=&region=&domaine=&statut=&format=&tri=` | public | Liste filtrée (plusieurs valeurs séparées par des virgules) |
| GET | `/api/hackathons/:id` | public | Détail |
| POST | `/api/hackathons` | organisateur | Publier |
| PUT | `/api/hackathons/:id/banniere` | auteur | Envoyer / remplacer la bannière (`multipart/form-data`, champ `banniere`) |
| GET | `/api/hackathons/mine` | connecté | Mes publications |
| GET | `/api/hackathons/:id/inscrits` | auteur | Liste des inscrits |
| DELETE | `/api/hackathons/:id` | auteur | Supprimer (inscriptions, équipes et bannière avec) |
| POST | `/api/hackathons/:id/inscriptions` | connecté | S’inscrire `{ mode: solo \| creer \| rejoindre, nomEquipe?, codeEquipe?, motivation? }` |
| GET | `/api/inscriptions/me` | connecté | Mes événements (avec les membres de l’équipe) |
| DELETE | `/api/inscriptions/:id` | connecté (la sienne) | Annuler une inscription |
| POST | `/api/contact` | public | Formulaire de contact |
| GET | `/uploads/bannieres/<fichier>` | public | Images des bannières |

**Authentification :** en-tête `Authorization: Bearer <jeton>` (valable 7 jours).

**Erreurs :** toujours `{ "message": "…", "errors": { "champ": "…" }, "code": "…" }` (`errors` seulement pour un formulaire, `code` seulement quand le client doit réagir, ex. `EMAIL_NON_VERIFIE`).
`400` données invalides · `401` non connecté / jeton invalide · `403` rôle ou droits insuffisants · `404` introuvable · `409` déjà existant (e-mail, double inscription) · `413` fichier ou données trop gros · `429` trop de requêtes · `500` erreur serveur (message neutre, détail dans le terminal).

**Règles métier vérifiées par le serveur :** pas de double inscription (aussi garanti par une contrainte `unique`), places limitées, inscriptions fermées après la date limite ou une fois le hackathon commencé, taille maximale des équipes, code d’équipe valable seulement pour son hackathon. Une date limite ou un nombre de places à `null` signifie « non communiqué » : le site affiche « À confirmer » et ce critère ne bloque pas.

## 6. Sécurité

| Risque | Protection |
|---|---|
| Mot de passe trop simple | 8 caractères min. avec **majuscule, minuscule, chiffre et symbole**, vérifié côté client **et** serveur (Zod). |
| Fausse adresse e-mail | Compte inactif tant que le **code à 6 chiffres** reçu par e-mail n’est pas saisi. Code tiré au hasard (`crypto.randomInt`), stocké **haché** (HMAC-SHA256), valable 15 min, **5 essais** max, comparé en temps constant, renvoi limité (60 s, 5 demandes / 15 min). Les réponses ne révèlent pas si une adresse a un compte. |
| Vol de la base | Mots de passe **hachés avec bcrypt** (jamais stockés en clair, jamais renvoyés). RLS activé sur toutes les tables : l’API publique de Supabase ne peut rien lire. |
| Faux jeton | Jeton **JWT signé** avec `JWT_SECRET` ; le rôle est relu en base à chaque requête. |
| Accès interdit | `requireAuth`, `requireRole` et vérification de l’auteur dans les services (401 / 403). |
| Données piégées | **Zod** sur toutes les entrées ; champs inconnus ignorés (impossible de forcer un auteur ou un id) ; requêtes Prisma paramétrées (pas d’injection SQL). |
| Essais de mots de passe en boucle | 5 échecs max en 15 min par IP et e-mail (`express-rate-limit`). |
| Robots / saturation | 300 requêtes max en 15 min par IP sur toute l’API ; corps JSON limité à 1 Mo. |
| Fichiers dangereux | Multer : 1 fichier, 2 Mo, JPEG/PNG/WebP, **signature du fichier vérifiée**, nom aléatoire, droits vérifiés **avant** la réception. |
| Autres sites | **CORS** limité à `CLIENT_URL` ; **helmet** (nosniff, anti-iframe, HSTS, pas de `X-Powered-By`). |

## 7. Tests

```bash
cd server
npm test
```

70 tests **Jest + Supertest** (environ 1 min 30, la base est en ligne) :
- `tests/auth.test.js` : règles du mot de passe, création de compte non vérifié, code reçu (boîte e-mail de test en mémoire), bon / mauvais / expiré / réutilisé, 5 essais max, renvoi et délai de 60 s, connexion refusée tant que l’adresse n’est pas vérifiée, rôles (admin refusé), bcrypt, connexion, message identique que le compte existe ou non, blocage après 5 échecs, jeton absent / falsifié, rôle relu en base.
- `tests/hackathons.test.js` : liste, filtres, recherche sans accents, détail, publication (rôles, erreurs Zod, dates incohérentes, nettoyage), suppression (auteur / autre / admin), inscrits, bannière (vraie image, faux PNG, GIF, > 2 Mo, autre organisateur), JSON mal formé, 404, helmet.
- `tests/inscriptions.test.js` : solo, double inscription, places, date limite, équipes (créer, rejoindre, complète, code d’un autre hackathon), « Mes événements », annulation, suppression de l’équipe vide, cascade.

Les tests utilisent `DATABASE_URL_TEST` (schéma `test`) : les migrations y sont appliquées automatiquement, et un garde-fou **refuse de lancer les tests** sur le schéma `public`.

**Interface :** parcours vérifié dans Edge en **390 px et 1440 px** (visiteur, participant, organisateur : inscription, équipe, publication avec bannière, inscrits, suppression), sans erreur ni avertissement dans la console.

## 8. Travail en équipe

- **Git :** une branche par fonctionnalité (`feature/backend-prisma`, `fix/date-limite-inscription`…), fusion dans `main` par Pull Request relue par un coéquipier. Commits : `feat: …`, `fix: …`, `test: …`, `docs: …`.
- **Avant chaque Pull Request :** `npm test` (server) et `npm run build` (client) passent ; test visiteur et connecté en 390 px et 1440 px.
- **Une modification de la base** = modifier `prisma/schema.prisma` puis `npx prisma migrate dev --name <nom>`, et commiter le dossier de migration créé.

## 9. Prochaines étapes

1. Compléter les informations des vrais hackathons (places, dates limites, prix) dans `server/data/seed.json`, puis `npm run db:seed`.
2. Permettre de changer la bannière depuis « Mes publications » (la route `PUT /api/hackathons/:id/banniere` existe déjà).
3. Mot de passe oublié (code envoyé par e-mail, sur le même principe que la vérification de l’adresse).
4. Page d’administration (modération des hackathons, gestion des rôles).
5. Déploiement : site sur Vercel, API sur Render (`TRUST_PROXY=1`, `CLIENT_URL` = adresse du site) ; stocker les bannières sur un service de fichiers plutôt que sur le disque du serveur.
