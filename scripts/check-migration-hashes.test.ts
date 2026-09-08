import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findViolations,
  hashMigration,
  type MigrationHashLock,
  readJournalTags,
} from "./check-migration-hashes.ts";

function makeMigrations(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-hashes-"));
  fs.mkdirSync(path.join(dir, "meta"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "meta/_journal.json"),
    JSON.stringify({
      entries: Object.keys(files).map((tag, idx) => ({ idx, tag, when: idx })),
    })
  );
  for (const [tag, sql] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, `${tag}.sql`), sql, "utf8");
  }
  return dir;
}

function lockFor(dir: string, tags: string[]): MigrationHashLock {
  const hashes: Record<string, string> = {};
  for (const tag of tags) {
    const hash = hashMigration(dir, tag);
    if (hash) {
      hashes[tag] = hash;
    }
  }
  return { hashes };
}

describe("Cổng check:migration-hashes (Task #260 I13)", () => {
  it("hash khớp lockfile thì xanh", () => {
    const dir = makeMigrations({ "0000_init": "CREATE TABLE a();" });
    expect(findViolations(lockFor(dir, ["0000_init"]), dir)).toEqual([]);
  });

  it("Ca âm: sửa nội dung migration đã chốt thì cổng bắt được", () => {
    const dir = makeMigrations({ "0000_init": "CREATE TABLE a();" });
    const lock = lockFor(dir, ["0000_init"]);

    fs.writeFileSync(
      path.join(dir, "0000_init.sql"),
      "CREATE TABLE a(); -- đổi tên constraint\n",
      "utf8"
    );

    const violations = findViolations(lock, dir);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("edited");
    expect(violations[0]?.tag).toBe("0000_init");
  });

  it("Ca âm: migration mới chưa chốt thì cổng đỏ với kind `unlocked`", () => {
    const dir = makeMigrations({
      "0000_init": "CREATE TABLE a();",
      "0001_next": "CREATE TABLE b();",
    });
    const violations = findViolations(lockFor(dir, ["0000_init"]), dir);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("unlocked");
  });

  it("Ca âm: journal khai migration mà không có file .sql", () => {
    const dir = makeMigrations({ "0000_init": "CREATE TABLE a();" });
    const lock = lockFor(dir, ["0000_init"]);
    fs.rmSync(path.join(dir, "0000_init.sql"));

    const violations = findViolations(lock, dir);
    expect(violations[0]?.kind).toBe("missing_file");
  });

  it("hash là sha256 của đúng nội dung file", () => {
    const dir = makeMigrations({ "0000_init": "SELECT 1;" });
    expect(hashMigration(dir, "0000_init")).toBe(
      crypto.createHash("sha256").update("SELECT 1;").digest("hex")
    );
    expect(hashMigration(dir, "9999_absent")).toBeNull();
  });

  it("journal thật của repo và lockfile thật đang khớp", () => {
    const lock = JSON.parse(
      fs.readFileSync(
        path.resolve(import.meta.dirname, "migration-hashes.json"),
        "utf8"
      )
    ) as MigrationHashLock;
    const tags = readJournalTags(
      path.resolve(import.meta.dirname, "../packages/db/src/migrations")
    );
    expect(tags.length).toBeGreaterThan(0);
    expect(findViolations(lock)).toEqual([]);
  });
});
