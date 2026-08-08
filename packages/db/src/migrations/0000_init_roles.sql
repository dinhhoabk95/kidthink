DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kidthink_app') THEN
    CREATE ROLE kidthink_app WITH LOGIN PASSWORD 'kidthink_app_password';
  END IF;
END $$;

GRANT CONNECT ON DATABASE kidthink TO kidthink_app;
GRANT USAGE ON SCHEMA public TO kidthink_app;
