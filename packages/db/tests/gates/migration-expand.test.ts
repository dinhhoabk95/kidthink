import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { scanAllMigrations, scanMigrationContent } from "./migration-expand.ts";

const FIXTURES = resolve(import.meta.dirname, "fixtures/migration-expand");

describe("Gate lint:migration-expand (BR-RBK-02)", () => {
  it("rejects DROP COLUMN", () => {
    const found = scanMigrationContent(
      "0001.sql",
      "ALTER TABLE users DROP COLUMN old_role;"
    );
    expect(found[0]?.pattern).toBe("DROP COLUMN");
  });

  it("rejects RENAME COLUMN", () => {
    const found = scanMigrationContent(
      "0002.sql",
      "ALTER TABLE users RENAME COLUMN username TO handle;"
    );
    expect(found.map((f) => f.pattern)).toContain("RENAME COLUMN");
  });

  it("rejects SET NOT NULL, which breaks the previous release's writes", () => {
    const found = scanMigrationContent(
      "0003.sql",
      "ALTER TABLE orders ALTER COLUMN note SET NOT NULL;"
    );
    expect(found.map((f) => f.pattern)).toContain("SET NOT NULL");
  });

  it("rejects DROP INDEX and DROP CONSTRAINT", () => {
    const found = scanMigrationContent(
      "0004.sql",
      "DROP INDEX users_email_idx;\nALTER TABLE users DROP CONSTRAINT users_pkey;"
    );
    expect(found.map((f) => f.pattern)).toEqual([
      "DROP INDEX",
      "DROP CONSTRAINT",
    ]);
  });

  it("accepts additive statements", () => {
    const found = scanMigrationContent(
      "0005.sql",
      "CREATE TABLE x (id serial);\nALTER TABLE users ADD COLUMN avatar text;"
    );
    expect(found).toEqual([]);
  });

  it("ignores a comment that mentions a destructive statement", () => {
    const found = scanMigrationContent("0006.sql", "-- later: DROP COLUMN old");
    expect(found).toEqual([]);
  });

  it("goes red on the bad fixture", () => {
    const { violations, scannedFiles } = scanAllMigrations(
      resolve(FIXTURES, "bad-root")
    );
    expect(scannedFiles).toBe(1);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("stays green on the good fixture", () => {
    const { violations, scannedFiles } = scanAllMigrations(
      resolve(FIXTURES, "good-root")
    );
    expect(scannedFiles).toBe(1);
    expect(violations).toEqual([]);
  });

  it("reports how many files it read, so an empty scan cannot look green", () => {
    const { scannedFiles } = scanAllMigrations(resolve(FIXTURES, "empty-root"));
    expect(scannedFiles).toBe(0);
  });

  it("actually reads the repository's migrations", () => {
    const { violations, scannedFiles } = scanAllMigrations(REPO_ROOT);
    expect(scannedFiles).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});
