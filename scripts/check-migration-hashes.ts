/**
 * Cổng HASH MIGRATION — bắt việc sửa file migration ĐÃ APPLY.
 *
 *   pnpm check:migration-hashes                  # đối chiếu lockfile
 *   pnpm check:migration-hashes --update         # chốt migration MỚI
 *   pnpm check:migration-hashes --update --force # cố tình sửa file cũ
 *
 * Vì sao cần cổng: `drizzle-orm/pg-core` quyết định apply bằng cách so
 * `created_at < folderMillis` (mốc thời gian trong `meta/_journal.json`), còn
 * hash thì chỉ **ghi** vào `drizzle.__drizzle_migrations` chứ không đối chiếu.
 * Nên sửa nội dung một migration đã chạy KHÔNG làm `db:migrate` đỏ, không làm
 * test nào đỏ — nó chỉ khiến SQL trong repo khác SQL đã chạy trên database,
 * âm thầm, mãi mãi. Task #260 (`a78a0eb2`) đổi tên constraint trong 0000 và
 * 0005 đúng theo đường này.
 *
 * Lockfile chỉ được thêm dòng. Đổi hash của một dòng đã có nghĩa là file cũ bị
 * sửa, và việc đó phải hiện ra trong diff (cần `--force`).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

export interface MigrationHashLock {
  /** tag của migration → sha256 của file .sql */
  hashes: Record<string, string>;
}

export interface MigrationHashViolation {
  readonly tag: string;
  readonly kind: "edited" | "missing_file" | "unlocked";
  readonly detail: string;
}

const MIGRATIONS_DIR = path.join(REPO_ROOT, "packages/db/src/migrations");
const LOCK_PATH = path.join(REPO_ROOT, "scripts/migration-hashes.json");

interface JournalEntry {
  idx: number;
  tag: string;
}

export function readJournalTags(migrationsDir: string): string[] {
  const journalPath = path.join(migrationsDir, "meta/_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Không tìm thấy journal: ${journalPath}`);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as {
    entries?: JournalEntry[];
  };
  return (journal.entries ?? []).map((entry) => entry.tag);
}

export function hashMigration(
  migrationsDir: string,
  tag: string
): string | null {
  const file = path.join(migrationsDir, `${tag}.sql`);
  if (!fs.existsSync(file)) {
    return null;
  }
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(file, "utf8"))
    .digest("hex");
}

export function findViolations(
  lock: MigrationHashLock,
  migrationsDir: string = MIGRATIONS_DIR
): MigrationHashViolation[] {
  const violations: MigrationHashViolation[] = [];

  for (const tag of readJournalTags(migrationsDir)) {
    const actual = hashMigration(migrationsDir, tag);
    if (actual === null) {
      violations.push({
        tag,
        kind: "missing_file",
        detail: "journal khai migration này nhưng không có file .sql",
      });
      continue;
    }

    const locked = lock.hashes[tag];
    if (!locked) {
      violations.push({
        tag,
        kind: "unlocked",
        detail:
          "migration mới chưa chốt — chạy `pnpm check:migration-hashes:update`",
      });
      continue;
    }

    if (locked !== actual) {
      violations.push({
        tag,
        kind: "edited",
        detail: `file đã bị sửa sau khi apply (chốt ${locked.slice(0, 12)}, hiện ${actual.slice(0, 12)})`,
      });
    }
  }

  return violations;
}

function readLock(): MigrationHashLock {
  if (!fs.existsSync(LOCK_PATH)) {
    return { hashes: {} };
  }
  return JSON.parse(fs.readFileSync(LOCK_PATH, "utf8")) as MigrationHashLock;
}

function main(): void {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");
  const isForce = args.includes("--force");
  const lock = readLock();
  const violations = findViolations(lock);

  if (isUpdate) {
    const edited = violations.filter((v) => v.kind === "edited");
    if (edited.length > 0 && !isForce) {
      console.error(
        "\n✗ Từ chối chốt lại: có migration ĐÃ APPLY bị sửa nội dung."
      );
      for (const v of edited) {
        console.error(`    • ${v.tag}: ${v.detail}`);
      }
      console.error(
        "  Hoàn nguyên file, hoặc chạy lại với --force nếu thật sự cố ý (diff sẽ thấy)."
      );
      process.exit(1);
    }

    const hashes: Record<string, string> = {};
    for (const tag of readJournalTags(MIGRATIONS_DIR)) {
      const hash = hashMigration(MIGRATIONS_DIR, tag);
      if (hash) {
        hashes[tag] = hash;
      }
    }
    fs.writeFileSync(
      LOCK_PATH,
      `${JSON.stringify({ hashes }, null, 2)}\n`,
      "utf8"
    );
    console.log(
      `✅ Đã chốt ${Object.keys(hashes).length} migration vào scripts/migration-hashes.json`
    );
    process.exit(0);
  }

  console.log("\n📊 Kết quả kiểm tra hash migration:");
  console.log(
    `   - Migration trong journal: ${readJournalTags(MIGRATIONS_DIR).length}`
  );
  console.log(`   - Vi phạm: ${violations.length}`);

  if (violations.length > 0) {
    console.error("\n✗ Cổng hash migration THẤT BẠI:");
    for (const v of violations) {
      console.error(`    • ${v.tag} [${v.kind}]: ${v.detail}`);
    }
    process.exit(1);
  }

  console.log("\n✅ Cổng xanh: không có migration đã apply nào bị sửa.");
}

if (process.argv[1]?.includes("check-migration-hashes")) {
  main();
}
