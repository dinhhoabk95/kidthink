import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { requireEnv } from "@mindkid/config";
import { backupLog, getOwnerDb } from "@mindkid/db";
import { desc, eq } from "drizzle-orm";
import postgres from "postgres";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

function getEncryptionKey() {
  const encryptionKey = requireEnv("BACKUP_ENCRYPTION_KEY");
  if (encryptionKey.length !== 32) {
    throw new Error("BACKUP_ENCRYPTION_KEY must be 32 characters");
  }
  return encryptionKey;
}

function getDbUrl() {
  return requireEnv("DATABASE_URL");
}

async function main() {
  const encryptionKey = getEncryptionKey();
  const dbUrl = getDbUrl();

  console.log("Fetching successful backups...");
  const backups = await getOwnerDb()
    .select()
    .from(backupLog)
    .where(eq(backupLog.status, "success"))
    .orderBy(desc(backupLog.startedAt))
    .limit(10);

  if (backups.length === 0) {
    console.log("No successful backups found.");
    process.exit(0);
  }

  console.log("\nAvailable Backups:");
  const storageDir = path.join(process.cwd(), ".backups");

  for (const b of backups) {
    let sizeStr = "Unknown";
    if (b.storagePath) {
      const filePath = path.join(storageDir, b.storagePath);
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
  const targetBackup = backups.find((b) => b.id === selectedId);

  if (!targetBackup?.storagePath) {
    console.error("Invalid ID or missing storage path.");
    process.exit(1);
  }

  const backupFile = path.join(storageDir, targetBackup.storagePath);
  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  // Check if DB is active (đang nhận ghi)
  const sql = postgres(dbUrl);
  const activity = await sql`
    SELECT count(*) FROM pg_stat_activity 
    WHERE datname = current_database() 
    AND pid <> pg_backend_pid()
    AND state = 'active'
  `;

  if (Number.parseInt(activity[0].count, 10) > 0) {
    console.error(
      "ERROR: Target database has active connections and might be receiving writes. Aborting restore to prevent data corruption."
    );
    process.exit(1);
  }

  const confirm = await question(
    "\nWARNING: This will OVERWRITE the current database.\nTo confirm, type RESTORE: "
  );
  if (confirm !== "RESTORE") {
    console.log("Aborted.");
    process.exit(0);
  }

  console.log("Starting restore process...");
  const startTime = Date.now();

  const [log] = await getOwnerDb()
    .insert(backupLog)
    .values({
      backupType: "drill",
      status: "started",
      startedAt: new Date(),
    })
    .returning();

  try {
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

    const gunzip = createGunzip();

    const psqlProcess = spawn("psql", [dbUrl], {
      stdio: ["pipe", "inherit", "inherit"],
    });

    const psqlPromise = new Promise<void>((resolve, reject) => {
      psqlProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql restore failed with code ${code}`));
        }
      });
      psqlProcess.on("error", reject);
    });

    await Promise.all([
      pipeline(fileStream, decipher, gunzip, psqlProcess.stdin),
      psqlPromise,
    ]);

    const rtoMs = Date.now() - startTime;
    console.log(`Restore completed in ${rtoMs}ms (RTO)`);

    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "success",
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));
  } catch (error: unknown) {
    console.error("Restore failed:", error);
    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "failed",
        errorMessage: error.message || String(error),
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));
    process.exit(1);
  } finally {
    await sql.end();
    rl.close();
    process.exit(0);
  }
}

main();
