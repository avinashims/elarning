-- Run once in pgAdmin (Query Tool) or psql
-- Connect as superuser (postgres or your admin user)

CREATE USER elearning WITH PASSWORD 'CHANGE_ME_elearning_db_password';

CREATE DATABASE elearning OWNER elearning;

GRANT ALL PRIVILEGES ON DATABASE elearning TO elearning;

-- Prisma needs schema access
\c elearning
GRANT ALL ON SCHEMA public TO elearning;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO elearning;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO elearning;
