import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { DatabaseSync } from "node:sqlite";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { flushKvCachePrefixes } from "@mindkid/cache";
import { isCloudflareRuntime, requireEnv } from "@mindkid/config";
import { BACKUP_DIR } from "@mindkid/config/backup";
import { DB } from "@mindkid/db";
import {
  createLocalBackupLog,
  listRecentLocalBackupLogs,
  updateLocalBackupLog,
} from "#src/backup/backup-log-store";
import { runAccountPurgeSweep } from "#src/consumers/account-purge";
import { readErrorMessage } from "#src/errors";

const SQLITE_HEADER_MAGIC = "SQLite format 3\0";
const ENCRYPTION_KEY_BYTES = 32;
const POST_RESTORE_CACHE_PREFIXES = [
  "ba:v1:user:",
  "ba:v1:manager:",
  "user:entitlements:",
] as const;

export interface RestoreSqliteInput {
  readonly encryptedFilePath: string;
  readonly targetSqlitePath: string;
  readonly encryptionKey: string;
}

export interface RestoreSqliteResult {
  readonly rtoMs: number;
  readonly flushedKeys: number;
  readonly purgedAccounts: number;
}

function getEncryptionKey(): string {
  const encryptionKey = requireEnv("BACKUP_ENCRYPTION_KEY");
  if (encryptionKey.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error(
      `BACKUP_ENCRYPTION_KEY must be ${ENCRYPTION_KEY_BYTES} characters`
    );
  }
  return encryptionKey;
}

function assertTargetNotWriteLocked(targetSqlitePath: string): void {
  if (!fs.existsSync(targetSqlitePath)) {
    return;
  }

  let checkDb: DatabaseSync | undefined;
  try {
    checkDb = new DatabaseSync(targetSqlitePath, { timeout: 250 });
    checkDb.exec("BEGIN IMMEDIATE; ROLLBACK;");
  } catch (error) {
    throw new Error(
      `Target SQLite database is busy or holds an active write lock: ${readErrorMessage(error)}`
    );
  } finally {
    if (checkDb?.isOpen) {
      checkDb.close();
    }
  }
}

function assertValidSqliteFile(sqliteFilePath: string): void {
  const fd = fs.openSync(sqliteFilePath, "r");
  try {
    const header = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, header, 0, 16, 0);
    if (bytesRead < 16 || header.toString("utf8") !== SQLITE_HEADER_MAGIC) {
      throw new Error("Invalid SQLite backup header after decryption");
    }
  } finally {
    fs.closeSync(fd);
  }

  const verifyDb = new DatabaseSync(sqliteFilePath, { readOnly: true });
  try {
    const row = verifyDb.prepare("PRAGMA integrity_check").get() as
      | { readonly integrity_check?: string }
      | undefined;
    if (row?.integrity_check !== "ok") {
      throw new Error(
        `SQLite integrity_check failed: ${row?.integrity_check ?? "unknown"}`
      );
    }
  } finally {
    verifyDb.close();
  }
}

async function decryptBackupToSqliteFile(
  encryptedFilePath: string,
  outputSqlitePath: string,
  encryptionKey: string
): Promise<void> {
  const fileHandle = await fs.promises.open(encryptedFilePath, "r");
  let iv: Buffer;
  let authTag: Buffer;
  let totalSize: number;

  try {
    const stats = await fileHandle.stat();
    totalSize = stats.size;
    if (totalSize <= 32) {
      throw new Error("Encrypted backup file is corrupted or truncated");
    }

    iv = Buffer.alloc(16);
    await fileHandle.read(iv, 0, 16, 0);

    authTag = Buffer.alloc(16);
    await fileHandle.read(authTag, 0, 16, totalSize - 16);
  } finally {
    await fileHandle.close();
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "utf8"),
    iv
  );
  decipher.setAuthTag(authTag);

  const fileStream = fs.createReadStream(encryptedFilePath, {
    start: 16,
    end: totalSize - 17,
  });

  await pipeline(
    fileStream,
    decipher,
    createGunzip(),
    fs.createWriteStream(outputSqlitePath)
  );
}

/**
 * Flushes auth session namespaces and user entitlement caches after DB restore.
 * Never flushes the whole auth/queue keyspace so job queues stay intact.
 */
export async function flushPostRestoreAuthAndCache(): Promise<number> {
  return await flushKvCachePrefixes(POST_RESTORE_CACHE_PREFIXES);
}

async function reapplyPostRestorePurgeTombstones(
  targetSqlitePath: string
): Promise<number> {
  if (path.basename(targetSqlitePath) !== "mindkid.sqlite") {
    const res = await runAccountPurgeSweep();
    return res.purgedCount;
  }

  const driver = DB.getSqliteDriver();
  const prevPaths = driver.getPaths();
  const targetDir = path.dirname(path.resolve(targetSqlitePath));
  const changedDir = path.resolve(prevPaths.dataDir) !== targetDir;

  if (changedDir) {
    DB.configureSqlite({ dataDir: targetDir });
  }

  try {
    const res = await runAccountPurgeSweep();
    return res.purgedCount;
  } finally {
    if (changedDir) {
      DB.configureSqlite({ dataDir: prevPaths.dataDir });
    }
  }
}

