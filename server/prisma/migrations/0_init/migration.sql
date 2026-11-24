-- Migration de départ ("baseline") : la structure de la base avant Prisma (ancien db/schema.sql).
-- Sur la base Supabase existante, elle est marquée comme appliquée sans être exécutée :
--   npx prisma migrate resolve --applied 0_init
-- Sur une base vide (nouveau poste, base de test), "prisma migrate deploy" l'exécute normalement.

create table utilisateurs (
  id                text primary key default gen_random_uuid()::text,
  nom               text not null,
  email             text not null unique,
  universite        text not null default '',
  mot_de_passe_hash text not null,
  cree_le           timestamptz not null default now()
);

create table hackathons (
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
  date_limite       date,
  places            integer check (places > 0),
  taille_equipe_max integer check (taille_equipe_max > 0),
  prix              jsonb not null default '[]'::jsonb,
  programme         jsonb not null default '[]'::jsonb,
  reglement         text not null default '',
  lien              text,
  source            text,
  cree_par          text references utilisateurs(id) on delete set null,
  cree_le           timestamptz not null default now(),
  check (date_fin >= date_debut)
);

create table inscriptions (
  id             text primary key default gen_random_uuid()::text,
  utilisateur_id text not null references utilisateurs(id) on delete cascade,
  hackathon_id   text not null references hackathons(id) on delete cascade,
  mode           text not null check (mode in ('solo', 'creer', 'rejoindre')),
  equipe_nom     text,
  equipe_code    text,
  motivation     text not null default '',
  statut         text not null default 'confirme',
  cree_le        timestamptz not null default now(),
  unique (hackathon_id, utilisateur_id)
);

create index inscriptions_equipe_idx on inscriptions (hackathon_id, equipe_code);
create index hackathons_cree_par_idx on hackathons (cree_par);

create table messages (
  id      text primary key default gen_random_uuid()::text,
  nom     text not null,
  email   text not null,
  message text not null,
  cree_le timestamptz not null default now()
);

-- Sécurité Supabase : l'API REST publique de Supabase (clé "anon") expose les tables du schéma "public".
-- RLS activé SANS politique = personne ne peut les lire par cette voie.
-- Notre API Express se connecte en propriétaire des tables : elle n'est pas bloquée.
alter table utilisateurs enable row level security;
alter table hackathons   enable row level security;
alter table inscriptions enable row level security;
alter table messages     enable row level security;
