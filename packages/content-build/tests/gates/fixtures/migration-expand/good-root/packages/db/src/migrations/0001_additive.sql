-- Fixture: correct. Additive only.
CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  action text NOT NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action);
-- A comment mentioning DROP COLUMN must not trip the gate.
