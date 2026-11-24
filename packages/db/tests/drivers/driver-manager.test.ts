import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getDbConnectionName } from "@mindkid/config";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { initLocalSqlite } from "#scripts/sqlite-local";
import {
  ACCESS_TIER,
  ACTOR_TYPE,
  auditLogs,
  CHILD_RELATIONSHIP,
  CONSENT_ACTION,
  CONSENT_TYPE,
  childProfiles,
  collectAllTables,
  consentLogs,
  type D1BindValue,
  type D1CellValue,
  DatabaseManager,
  DB,
  gameLevels,
  type MinimalD1Database,
  type MinimalD1ExecResult,
  type MinimalD1PreparedStatement,
  type MinimalD1RunResult,
  PLAY_COMPLETION_STATUS,
  playSessions,
  users,
} from "#src/index";
import { truncateAllTestTables } from "#tests/global-setup";
import { createInMemoryD1Database } from "#tests/helpers/d1-memory-binding";

const INSERT_ONLY_REGEX = /BR-DM-05/;
const COMPLETED_SESSION_REGEX = /BR-SPT-07/;
const D1_UNREGISTERED_REGEX = /Cloudflare D1 binding is not registered/;
const TX_CONTROL_SQL_REGEX =
  /^\s*(?:BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE\s+SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)\b/i;

interface D1SpyHandle {
  readonly d1: MinimalD1Database;
  readonly execCalls: string[];
  readonly preparedSqls: string[];
}

function wrapRawMethod(
  stmt: MinimalD1PreparedStatement
): MinimalD1PreparedStatement["raw"] {
  function raw(options: {
    columnNames: true;
  }): Promise<[string[], ...D1CellValue[][]]>;
  function raw(options?: { columnNames?: false }): Promise<D1CellValue[][]>;
  function raw(options?: {
    columnNames?: boolean;
  }): Promise<[string[], ...D1CellValue[][]] | D1CellValue[][]> {
    if (options?.columnNames) {
      return stmt.raw({ columnNames: true });
    }
    return stmt.raw({ columnNames: false });
  }
  return raw;
}

function createSpyD1Binding(base: MinimalD1Database): D1SpyHandle {
  const execCalls: string[] = [];
  const preparedSqls: string[] = [];

  const wrapStatement = (
    stmt: MinimalD1PreparedStatement
  ): MinimalD1PreparedStatement => ({
    bind(...values: D1BindValue[]): MinimalD1PreparedStatement {
      return wrapStatement(stmt.bind(...values));
    },
    raw: wrapRawMethod(stmt),
    async run(): Promise<MinimalD1RunResult> {
      const res = await stmt.run();
      const metaRows = await base
        .prepare(
          "SELECT changes() AS changes, last_insert_rowid() AS last_row_id"
        )
        .raw({ columnNames: false });
      const row = metaRows[0];
      return {
        success: res.success,
        meta: {
          changes: typeof row?.[0] === "number" ? row[0] : 0,
          last_row_id: typeof row?.[1] === "number" ? row[1] : 0,
        },
      };
    },
  });

  const d1: MinimalD1Database = {
    prepare(query: string): MinimalD1PreparedStatement {
      preparedSqls.push(query);
      return wrapStatement(base.prepare(query));
    },
    batch(
      statements: MinimalD1PreparedStatement[]
    ): Promise<MinimalD1RunResult[]> {
      return base.batch(statements);
    },
    exec(query: string): Promise<MinimalD1ExecResult> {
      execCalls.push(query);
      return base.exec(query);
    },
  };

  return { d1, execCalls, preparedSqls };
}

