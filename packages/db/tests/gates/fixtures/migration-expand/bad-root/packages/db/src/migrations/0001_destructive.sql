-- Fixture: deliberately wrong. The gate must reject this migration.
ALTER TABLE users ADD COLUMN is_verified boolean DEFAULT false;
ALTER TABLE users DROP COLUMN old_role;
ALTER TABLE profiles RENAME COLUMN username TO handle;
ALTER TABLE orders ALTER COLUMN note SET NOT NULL;
