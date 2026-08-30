import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { requireEnv } from "@mindkid/config";
import { BACKUP_DIR, backupFilename } from "@mindkid/config/backup";
import { backupLog, getOwnerDb } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { eq } from "drizzle-orm";
import { uploadBackup } from "#src/backup/offsite";
import { selectExpired } from "#src/backup/retention";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

/** BR-BAK-05 keeps 30 daily; the weekly and monthly tiers live in retention.ts. */
export const RETENTION_DAYS_POSTGRES = 30;

const ENCRYPTION_KEY_BYTES = 32;

function sha256File(filePath: string): Promise<string> {
  // The hash of the file exactly as it sits on disk — IV, ciphertext and auth
  // tag. That is what BR-BAK-03 records and what the upload signs, so one
  // number verifies the object from either end.
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function writeEncryptedDump(
  storagePath: string,
  encryptionKey: string
): Promise<void> {
  const dbUrl = requireEnv("DATABASE_URL");
  const dumpProcess = spawn("pg_dump", [dbUrl], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  dumpProcess.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "utf8"),
    iv
  );

  const outStream = fs.createWriteStream(storagePath);
  outStream.write(iv);

  const dumpPromise = new Promise<void>((resolve, reject) => {
    dumpProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      // The message names the binary because the most common cause on a fresh
      // host is that it is not installed at all.
      reject(new Error(`pg_dump failed: ${stderr}`));
    });
    dumpProcess.on("error", (error) =>
      reject(new Error(`pg_dump could not start: ${error.message}`))
    );
  });

  await Promise.all([
    pipeline(dumpProcess.stdout, createGzip(), cipher, outStream),
    dumpPromise,
  ]);

  fs.appendFileSync(storagePath, cipher.getAuthTag());
}

/** Local pruning only. Bucket-side expiry is the bucket's lifecycle policy. */
function pruneLocalDumps(directory: string): number {
  const expired = selectExpired(fs.readdirSync(directory));
  for (const name of expired) {
    fs.rmSync(path.join(directory, name), { force: true });
  }
  return expired.length;
}

/**
 * Seams for the tests, not for configuration: the directory and the uploader
 * are injected rather than read from the environment, so no deployment can
 * accidentally point production dumps somewhere else.
 */
export interface BackupOptions {
  directory?: string;
  upload?: typeof uploadBackup;
}

export async function runPostgresBackup(
  _jobId: string,
  options: BackupOptions = {}
) {
  const directory = options.directory ?? BACKUP_DIR;
  const upload = options.upload ?? uploadBackup;
  const encryptionKey = requireEnv("BACKUP_ENCRYPTION_KEY");
  if (encryptionKey.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error(
      `BACKUP_ENCRYPTION_KEY must be a ${ENCRYPTION_KEY_BYTES}-character string`
    );
  }

  const [log] = await getOwnerDb()
    .insert(backupLog)
    .values({
      // Enum `backup_type` chỉ có dump|verify|drill — "database" không tồn tại
      // nên INSERT sẽ vỡ ngay ở Postgres.
      backupType: "dump",
      status: "started",
      startedAt: new Date(),
    })
    .returning();

  if (!log) {
    throw new Error("Failed to create backup log");
  }

  const startedAt = new Date();
  const filename = backupFilename(startedAt);

  // Outside the release tree on purpose: process.cwd() is /opt/mindkid/current,
  // a symlink into a directory release retention deletes after five deploys.
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const storagePath = path.join(directory, filename);

  try {
    await writeEncryptedDump(storagePath, encryptionKey);

    const checksum = await sha256File(storagePath);
    const { size } = fs.statSync(storagePath);

    // BR-BAK-02: the dump has to leave this machine. The encryption key lives
    // in /etc/mindkid/env/worker.env here and never goes to the bucket, so
    // whoever holds one of the two holds nothing usable.
    const uploaded = await upload({
      filePath: storagePath,
      filename,
      payloadSha256: checksum,
      now: startedAt,
    });

    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "success",
        sizeBytes: size,
        storagePath: uploaded.key,
        checksum,
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));

    pruneLocalDumps(directory);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    await getOwnerDb()
      .update(backupLog)
      .set({
        status: "failed",
        errorMessage: message,
        finishedAt: new Date(),
      })
      .where(eq(backupLog.id, log.id));

    // BR-BAK-04: a backup that failed and said nothing is how v1 ended up with
    // an empty backup_log nobody questioned. The local file is deliberately
    // left in place — if only the upload failed, it is still a usable dump.
    await alert(
      "critical",
      "PostgreSQL backup failed",
      { filename, reason: message },
      "https://docs.tinimath.vn/runbooks/backup-failed"
    );

    throw error;
  }
}

export const backupPostgres: Consumer<"backup:postgres"> = async (
  _payload,
  ctx
) => {
  await runPostgresBackup(ctx.jobId);
  logJobDone("backup:postgres", ctx);
};
