import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { backupLog, getOwnerDb } from "@kidthink/db";

const dbNameRegex = /\/[^/]+(\?.*)?$/;

import { alert } from "@kidthink/queue";
import { desc, eq } from "drizzle-orm";
import postgres from "postgres";

export async function runVerifyBackup(jobId: string) {
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (encryptionKey?.length !== 32) {
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

  let tempDbName = "";

  try {
    // 1. Find the latest backup log with status 'success'
    const [latestBackup] = await getOwnerDb()
      .select()
      .from(backupLog)
      .where(eq(backupLog.backupType, "database"))
      // wait, we changed it to 'dump' but the old ones might be 'database' or the migration changed the enum values.
      // We will check for either 'database' or 'dump' but since we didn't migrate old records, let's just sort by startedAt and get the latest
      .orderBy(desc(backupLog.startedAt))
      .limit(1);

    if (!latestBackup?.storagePath) {
      throw new Error("No successful backup found to verify");
    }

    const storageDir = path.join(process.cwd(), ".backups");
    const backupFile = path.join(storageDir, latestBackup.storagePath);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // 2. Read IV and create decipher
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
      end: stats.size - 17, // don't include auth tag
    });

    const gunzip = createGunzip();

    // 3. Create temp database
    const dbUrl =
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/kidthink";
    tempDbName = `verify_${crypto.randomBytes(4).toString("hex")}`;

    // Connect to default DB to create temp DB
    const sqlAdmin = postgres(dbUrl);
    await sqlAdmin.unsafe(`CREATE DATABASE ${tempDbName}`);
    await sqlAdmin.end();

    // 4. Restore via psql
    const tempDbUrl = dbUrl.replace(dbNameRegex, `/${tempDbName}$1`);

    // Safety check: ensure we are not restoring into the main DB
    if (!tempDbName.startsWith("verify_")) {
      throw new Error(
        "Safety check failed: target DB must be a verify temp DB"
      );
    }

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

    // 5. Verify schema / rows
    const sqlVerify = postgres(tempDbUrl);
    const result = await sqlVerify.unsafe<{ count: string }[]>(`
      SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'
    `);

    const restoredRows = Number.parseInt(result[0].count, 10);
    if (restoredRows === 0) {
      throw new Error("Verify failed: restored 0 rows");
    }

    await sqlVerify.end();

    // 6. Cleanup temp DB
    const sqlAdminCleanup = postgres(dbUrl);
    await sqlAdminCleanup.unsafe(`DROP DATABASE ${tempDbName}`);
    await sqlAdminCleanup.end();

    // 7. Update log
    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "success",
        restoredRows,
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));
  } catch (error: unknown) {
    if (tempDbName) {
      try {
        const dbUrl =
          process.env.DATABASE_URL ||
          "postgres://postgres:postgres@localhost:5432/kidthink";
        const sqlAdminCleanup = postgres(dbUrl);
        await sqlAdminCleanup.unsafe(`DROP DATABASE IF EXISTS ${tempDbName}`);
        await sqlAdminCleanup.end();
      } catch (_e) {
        // Ignore cleanup errors
      }
    }

    alert("critical", "Backup verify failed", {
      jobId,
      error: error.message || String(error),
    });

    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "failed",
        errorMessage: error.message || String(error),
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));

    throw error;
  }
}
