import type { MinimalBlobSqlPort } from "#src/object-storage-driver";

/** Giá giá trị bind/cell tối thiểu mà bảng `stored_blobs` cần. */
type BlobCell = string | number | null | boolean | Uint8Array;

interface BlobD1Statement {
  bind(...values: (string | number | null)[]): BlobD1Statement;
  raw(): Promise<BlobCell[][]>;
  run(): Promise<{ readonly meta?: { readonly changes?: number } }>;
}

/** Tập con cấu trúc của `MinimalD1Database` (@mindkid/db) — tránh phụ thuộc vòng. */
export interface BlobD1Database {
  prepare(query: string): BlobD1Statement;
}

export const STORED_BLOBS_DDL = `CREATE TABLE IF NOT EXISTS stored_blobs (
  bucket TEXT NOT NULL,
  key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  body_base64 TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (bucket, key)
);
CREATE INDEX IF NOT EXISTS stored_blobs_expires_idx ON stored_blobs (expires_at);
`;

function asString(cell: BlobCell | undefined): string {
  return typeof cell === "string" ? cell : String(cell ?? "");
}

export function createD1BlobSqlPort(db: BlobD1Database): MinimalBlobSqlPort {
  return {
    async upsertBlob(row) {
      await db
        .prepare(
          `INSERT INTO stored_blobs (bucket, key, content_type, byte_size, body_base64, expires_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (bucket, key) DO UPDATE SET
             content_type = excluded.content_type,
             byte_size = excluded.byte_size,
             body_base64 = excluded.body_base64,
             expires_at = excluded.expires_at`
        )
        .bind(
          row.bucket,
          row.key,
          row.contentType,
          row.byteSize,
          row.bodyBase64,
          row.expiresAtIso
        )
        .run();
    },
    async readBlob(bucket, key) {
      const rows = await db
        .prepare(
          "SELECT content_type, body_base64, expires_at FROM stored_blobs WHERE bucket = ? AND key = ?"
        )
        .bind(bucket, key)
        .raw();
      const row = rows[0];
      if (!row) {
        return undefined;
      }
      const expires = row[2];
      return {
        contentType: asString(row[0]),
        bodyBase64: asString(row[1]),
        expiresAtIso: typeof expires === "string" ? expires : null,
      };
    },
    async removeBlob(bucket, key) {
      const result = await db
        .prepare("DELETE FROM stored_blobs WHERE bucket = ? AND key = ?")
        .bind(bucket, key)
        .run();
      return (result.meta?.changes ?? 0) > 0;
    },
  };
}
