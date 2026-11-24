import { createRequire } from "node:module";
import type { DatabaseSync as NodeDatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { resolveSqliteDatabasePath } from "#src/drivers/sqlite-local-driver";
import {
  acquireRunLock,
  assertDisposableDatabaseUrl,
  assertDisposableSqliteDir,
  claimDatabasePreparation,
  TABLES,
  truncateAllTestTables,
} from "./global-setup.ts";

interface NodeSqliteModule {
  readonly DatabaseSync: typeof NodeDatabaseSync;
}

const req = createRequire(import.meta.url);
const { DatabaseSync } = req("node:sqlite") as NodeSqliteModule;

const UNIQUE_CONSTRAINT_ERROR = /UNIQUE constraint failed/i;

function resolveTestDbPath(): string {
  const targetDir = process.env.SQLITE_DATA_DIR;
  const resolved = resolveSqliteDatabasePath(targetDir);
  return resolved.dbPath;
}

describe("global-setup: chỉ chuẩn bị database một lần cho mỗi lượt chạy", () => {
  it("ca âm — không có cờ thì mọi project đều giành được quyền dọn", () => {
    const withoutGuard = [1, 2, 3].map(() => {
      const env: NodeJS.ProcessEnv = {};
      return claimDatabasePreparation(env);
    });

    expect(withoutGuard).toEqual([true, true, true]);
  });

  it("project đầu tiên giành được quyền dọn, các project sau bỏ qua", () => {
    const env: NodeJS.ProcessEnv = {};

    const claims = [1, 2, 3].map(() => claimDatabasePreparation(env));

    expect(claims).toEqual([true, false, false]);
  });

  it("cờ dùng chung `process.env` để mọi globalSetup trong một tiến trình thấy nhau", () => {
    const env: NodeJS.ProcessEnv = {};

    claimDatabasePreparation(env);

    expect(env.MINDKID_TEST_DB_PREPARED).toBe("1");
  });
});

describe("global-setup: truncateAllTestTables", () => {
  const probeTable = `_test_truncate_probe_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  it("BR-TST-05: refuses to truncate a non-loopback database or dev sqlite dir", () => {
    expect(() =>
      assertDisposableDatabaseUrl(
        "postgres://postgres:postgres@db.example.invalid:5432/mindkid"
      )
    ).toThrow("loopback");
    expect(() =>
      assertDisposableSqliteDir("/var/opt/mindkid/sqlite")
    ).toThrow();
  });

  afterAll(() => {
    const db = new DatabaseSync(resolveTestDbPath());
    try {
      db.exec(`DROP TABLE IF EXISTS "${probeTable}";`);
    } finally {
      db.close();
    }
  });

  it("ca âm — dữ liệu sót từ lần trước làm insert lặp lại dính duplicate key", () => {
    const db = new DatabaseSync(resolveTestDbPath());
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS "${probeTable}" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE
      );`);
      db.exec(
        `INSERT INTO "${probeTable}" (code) VALUES ('DUP-CODE') ON CONFLICT DO NOTHING;`
      );
      expect(() =>
        db.exec(`INSERT INTO "${probeTable}" (code) VALUES ('DUP-CODE');`)
      ).toThrow(UNIQUE_CONSTRAINT_ERROR);
    } finally {
      db.close();
    }
  });

  it("TABLES phủ đúng mọi bảng trong SQLite test schema", () => {
    const db = new DatabaseSync(resolveTestDbPath());
    try {
      const rows = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_test\\_%' ESCAPE '\\' ORDER BY name;"
        )
        .all() as Array<{ name: string }>;
      const inDatabase = rows.map((row) => row.name).sort();
      const listed = [...TABLES].sort();

      expect(listed).toEqual(inDatabase);
    } finally {
      db.close();
    }
  });

  it("sau truncateAllTestTables, bảng rỗng và autoincrement reset về 1", async () => {
    await truncateAllTestTables(undefined, [probeTable]);

    const db = new DatabaseSync(resolveTestDbPath());
    try {
      const before = db
        .prepare(`SELECT COUNT(*) AS c FROM "${probeTable}";`)
        .get() as { c: number };
      expect(Number(before.c)).toBe(0);

      const inserted = db
        .prepare(
          `INSERT INTO "${probeTable}" (code) VALUES ('DUP-CODE') RETURNING id;`
        )
        .get() as { id: number };
      expect(Number(inserted.id)).toBe(1);
    } finally {
      db.close();
    }
  });
});

describe("global-setup: loại trừ lẫn nhau giữa hai lượt vitest run", () => {
  it("lượt thứ hai đợi đến khi lượt thứ nhất nhả khoá; ca âm: không nhả thì không qua", async () => {
    const probeKey = `probe_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const targetDir = process.env.SQLITE_DATA_DIR;
    const releaseFirst = await acquireRunLock(targetDir, probeKey);

    let secondAcquired = false;
    const second = acquireRunLock(targetDir, probeKey).then((release) => {
      secondAcquired = true;
      return release;
    });

    for (let i = 0; i < 10; i++) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    expect(secondAcquired).toBe(false);

    await releaseFirst();
    const releaseSecond = await second;
    expect(secondAcquired).toBe(true);
    await releaseSecond();
  });
});
