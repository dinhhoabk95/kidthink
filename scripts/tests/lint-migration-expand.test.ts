import { describe, expect, it } from "vitest";
import { scanMigrationContent } from "../lint-migration-expand.js";

describe("Task #90 — Gate lint:migration-expand (BR-RBK-02)", () => {
  it("detects destructive DROP COLUMN in sql migration", () => {
    const sql = `
      ALTER TABLE users ADD COLUMN is_verified boolean DEFAULT false;
      ALTER TABLE users DROP COLUMN old_role;
    `;
    const violations = scanMigrationContent(
      "packages/db/drizzle/0001_test.sql",
      sql
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.pattern).toBe("DROP COLUMN");
  });

  it("detects destructive RENAME COLUMN in sql migration", () => {
    const sql = `
      ALTER TABLE users RENAME COLUMN username TO handle;
    `;
    const violations = scanMigrationContent(
      "packages/db/drizzle/0002_test.sql",
      sql
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.pattern).toBe("RENAME COLUMN");
  });

  it("passes clean for additive CREATE TABLE and ADD COLUMN", () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        action text NOT NULL
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
    `;
    const violations = scanMigrationContent(
      "packages/db/drizzle/0003_test.sql",
      sql
    );
    expect(violations.length).toBe(0);
  });
});
