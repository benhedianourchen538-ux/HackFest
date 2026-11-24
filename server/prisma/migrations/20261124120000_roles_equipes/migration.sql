-- 1) Rôles des comptes
create type role_utilisateur as enum ('participant', 'organisateur', 'admin');
alter table utilisateurs add column role role_utilisateur not null default 'participant';

-- Les comptes qui ont déjà publié un hackathon gardent ce droit, ainsi que le compte démo
update utilisateurs set role = 'organisateur'
where email = 'demo@hackfest.tn' or id in (select cree_par from hackathons where cree_par is not null);

-- 2) Les équipes deviennent une vraie table (avant : nom et code recopiés dans chaque inscription)
create table equipes (
  id           text primary key default gen_random_uuid()::text,
  hackathon_id text not null references hackathons(id) on delete cascade,
  nom          text not null,
  code         text not null unique,
  cree_le      timestamptz not null default now()
);
alter table equipes enable row level security;

alter table inscriptions add column equipe_id text references equipes(id) on delete set null;

-- Recopie des équipes existantes : une ligne par code d'équipe
insert into equipes (hackathon_id, nom, code, cree_le)
select hackathon_id, min(equipe_nom), equipe_code, min(cree_le)
from inscriptions
where equipe_code is not null
group by hackathon_id, equipe_code;

update inscriptions i set equipe_id = e.id
from equipes e
where e.code = i.equipe_code and e.hackathon_id = i.hackathon_id;

-- Les anciennes colonnes ne servent plus
drop index inscriptions_equipe_idx;
alter table inscriptions drop column equipe_nom, drop column equipe_code;
create index inscriptions_equipe_idx on inscriptions (equipe_id);