export async function restoreSqliteBackupFile(
  input: RestoreSqliteInput
): Promise<RestoreSqliteResult> {
  if (input.encryptionKey.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error(
      `BACKUP_ENCRYPTION_KEY must be ${ENCRYPTION_KEY_BYTES} characters`
    );
  }
  if (!fs.existsSync(input.encryptedFilePath)) {
    throw new Error(`Backup file not found: ${input.encryptedFilePath}`);
  }
  if (input.targetSqlitePath === ":memory:") {
    throw new Error("Cannot restore onto an in-memory SQLite target");
  }

  const startTime = Date.now();
  const targetDir = path.dirname(input.targetSqlitePath);
  fs.mkdirSync(targetDir, { recursive: true });

  const driver = DB.getSqliteDriver();
  const currentPaths = driver.getPaths();
  if (
    !currentPaths.isMemory &&
    path.resolve(currentPaths.dbPath) === path.resolve(input.targetSqlitePath)
  ) {
    driver.closeSync();
  }

  assertTargetNotWriteLocked(input.targetSqlitePath);

  const tempRestorePath = `${input.targetSqlitePath}.sqlite.restore.tmp`;
  fs.rmSync(tempRestorePath, { force: true });

  try {
    await decryptBackupToSqliteFile(
      input.encryptedFilePath,
      tempRestorePath,
      input.encryptionKey
    );

    assertValidSqliteFile(tempRestorePath);

    fs.rmSync(`${input.targetSqlitePath}-wal`, { force: true });
    fs.rmSync(`${input.targetSqlitePath}-shm`, { force: true });
    fs.renameSync(tempRestorePath, input.targetSqlitePath);
  } finally {
    fs.rmSync(tempRestorePath, { force: true });
  }

  const flushedKeys = await flushPostRestoreAuthAndCache();
  const purgedAccounts = await reapplyPostRestorePurgeTombstones(
    input.targetSqlitePath
  );

  return {
    rtoMs: Date.now() - startTime,
    flushedKeys,
    purgedAccounts,
  };
}

async function main(): Promise<void> {
  console.log(
    "Lưu ý D1 remote: Nếu restore Cloudflare D1, hãy chạy `wrangler d1 export` / D1 Time Travel rồi flush `AuthCoordinatorDO` cho các prefix `ba:v1:*` và `user:entitlements:*`."
  );

  if (isCloudflareRuntime()) {
    console.log(
      "Môi trường Cloudflare runtime không hỗ trợ restore SQLite file cục bộ trực tiếp."
    );
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    const encryptionKey = getEncryptionKey();
    const targetPaths = DB.getSqliteDriver().getPaths();
    if (targetPaths.isMemory) {
      throw new Error("Cannot restore onto :memory: SQLite database");
    }

    console.log("Fetching successful backups...");
    const backups = listRecentLocalBackupLogs(BACKUP_DIR, 10, {
      status: "success",
    });

    if (backups.length === 0) {
      console.log("No successful backups found.");
      return;
    }

    console.log("\nAvailable Backups:");
    for (const b of backups) {
      let sizeStr = "Unknown";
      if (b.storagePath) {
        const filePath = path.join(BACKUP_DIR, path.basename(b.storagePath));
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          sizeStr = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
        }
      }
      console.log(
        `- ID: ${b.id} | Date: ${b.startedAt?.toISOString()} | Type: ${b.backupType} | Size: ${sizeStr}`
      );
    }

    const selectedId = await question(
      "\nPaste the ID of the backup you want to restore: "
    );
    const targetBackup = backups.find((b) => b.id === Number(selectedId));

    if (!targetBackup?.storagePath) {
      console.error("Invalid ID or missing storage path.");
      process.exitCode = 1;
      return;
    }

    const backupFile = path.join(
      BACKUP_DIR,
      path.basename(targetBackup.storagePath)
    );
    if (!fs.existsSync(backupFile)) {
      console.error(`Backup file not found: ${backupFile}`);
      process.exitCode = 1;
      return;
    }

    const confirm = await question(
      `\nWARNING: This will OVERWRITE ${targetPaths.dbPath}.\nTo confirm, type RESTORE: `
    );
    if (confirm !== "RESTORE") {
      console.log("Aborted.");
      return;
    }

    console.log("Starting SQLite restore process...");
    const log = createLocalBackupLog(BACKUP_DIR, {
      backupType: "drill",
      status: "started",
      startedAt: new Date(),
    });

    try {
      const result = await restoreSqliteBackupFile({
        encryptedFilePath: backupFile,
        targetSqlitePath: targetPaths.dbPath,
        encryptionKey,
      });
      console.log(
        `Restore completed in ${result.rtoMs}ms (RTO), flushed ${result.flushedKeys} cache/auth keys, purged ${result.purgedAccounts} expired accounts.`
      );
      updateLocalBackupLog(BACKUP_DIR, log.id, {
        status: "success",
        finishedAt: new Date(),
      });
    } catch (error) {
      console.error("Restore failed:", error);
      updateLocalBackupLog(BACKUP_DIR, log.id, {
        status: "failed",
        errorMessage: readErrorMessage(error),
        finishedAt: new Date(),
      });
      process.exitCode = 1;
    }
  } finally {
    rl.close();
  }
}

if (process.argv[1]?.endsWith("restore.ts")) {
  main().catch((error) => {
    console.error("Restore failed:", readErrorMessage(error));
    process.exit(1);
  });
}
