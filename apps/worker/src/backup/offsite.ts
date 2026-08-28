/**
 * Ships an encrypted dump to an S3-compatible bucket.
 * Contract: docs/specs/01-platform/backup-and-restore.md §4 step 2
 * Rules: BR-BAK-02 (dump and key never share a location), BR-BAK-07
 *
 * Signed by hand with node:crypto rather than through an SDK. Two reasons: the
 * only operation needed is one authenticated PUT, and staying on plain HTTPS
 * keeps every S3-compatible endpoint — AWS, R2, B2, MinIO — a configuration
 * change rather than a dependency change. The provider for this deployment is
 * still open (server-provisioning.md §11 question 1); binding the backup path
 * to one vendor's SDK before that decision would be the wrong order.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import { requireEnv } from "@mindkid/config";

const ALGORITHM = "AWS4-HMAC-SHA256";
const SERVICE = "s3";
const TRAILING_SLASH = /\/$/;
const DATE_PUNCTUATION = /[-:]/g;

export interface OffsiteTarget {
  endpoint: string;
  bucket: string;
  region: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function readOffsiteTarget(): OffsiteTarget {
  return {
    endpoint: requireEnv("BACKUP_S3_ENDPOINT"),
    bucket: requireEnv("BACKUP_S3_BUCKET"),
    region: requireEnv("BACKUP_S3_REGION"),
    // No fallback (BR-ENV-03): the prefix decides where dumps land in the
    // bucket, and a silent default is how objects end up scattered across two
    // layouts that nobody notices until a restore has to find them.
    prefix: requireEnv("BACKUP_S3_PREFIX"),
    accessKeyId: requireEnv("BACKUP_S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("BACKUP_S3_SECRET_ACCESS_KEY"),
  };
}

/** `<prefix>/YYYY/MM/DD/<filename>` — the layout §4 step 2 names. */
export function objectKey(prefix: string, at: Date, filename: string): string {
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const day = String(at.getUTCDate()).padStart(2, "0");
  return `${prefix}/${year}/${month}/${day}/${filename}`;
}

function hmac(key: crypto.BinaryLike, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/** Every path segment is escaped, but the separators stay separators. */
function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export interface SignedRequest {
  url: string;
  headers: Record<string, string>;
}

/**
 * Exported so the signing can be tested against known inputs without a network.
 * `payloadSha256` is the hash of the file as it sits on disk, which is also
 * what goes into backup_log (BR-BAK-03): one number, verifiable from either end.
 */
export function signPutRequest(options: {
  target: OffsiteTarget;
  key: string;
  payloadSha256: string;
  contentLength: number;
  now: Date;
}): SignedRequest {
  const { target, key, payloadSha256, contentLength, now } = options;

  const url = new URL(
    `${target.endpoint.replace(TRAILING_SLASH, "")}/${target.bucket}/${encodeKey(key)}`
  );
  const amzDate = `${now.toISOString().replace(DATE_PUNCTUATION, "").slice(0, 15)}Z`;
  const dateStamp = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    host: url.host,
    "content-length": String(contentLength),
    "content-type": "application/octet-stream",
    "x-amz-content-sha256": payloadSha256,
    "x-amz-date": amzDate,
    // The object is a full database dump; server-side encryption is a second
    // lock on top of the AES-GCM the file already carries, not a replacement.
    "x-amz-server-side-encryption": "AES256",
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");

  const canonicalRequest = [
    "PUT",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadSha256,
  ].join("\n");

  const scope = `${dateStamp}/${target.region}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${target.secretAccessKey}`, dateStamp), target.region),
      SERVICE
    ),
    "aws4_request"
  );
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  headers.authorization = `${ALGORITHM} Credential=${target.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { url: url.toString(), headers };
}

export interface UploadResult {
  key: string;
  bytes: number;
}

/**
 * Streams the file at `filePath` to the bucket. Throws on any non-2xx answer:
 * a dump that did not leave the machine is not a backup, and BR-BAK-04 forbids
 * recording that outcome as anything but a failure.
 */
export async function uploadBackup(options: {
  filePath: string;
  filename: string;
  payloadSha256: string;
  target?: OffsiteTarget;
  now?: Date;
}): Promise<UploadResult> {
  const target = options.target ?? readOffsiteTarget();
  const now = options.now ?? new Date();
  const key = objectKey(target.prefix, now, options.filename);
  const { size } = fs.statSync(options.filePath);

  const signed = signPutRequest({
    target,
    key,
    payloadSha256: options.payloadSha256,
    contentLength: size,
    now,
  });

  await new Promise<void>((resolve, reject) => {
    const request = https.request(
      signed.url,
      { method: "PUT", headers: signed.headers },
      (response) => {
        const status = response.statusCode ?? 0;
        let body = "";
        response.on("data", (chunk) => {
          // Bounded: an S3 error document is small, and this is the only place
          // the reason for a refused upload is available.
          if (body.length < 2048) {
            body += chunk.toString();
          }
        });
        response.on("end", () => {
          if (status >= 200 && status < 300) {
            resolve();
            return;
          }
          reject(
            new Error(
              `Backup upload to ${target.bucket}/${key} was refused with HTTP ${status}: ${body.trim()}`
            )
          );
        });
      }
    );
    request.on("error", reject);
    fs.createReadStream(options.filePath).pipe(request);
  });

  return { key, bytes: size };
}
