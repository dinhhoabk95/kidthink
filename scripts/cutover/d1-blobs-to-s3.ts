import { DatabaseSync } from "node:sqlite";
import {
  type BlobCutoverSummary,
  type ObjectStorageDriver,
  transferBlobRecordsToDriver,
} from "@mindkid/storage";

export type { BlobCutoverSummary } from "@mindkid/storage";

export async function migrateD1BlobsToS3(options: {
  readonly blobsSqlitePath: string;
  readonly targetS3Driver: ObjectStorageDriver;
  readonly now?: Date;
}): Promise<BlobCutoverSummary> {
  const sqlite = new DatabaseSync(options.blobsSqlitePath);
  const tableExists = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'stored_blobs'"
    )
    .get();
  if (!tableExists) {
    return { transferredCount: 0, skippedExpiredCount: 0, totalBytes: 0 };
  }

  const rawRows = sqlite
    .prepare(
      'SELECT "key", "bucket", "content_type", "body", "expires_at" FROM "stored_blobs"'
    )
    .all();

  const records = rawRows.map((r) => ({
    key: String(r.key ?? ""),
    bucket: String(r.bucket ?? "private"),
    contentType: String(r.content_type ?? "application/octet-stream"),
    body: r.body instanceof Uint8Array ? r.body : new Uint8Array(),
    expiresAtIso: typeof r.expires_at === "string" ? r.expires_at : null,
  }));

  return await transferBlobRecordsToDriver({
    records,
    targetDriver: options.targetS3Driver,
    now: options.now,
  });
}
