import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { requireEnv } from "@mindkid/config";
import { backupLog, getOwnerDb } from "@mindkid/db";
import { eq } from "drizzle-orm";

export const RETENTION_DAYS_POSTGRES = 30; // 30/12/24 khai thành hằng số có tên

export async function runPostgresBackup(_jobId: string) {
  const encryptionKey = requireEnv("BACKUP_ENCRYPTION_KEY");
  if (encryptionKey.length !== 32) {
    throw new Error("BACKUP_ENCRYPTION_KEY must be a 32-character string");
  }

  // Create an initial backup_log entry
  const [log] = await getOwnerDb()
    .insert(backupLog)
    .values({
      backupType: "database",
      status: "started",
      startedAt: new Date(),
    })
    .returning();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `db-backup-${timestamp}.sql.gz.enc`;

  // Không đường nào ghi dump ra thư mục người dùng hay bucket công khai.
  const storageDir = path.join(process.cwd(), ".backups");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  const storagePath = path.join(storageDir, filename);

  try {
    const dbUrl = requireEnv("DATABASE_URL");

    const dumpProcess = spawn("pg_dump", [dbUrl], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Capture stderr for error reporting
    let stderr = "";
    dumpProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const gzip = createGzip();

    // AES-256-GCM encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(encryptionKey, "utf8"),
      iv
    );

    // Compute checksum
    const hash = crypto.createHash("sha256");

    // We need to write IV first, then append ciphertext
    const outStream = fs.createWriteStream(storagePath);
    outStream.write(iv);

    // We can use transform stream or just pipe
    cipher.on("data", (chunk) => {
      hash.update(chunk);
    });

    const dumpPromise = new Promise<void>((resolve, reject) => {
      dumpProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed: ${stderr}`));
        }
      });
      dumpProcess.on("error", reject);
    });

    await Promise.all([
      pipeline(dumpProcess.stdout, gzip, cipher, outStream),
      dumpPromise,
    ]);

    // Get auth tag for GCM and append it
    const authTag = cipher.getAuthTag();
    fs.appendFileSync(storagePath, authTag);
    hash.update(authTag);

    const checksum = hash.digest("hex");
    const stats = fs.statSync(storagePath);

    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "success",
        sizeBytes: stats.size,
        storagePath: filename, // Just store filename/key
        checksum,
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));
  } catch (error: unknown) {
    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));

    throw error;
  }
}
