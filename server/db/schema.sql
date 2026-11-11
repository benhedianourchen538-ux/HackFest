-- Schéma PostgreSQL de HackFest (Supabase en ligne, PGlite en local).
-- Le script peut être relancé sans risque : "if not exists" partout.

create table if not exists utilisateurs (
  id                text primary key default gen_random_uuid()::text,
  nom               text not null,
  email             text not null unique,
  universite        text not null default '',
  mot_de_passe_hash text not null,
  cree_le           timestamptz not null default now()
);

create table if not exists hackathons (
  id                text primary key default gen_random_uuid()::text,
  titre             text not null,
  description       text not null,
  organisateur_nom  text not null,
  organisateur_type text not null check (organisateur_type in ('universite', 'club', 'organisation')),
  domaine           text not null,
  region            text not null,
  format            text not null check (format in ('presentiel', 'en-ligne')),
  lieu              text not null,
  date_debut        date not null,
  date_fin          date not null,
  date_limite       date,                  -- null : non communiquée
  places            integer check (places > 0), -- null : non communiqué
  taille_equipe_max integer not null default 4 check (taille_equipe_max > 0),
  prix              jsonb not null default '[]'::jsonb,
  programme         jsonb not null default '[]'::jsonb,
  reglement         text not null default '',
  lien              text,                  -- page officielle de l'événement
  source            text,                  -- d'où vient l'information (article, annonce…)
  cree_par          text references utilisateurs(id) on delete set null,
  cree_le           timestamptz not null default now(),
  check (date_fin >= date_debut)
);

create table if not exists inscriptions (
  id             text primary key default gen_random_uuid()::text,
  utilisateur_id text not null references utilisateurs(id) on delete cascade,
  hackathon_id   text not null references hackathons(id) on delete cascade,
  mode           text not null check (mode in ('solo', 'creer', 'rejoindre')),
  equipe_nom     text,
  equipe_code    text,
  motivation     text not null default '',
  statut         text not null default 'confirme',
  cree_le        timestamptz not null default now(),
  unique (hackathon_id, utilisateur_id)   -- pas de double inscription
);

create index if not exists inscriptions_equipe_idx on inscriptions (hackathon_id, equipe_code);
create index if not exists hackathons_cree_par_idx on hackathons (cree_par);

create table if not exists messages (
  id      text primary key default gen_random_uuid()::text,
  nom     text not null,
  email   text not null,
  message text not null,
  cree_le timestamptz not null default now()
);

-- Sécurité Supabase : les tables du schéma "public" sont exposées par l'API REST de Supabase
-- (clé "anon"). On active RLS SANS politique : personne ne peut les lire par cette voie
-- (sinon les e-mails et les hash de mots de passe seraient publics).
-- Notre API Express se connecte en tant que propriétaire des tables : elle n'est pas bloquée.
alter table utilisateurs enable row level security;
alter table hackathons   enable row level security;
alter table inscriptions enable row level security;
alter table messages     enable row level security;
