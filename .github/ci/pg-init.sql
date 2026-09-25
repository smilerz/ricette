-- Least-privilege PostgreSQL setup used by the boot acceptance test and documented
-- in docs/operations/deployment.md: a migrator role that owns the schema and a
-- runtime role that can only read and write data.
CREATE ROLE ricette_app LOGIN PASSWORD 'app';
CREATE ROLE ricette_migrator LOGIN PASSWORD 'migrator';
CREATE DATABASE ricette OWNER ricette_migrator;
\connect ricette
ALTER SCHEMA public OWNER TO ricette_migrator;
GRANT USAGE ON SCHEMA public TO ricette_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ricette_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ricette_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ricette_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ricette_app;
