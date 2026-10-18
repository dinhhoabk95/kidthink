import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scanAllMigrations, scanMigrationContent } from "./migration-expand.ts";

const FIXTURES_DIR = resolve(
  import.meta.dirname,
  "fixtures",
  "migration-expand"
);

describe("BR-RBK-02 & BR-RBK-03: Migration Expand/Contract Gate", () => {
  it("BR-RBK-02: chấp nhận migration chỉ expand (CREATE TABLE, ADD COLUMN, CREATE INDEX)", () => {
    const goodRoot = resolve(FIXTURES_DIR, "good-root");
    const result = scanAllMigrations(goodRoot);
    expect(result.scannedFiles).toBe(1);
    expect(result.violations).toEqual([]);
  });

  it("BR-RBK-02: từ chối migration chứa lệnh phá huỷ (DROP COLUMN, RENAME COLUMN, SET NOT NULL, ALTER COLUMN TYPE, TRUNCATE) không có chú thích contract-drop", () => {
    const badRoot = resolve(FIXTURES_DIR, "bad-root");
    const result = scanAllMigrations(badRoot);
    expect(result.scannedFiles).toBe(1);
    expect(result.violations.map((v) => v.pattern)).toEqual([
      "DROP COLUMN",
      "RENAME COLUMN",
      "SET NOT NULL",
    ]);

    const extraViolations = scanMigrationContent(
      "0099_bad.sql",
      [
        "DROP TABLE old_items;",
        "ALTER TABLE users ALTER COLUMN age TYPE smallint;",
        "TRUNCATE TABLE logs;",
      ].join("\n")
    );
    expect(extraViolations.map((v) => v.pattern)).toEqual([
      "DROP TABLE",
      "ALTER COLUMN TYPE",
      "TRUNCATE",
    ]);
  });

  it("BR-RBK-03: cho phép lệnh contract ở release thứ hai khi có chú thích -- contract-drop hoặc -- allow-destructive", () => {
    const sqlWithContractDrop = [
      "-- contract-drop: release N+1 sau khi code đã ngưng đọc cột cũ",
      "ALTER TABLE users DROP COLUMN old_role;",
      "DROP TABLE IF EXISTS legacy_cache; -- allow-destructive",
    ].join("\n");

    const violations = scanMigrationContent(
      "0010_contract.sql",
      sqlWithContractDrop
    );
    expect(violations).toEqual([]);
  });

  it("BR-RBK-02 / BR-RBK-03: toàn bộ migrations thật trong repo đều đạt cổng expand/contract", () => {
    const result = scanAllMigrations();
    expect(result.scannedFiles).toBeGreaterThanOrEqual(10);
    expect(result.violations).toEqual([]);
  });
});
