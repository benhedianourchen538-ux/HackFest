-- La table interne de Prisma (_prisma_migrations) est créée dans le schéma "public",
-- donc visible par l'API REST de Supabase : on la protège aussi par RLS, comme les autres tables.
alter table _prisma_migrations enable row level security;
