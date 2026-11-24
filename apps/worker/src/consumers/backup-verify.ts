import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { requireEnv } from "@mindkid/config";
import { BACKUP_DIR } from "@mindkid/config/backup";
import { alert } from "@mindkid/queue";
import {
  createLocalBackupLog,
  findLatestLocalBackupLogByTypeAndStatus,
  updateLocalBackupLog,
} from "#src/backup/backup-log-store";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

const SQLITE_HEADER_MAGIC = "SQLite format 3\0";
const ENCRYPTION_KEY_BYTES = 32;

/** Same seam as runPostgresBackup: injected for tests, never configurable. */
export interface VerifyOptions {
  directory?: string;
}

async function openEncryptedBackupStream(
  backupFile: string,
  encryptionKey: string
): Promise<{ fileStream: fs.ReadStream; decipher: crypto.DecipherGCM }> {
  const fileHandle = await fs.promises.open(backupFile, "r");
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

  const fileStream = fs.createReadStream(backupFile, {
    start: 16,
    end: totalSize - 17,
  });

  return { fileStream, decipher };
}

function assertSqliteHeader(sqlitePath: string): void {
  const fd = fs.openSync(sqlitePath, "r");
  try {
    const header = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, header, 0, 16, 0);
    if (bytesRead < 16 || header.toString("utf8") !== SQLITE_HEADER_MAGIC) {
      throw new Error("Verify failed: invalid SQLite header");
    }
  } finally {
    fs.closeSync(fd);
  }
}

function verifySqliteDatabase(sqlitePath: string): number {
  assertSqliteHeader(sqlitePath);

  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const integrity = db.prepare("PRAGMA integrity_check").get() as
      | { readonly integrity_check?: string }
      | undefined;
    if (integrity?.integrity_check !== "ok") {
      throw new Error(
        `Verify failed: integrity_check=${integrity?.integrity_check ?? "unknown"}`
      );
    }

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as Array<{ readonly name: string }>;

    if (tables.length === 0) {
      throw new Error("Verify failed: restored 0 tables");
    }

    let restoredRows = 0;
    for (const table of tables) {
      const quotedName = `"${table.name.replace(/"/g, '""')}"`;
      const row = db
        .prepare(`SELECT COUNT(*) AS cnt FROM ${quotedName}`)
        .get() as { readonly cnt?: number } | undefined;
      restoredRows += Number(row?.cnt ?? 0);
    }

    if (restoredRows === 0) {
      throw new Error("Verify failed: restored 0 rows");
    }

    return restoredRows;
  } finally {
    db.close();
  }
}

export async function runVerifyBackup(
  jobId: string,
  options: VerifyOptions = {}
) {
  const directory = options.directory ?? BACKUP_DIR;
  const encryptionKey = requireEnv("BACKUP_ENCRYPTION_KEY");
  if (encryptionKey.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error(
      `BACKUP_ENCRYPTION_KEY must be a ${ENCRYPTION_KEY_BYTES}-character string`
    );
  }

  const log = createLocalBackupLog(directory, {
    backupType: "verify",
    status: "started",
    startedAt: new Date(),
  });

  const tempSqlitePath = path.join(
    os.tmpdir(),
    `mindkid-verify-${crypto.randomBytes(6).toString("hex")}.sqlite`
  );

  try {
    const latestBackup = findLatestLocalBackupLogByTypeAndStatus(
      directory,
      "dump",
      "success"
    );

    if (!latestBackup?.storagePath) {
      throw new Error("No successful backup found to verify");
    }

    const backupFile = path.join(
      directory,
      path.basename(latestBackup.storagePath)
    );

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const { fileStream, decipher } = await openEncryptedBackupStream(
      backupFile,
      encryptionKey
    );

    await pipeline(
      fileStream,
      decipher,
      createGunzip(),
      fs.createWriteStream(tempSqlitePath)
    );

    const restoredRows = verifySqliteDatabase(tempSqlitePath);

    updateLocalBackupLog(directory, log.id, {
      status: "success",
      restoredRows,
      finishedAt: new Date(),
    });
  } catch (error) {
    const sanitizedError = readErrorMessage(error).replace(
      /(:\/\/[^:\s/]+:)[^@\s]+@/g,
      "$1[REDACTED]@"
    );

    await alert("critical", "Backup verify failed", {
      jobId,
      error: sanitizedError,
    });

    updateLocalBackupLog(directory, log.id, {
      status: "failed",
      errorMessage: sanitizedError,
      finishedAt: new Date(),
    });

    throw error;
  } finally {
    fs.rmSync(tempSqlitePath, { force: true });
  }
}

export const backupVerify: Consumer<"backup:verify"> = async (
  _payload,
  ctx
) => {
  await runVerifyBackup(ctx.jobId);
  logJobDone("backup:verify", ctx);
};
