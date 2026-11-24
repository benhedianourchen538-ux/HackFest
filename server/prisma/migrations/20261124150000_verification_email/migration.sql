-- Vérification de l'adresse e-mail par un code à 6 chiffres
alter table utilisateurs
  add column email_verifie          boolean not null default false,
  add column code_verification_hash text,
  add column code_expire_le         timestamptz(6),
  add column code_tentatives        integer not null default 0,
  add column code_envoye_le         timestamptz(6);

-- Les comptes créés avant cette fonctionnalité (dont le compte démo) sont considérés comme vérifiés
update utilisateurs set email_verifie = true;