function runInIsolatedAsyncContext<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      fn().then(resolve, reject);
    }, 0);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractErrorMessage(err: Error | object | string): string {
  if (typeof err === "string") {
    return err;
  }
  if ("cause" in err && err.cause && typeof err.cause === "object") {
    const causeObj = err.cause as { message?: string };
    if (typeof causeObj.message === "string" && causeObj.message.length > 0) {
      return causeObj.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

async function expectTriggerRejection(
  action: () => Promise<void>,
  pattern: RegExp
): Promise<void> {
  let message = "";
  try {
    await action();
  } catch (err) {
    const safeErr =
      err instanceof Error || (typeof err === "object" && err !== null)
        ? err
        : String(err);
    message = extractErrorMessage(safeErr);
  }
  expect(message).toMatch(pattern);
}

describe("DatabaseManager (DB) & Multi-Driver Engine (SQLite & Cloudflare D1)", () => {
  const tempDirs: string[] = [];
  const initialEnvDbConn = process.env.DB_CONNECTION;
  const initialEnvRuntime = process.env.MINDKID_RUNTIME;
  const initialEnvSqliteDir = process.env.SQLITE_DATA_DIR;

  function createTempSqliteDir(prefix: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(async () => {
    DB.resetDefaultConnection();
    DB.clearD1Bindings();
    await DB.getSqliteDriver().disconnect();

    if (initialEnvDbConn === undefined) {
      Reflect.deleteProperty(process.env, "DB_CONNECTION");
    } else {
      process.env.DB_CONNECTION = initialEnvDbConn;
    }

    if (initialEnvRuntime === undefined) {
      Reflect.deleteProperty(process.env, "MINDKID_RUNTIME");
    } else {
      process.env.MINDKID_RUNTIME = initialEnvRuntime;
    }

    if (initialEnvSqliteDir === undefined) {
      Reflect.deleteProperty(process.env, "SQLITE_DATA_DIR");
    } else {
      process.env.SQLITE_DATA_DIR = initialEnvSqliteDir;
    }

    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await truncateAllTestTables();
  });

  it("resolves connection priority cleanly across explicit env, cloudflare, vps, and local defaults", () => {
    expect(getDbConnectionName("sqlite", "vps")).toBe("sqlite");
    expect(getDbConnectionName("d1", "local")).toBe("d1");

    const prevConn = process.env.DB_CONNECTION;
    const prevRuntime = process.env.MINDKID_RUNTIME;
    Reflect.deleteProperty(process.env, "DB_CONNECTION");
    Reflect.deleteProperty(process.env, "MINDKID_RUNTIME");
    try {
      expect(getDbConnectionName(undefined, "cloudflare")).toBe("d1");
      expect(getDbConnectionName(undefined, "vps")).toBe("sqlite");
      expect(getDbConnectionName(undefined, undefined)).toBe("sqlite");
      const isolatedManager = new DatabaseManager();
      expect(isolatedManager.getDefaultConnection()).toBe("sqlite");
      isolatedManager.setDefaultConnection("d1");
      expect(isolatedManager.getDefaultConnection()).toBe("d1");
      isolatedManager.resetDefaultConnection();
      expect(isolatedManager.getDefaultConnection()).toBe("sqlite");
    } finally {
      if (prevConn !== undefined) {
        process.env.DB_CONNECTION = prevConn;
      }
      if (prevRuntime !== undefined) {
        process.env.MINDKID_RUNTIME = prevRuntime;
      }
    }
  });

  it("switches seamlessly across file-backed WAL sqlite, :memory: sqlite, and D1 bindings", async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

    // 1. File-backed SQLite in temp dir with WAL mode verified
    const walDir = createTempSqliteDir("mk-sqlite-wal-");
    DB.configureSqlite({ dataDir: walDir });
    const sqliteFileDb = DB.connection("sqlite");
    const paths = DB.getSqliteDriver().getPaths();
    const rawWalDb = DB.getSqliteDriver().getRawDatabase();

    expect(paths.isMemory).toBe(false);
    expect(fs.existsSync(paths.dbPath)).toBe(true);

    const journalRow = rawWalDb.prepare("PRAGMA journal_mode;").get() as {
      journal_mode?: string;
    };
    expect(journalRow.journal_mode?.toLowerCase()).toBe("wal");

    const fkRow = rawWalDb.prepare("PRAGMA foreign_keys;").get() as {
      foreign_keys?: number;
    };
    expect(fkRow.foreign_keys).toBe(1);

    const [walUser] = await sqliteFileDb
      .insert(users)
      .values({
        email: `wal-${suffix}@mindkid.test`,
        displayName: "WAL SQLite User",
        emailVerified: true,
      })
      .returning();
    expect(walUser?.email).toBe(`wal-${suffix}@mindkid.test`);
    expect(walUser?.emailVerified).toBe(true);

    // 2. Reconfigure SQLite to :memory: and verify clean isolation
    DB.configureSqlite({ dataDir: ":memory:" });
    const sqliteMemDb = DB.connection("sqlite");
    expect(DB.getSqliteDriver().getPaths().isMemory).toBe(true);

    const memExisting = await sqliteMemDb.select().from(users);
    expect(memExisting).toHaveLength(0);

    const [memUser] = await sqliteMemDb
      .insert(users)
      .values({
        email: `mem-${suffix}@mindkid.test`,
        displayName: "Memory SQLite User",
      })
      .returning();
    expect(memUser?.id).toBe(1);

    // 3. D1 binding: throws before registration, works cleanly once registered
    DB.clearD1Bindings();
    expect(() => DB.connection("d1")).toThrow(D1_UNREGISTERED_REGEX);

    const d1Ctx = createInMemoryD1Database();
    try {
      DB.registerD1Bindings({ core: d1Ctx.d1 });
      const d1Db = DB.connection("d1");

      const [d1User] = await d1Db
        .insert(users)
        .values({
          email: `d1-${suffix}@mindkid.test`,
          displayName: "D1 Binding User",
        })
        .returning();
      expect(d1User?.id).toBe(1);

      const [auditRow] = await d1Db
        .insert(auditLogs)
        .values({
          actorType: ACTOR_TYPE.SYSTEM,
          action: "d1.binding.check",
          entityType: "driver",
          entityId: suffix,
        })
        .returning();
      expect(auditRow?.entityId).toBe(suffix);

      const memCheck = await sqliteMemDb
        .select()
        .from(users)
        .where(eq(users.email, `d1-${suffix}@mindkid.test`));
      expect(memCheck).toHaveLength(0);
    } finally {
      DB.clearD1Bindings();
      d1Ctx.close();
    }
  });

  it("isolates DB.usingConnection('sqlite') and DB.usingConnection('d1') via AsyncLocalStorage without mutating global default", async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    DB.configureSqlite({ dataDir: ":memory:" });
    const d1Ctx = createInMemoryD1Database();
    DB.registerD1Bindings(d1Ctx.d1);
    DB.setDefaultConnection("sqlite");

    try {
      const sqliteEmail = `scoped-sqlite-${suffix}@mindkid.test`;
      const d1Email = `scoped-d1-${suffix}@mindkid.test`;

      const [sqliteResult, d1Result] = await Promise.all([
        DB.usingConnection("sqlite", async (scopedDb) => {
          expect(DB.getDefaultConnection()).toBe("sqlite");
          expect(DB.connection()).toBe(scopedDb);

          const [created] = await DB.connection()
            .insert(users)
            .values({
              email: sqliteEmail,
              displayName: "Scoped SQLite",
            })
            .returning();
          return created;
        }),
        DB.usingConnection("d1", async (scopedDb) => {
          expect(DB.getDefaultConnection()).toBe("sqlite");
          expect(DB.connection()).toBe(scopedDb);

          const [created] = await DB.connection()
            .insert(users)
            .values({
              email: d1Email,
              displayName: "Scoped D1",
            })
            .returning();
          return created;
        }),
      ]);

      expect(DB.getDefaultConnection()).toBe("sqlite");
      expect(sqliteResult?.email).toBe(sqliteEmail);
      expect(d1Result?.email).toBe(d1Email);

      const sqliteRows = await DB.connection("sqlite")
        .select()
        .from(users)
        .where(eq(users.email, d1Email));
      expect(sqliteRows).toHaveLength(0);

      const d1Rows = await DB.connection("d1")
        .select()
        .from(users)
        .where(eq(users.email, sqliteEmail));
      expect(d1Rows).toHaveLength(0);
    } finally {
      DB.clearD1Bindings();
      d1Ctx.close();
    }
  });

  it("commits and rolls back DB.transaction(...) cleanly on sqlite", async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    DB.configureSqlite({ dataDir: ":memory:" });

    const committedEmail = `tx-ok-sqlite-${suffix}@mindkid.test`;
    await DB.transaction(async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({
          email: committedEmail,
          displayName: "sqlite Committed",
        })
        .returning();
      if (!u) {
        throw new Error("Expected committed user");
      }
      await tx.insert(childProfiles).values({
        userId: u.id,
        displayName: "Bé Bi",
        birthYear: 2021,
        avatarId: "fox",
        relationship: CHILD_RELATIONSHIP.CHILD,
      });
    }, "sqlite");

    const afterCommit = await DB.connection("sqlite")
      .select()
      .from(users)
      .where(eq(users.email, committedEmail));
    expect(afterCommit).toHaveLength(1);

    const rolledBackEmail = `tx-rb-sqlite-${suffix}@mindkid.test`;
    await expect(
      DB.transaction(async (tx) => {
        await tx.insert(users).values({
          email: rolledBackEmail,
          displayName: "sqlite Rolled Back",
        });
        throw new Error("Simulated sqlite transaction abort");
      }, "sqlite")
    ).rejects.toThrow("Simulated sqlite transaction abort");

    const rolledBackUsers = await DB.connection("sqlite")
      .select()
      .from(users)
      .where(eq(users.email, rolledBackEmail));
    expect(rolledBackUsers).toHaveLength(0);

    await expect(DB.ping("sqlite")).resolves.toBeUndefined();
  });

  it("does not emit BEGIN/COMMIT/ROLLBACK to D1 exec or prepare and reads meta.changes & meta.last_row_id (NEW-2 & NEW-3)", async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const d1Ctx = createInMemoryD1Database();
    const spy = createSpyD1Binding(d1Ctx.d1);
    DB.registerD1Bindings(spy.d1);

    try {
      const d1Db = DB.connection("d1");

      // NEW-2: DB.transaction on D1 must never send BEGIN/COMMIT/ROLLBACK to d1.exec or d1.prepare
      const txEmail = `d1-tx-${suffix}@mindkid.test`;
      await DB.transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            email: txEmail,
            displayName: "D1 Tx User",
          })
          .returning();
        if (!u) {
          throw new Error("Expected D1 user");
        }
        await tx.insert(childProfiles).values({
          userId: u.id,
          displayName: "Bé Bo",
          birthYear: 2021,
          avatarId: "fox",
          relationship: CHILD_RELATIONSHIP.CHILD,
        });
      }, "d1");

      await expect(
        DB.transaction(async (tx) => {
          await tx.insert(users).values({
            email: `d1-err-${suffix}@mindkid.test`,
            displayName: "D1 Error Propagation",
          });
          throw new Error("Simulated d1 transaction abort");
        }, "d1")
      ).rejects.toThrow("Simulated d1 transaction abort");

      expect(spy.execCalls).toEqual([]);
      expect(spy.execCalls).not.toContain("BEGIN");
      expect(spy.execCalls).not.toContain("COMMIT");
      expect(spy.execCalls).not.toContain("ROLLBACK");
      expect(
        spy.preparedSqls.some((query) => TX_CONTROL_SQL_REGEX.test(query))
      ).toBe(false);

      // NEW-3: D1Driver reads meta.changes and meta.last_row_id on insert & update
      const insertMeta1 = await d1Db.insert(users).values({
        email: `d1-meta-1-${suffix}@mindkid.test`,
        displayName: "Meta User 1",
      });
      expect(insertMeta1.changes).toBe(1);
      expect(insertMeta1.lastInsertRowid).toBe(3);

      const insertMeta2 = await d1Db.insert(users).values({
        email: `d1-meta-2-${suffix}@mindkid.test`,
        displayName: "Meta User 2",
      });
      expect(insertMeta2.changes).toBe(1);
      expect(insertMeta2.lastInsertRowid).toBe(4);

      const updateOneMeta = await d1Db
        .update(users)
        .set({ displayName: "Updated Meta 1" })
        .where(eq(users.id, insertMeta1.lastInsertRowid));
      expect(updateOneMeta.changes).toBe(1);

      const updateNoneMeta = await d1Db
        .update(users)
        .set({ displayName: "No Match" })
        .where(eq(users.id, 999_999));
      expect(updateNoneMeta.changes).toBe(0);

      await expect(DB.ping("d1")).resolves.toBeUndefined();
    } finally {
      DB.clearD1Bindings();
      d1Ctx.close();
    }
  });

  it("isolates concurrent DB.enterCloudflareD1Binding(bindingA) vs bindingB via AsyncLocalStorage in Promise.all", async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const d1CtxA = createInMemoryD1Database();
    const d1CtxB = createInMemoryD1Database();
    DB.clearD1Bindings();

    const emailA = `isolate-a-${suffix}@mindkid.test`;
    const emailB = `isolate-b-${suffix}@mindkid.test`;

    try {
      const [rowsFromA, rowsFromB] = await Promise.all([
        runInIsolatedAsyncContext(async () => {
          DB.enterCloudflareD1Binding(d1CtxA.d1);
          await DB.connection("d1").insert(users).values({
            email: emailA,
            displayName: "Worker Isolate A",
          });
          await delay(25);
          return await DB.connection("d1")
            .select({ email: users.email })
            .from(users);
        }),
        runInIsolatedAsyncContext(async () => {
          DB.enterCloudflareD1Binding(d1CtxB.d1);
          await delay(10);
          await DB.connection("d1").insert(users).values({
            email: emailB,
            displayName: "Worker Isolate B",
          });
          await delay(25);
          return await DB.connection("d1")
            .select({ email: users.email })
            .from(users);
        }),
      ]);

      expect(rowsFromA.map((r) => r.email)).toEqual([emailA]);
      expect(rowsFromB.map((r) => r.email)).toEqual([emailB]);
      expect(() => DB.connection("d1")).toThrow(D1_UNREGISTERED_REGEX);
    } finally {
      DB.clearD1Bindings();
      d1CtxA.close();
      d1CtxB.close();
    }
  });

  it("initializes all 66 schema tables via initLocalSqlite and enforces BR-DM-05 & BR-SPT-07 immutability triggers", async () => {
    const initDir = createTempSqliteDir("mk-sqlite-init-");
    const summary = initLocalSqlite(initDir);

    const allTables = collectAllTables();
    expect(allTables.length).toBe(66);
    expect(summary.schemaTableCount).toBe(66);
    expect(summary.createdTableCount).toBe(66);
    expect(summary.triggerCount).toBe(5);

    const sqliteDb = DB.connection("sqlite");

    const [user] = await sqliteDb
      .insert(users)
      .values({
        email: "trigger-guard@mindkid.test",
        displayName: "Trigger Guard Parent",
      })
      .returning();
    if (!user) {
      throw new Error("Expected user to be created in SQLite");
    }

    // 1. consent_logs INSERT-only trigger (BR-DM-05)
    const [consent] = await sqliteDb
      .insert(consentLogs)
      .values({
        userId: user.id,
        consentType: CONSENT_TYPE.TERMS,
        action: CONSENT_ACTION.ACCEPTED,
        ipAddress: "203.0.113.5",
        userAgent: "MindKidVitest/1.0",
      })
      .returning();
    if (!consent) {
      throw new Error("Expected consent log to be created");
    }

    await expectTriggerRejection(async () => {
      await sqliteDb
        .update(consentLogs)
        .set({ action: CONSENT_ACTION.WITHDRAWN })
        .where(eq(consentLogs.id, consent.id));
    }, INSERT_ONLY_REGEX);

    await expectTriggerRejection(async () => {
      await sqliteDb.delete(consentLogs).where(eq(consentLogs.id, consent.id));
    }, INSERT_ONLY_REGEX);

    // 2. audit_logs INSERT-only trigger (BR-DM-05)
    const [audit] = await sqliteDb
      .insert(auditLogs)
      .values({
        actorType: ACTOR_TYPE.USER,
        actorId: user.id,
        action: "consent.accepted",
        entityType: "consent_log",
        entityId: String(consent.id),
      })
      .returning();
    if (!audit) {
      throw new Error("Expected audit log to be created");
    }

    await expectTriggerRejection(async () => {
      await sqliteDb
        .update(auditLogs)
        .set({ reason: "tamper" })
        .where(eq(auditLogs.id, audit.id));
    }, INSERT_ONLY_REGEX);

    await expectTriggerRejection(async () => {
      await sqliteDb.delete(auditLogs).where(eq(auditLogs.id, audit.id));
    }, INSERT_ONLY_REGEX);

    // 3. Completed play_sessions immutability trigger (BR-SPT-07)
    const [level] = await sqliteDb
      .insert(gameLevels)
      .values({
        code: "GL-TRIG-001",
        templateCode: "C1-01",
        title: "Đếm sao trên trời",
        contentPack: { items: ["star"] },
        difficultyParams: { count: 3 },
        accessTier: ACCESS_TIER.FREE,
      })
      .returning();
    if (!level) {
      throw new Error("Expected game level to be created");
    }

    const [session] = await sqliteDb
      .insert(playSessions)
      .values({
        gameLevelId: level.id,
        templateCode: "C1-01",
        guestDeviceId: "guest-dev-01",
        completionStatus: PLAY_COMPLETION_STATUS.IN_PROGRESS,
      })
      .returning();
    if (!session) {
      throw new Error("Expected play session to be created");
    }

    await sqliteDb
      .update(playSessions)
      .set({
        completionStatus: PLAY_COMPLETION_STATUS.COMPLETED,
        score: 100,
        starsEarned: 3,
        completedAt: new Date("2026-11-22T02:00:00.000Z"),
      })
      .where(eq(playSessions.id, session.id));

    await expectTriggerRejection(async () => {
      await sqliteDb
        .update(playSessions)
        .set({ score: 0 })
        .where(eq(playSessions.id, session.id));
    }, COMPLETED_SESSION_REGEX);
  });
});
