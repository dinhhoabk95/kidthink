import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { requireEnv } from "@mindkid/config";
import { BACKUP_DIR } from "@mindkid/config/backup";
import { backupLog, getOwnerDb } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { and, desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

const dbNameRegex = /\/[^/]+(\?.*)?$/;

/** Same seam as runPostgresBackup: injected for tests, never configurable. */
export interface VerifyOptions {
  directory?: string;
}

async function openEncryptedBackupStream(
  backupFile: string,
  encryptionKey: string
): Promise<{ fileStream: fs.ReadStream; decipher: crypto.DecipherGCM }> {
  const fileHandle = await fs.promises.open(backupFile, "r");
  const iv = Buffer.alloc(16);
  await fileHandle.read(iv, 0, 16, 0);

  const stats = await fileHandle.stat();
  const authTag = Buffer.alloc(16);
  await fileHandle.read(authTag, 0, 16, stats.size - 16);
  await fileHandle.close();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "utf8"),
    iv
  );
  decipher.setAuthTag(authTag);

  const fileStream = fs.createReadStream(backupFile, {
    start: 16,
    end: stats.size - 17,
  });

  return { fileStream, decipher };
}

async function createTempDatabase(
  dbUrl: string,
  tempDbName: string
): Promise<void> {
  const sqlAdmin = postgres(dbUrl);
  try {
    await sqlAdmin.unsafe(`CREATE DATABASE ${tempDbName}`);
  } finally {
    await sqlAdmin.end();
  }
}

async function dropTempDatabase(
  dbUrl: string,
  tempDbName: string
): Promise<void> {
  const sqlAdminCleanup = postgres(dbUrl);
  try {
    await sqlAdminCleanup.unsafe(`DROP DATABASE IF EXISTS ${tempDbName}`);
  } finally {
    await sqlAdminCleanup.end();
  }
}

async function restorePsqlDump(
  tempDbUrl: string,
  fileStream: fs.ReadStream,
  decipher: crypto.DecipherGCM
): Promise<void> {
  const gunzip = createGunzip();
  const psqlProcess = spawn("psql", [tempDbUrl], {
    stdio: ["pipe", "ignore", "pipe"],
  });

  let psqlStderr = "";
  psqlProcess.stderr.on("data", (data) => {
    psqlStderr += data.toString();
  });

  const psqlPromise = new Promise<void>((resolve, reject) => {
    psqlProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`psql restore failed: ${psqlStderr}`));
      }
    });
    psqlProcess.on("error", reject);
  });

  await Promise.all([
    pipeline(fileStream, decipher, gunzip, psqlProcess.stdin),
    psqlPromise,
  ]);
}

async function verifyTableCount(tempDbUrl: string): Promise<number> {
  const sqlVerify = postgres(tempDbUrl);
  try {
    const result = await sqlVerify.unsafe<{ count: string }[]>(`
      SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'
    `);
    const count = Number.parseInt(result[0]?.count ?? "0", 10);
    if (count === 0) {
      throw new Error("Verify failed: restored 0 rows");
    }
    return count;
  } finally {
    await sqlVerify.end();
  }
}

export async function runVerifyBackup(
  jobId: string,
  options: VerifyOptions = {}
) {
  const directory = options.directory ?? BACKUP_DIR;
  const encryptionKey = requireEnv("BACKUP_ENCRYPTION_KEY");
  if (encryptionKey.length !== 32) {
    throw new Error("BACKUP_ENCRYPTION_KEY must be a 32-character string");
  }

  // Create an initial backup_log entry for verify
  const [log] = await getOwnerDb()
    .insert(backupLog)
    .values({
      backupType: "verify",
      status: "started",
      startedAt: new Date(),
    })
    .returning();

  if (!log) {
    throw new Error("Failed to create backup log");
  }

  let tempDbName = "";

  try {
    // 1. Find the latest backup log with status 'success'
    const [latestBackup] = await getOwnerDb()
      .select()
      .from(backupLog)
      .where(
        and(eq(backupLog.backupType, "dump"), eq(backupLog.status, "success"))
      )
      .orderBy(desc(backupLog.startedAt))
      .limit(1);

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

    // 2. Read IV and create decipher
    const { fileStream, decipher } = await openEncryptedBackupStream(
      backupFile,
      encryptionKey
    );

    // 3. Create temp database
    const dbUrl = requireEnv("DATABASE_URL");
    tempDbName = `verify_${crypto.randomBytes(4).toString("hex")}`;
    await createTempDatabase(dbUrl, tempDbName);

    // 4. Restore via psql
    const tempDbUrl = dbUrl.replace(dbNameRegex, `/${tempDbName}$1`);
    if (!tempDbName.startsWith("verify_")) {
      throw new Error(
        "Safety check failed: target DB must be a verify temp DB"
      );
    }

    await restorePsqlDump(tempDbUrl, fileStream, decipher);

    // 5. Verify schema / rows
    const restoredRows = await verifyTableCount(tempDbUrl);

    // 6. Cleanup temp DB
    await dropTempDatabase(dbUrl, tempDbName);

    // 7. Update log
    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "success",
        restoredRows,
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));
  } catch (error) {
    if (tempDbName) {
      try {
        const dbUrl = requireEnv("DATABASE_URL");
        await dropTempDatabase(dbUrl, tempDbName);
      } catch {
        // Ignore cleanup errors
      }
    }

    const sanitizedError = readErrorMessage(error).replace(
      /(:\/\/[^:\s/]+:)[^@\s]+@/g,
      "$1[REDACTED]@"
    );

    await alert("critical", "Backup verify failed", {
      jobId,
      error: sanitizedError,
    });

    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "failed",
        errorMessage: sanitizedError,
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));

    throw error;
  }
}

export const backupVerify: Consumer<"backup:verify"> = async (
  _payload,
  ctx
) => {
  await runVerifyBackup(ctx.jobId);
  logJobDone("backup:verify", ctx);
};
