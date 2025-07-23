-- Initial database setup
-- This runs before schema.sql

-- Create application user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'contracts_user') THEN
      CREATE ROLE contracts_user LOGIN PASSWORD 'contracts_pass';
   END IF;
END
$do$;

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE contracts_db TO contracts_user;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO contracts_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO contracts_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO contracts_user;