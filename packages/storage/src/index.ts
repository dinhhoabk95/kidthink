import crypto from "node:crypto";
import {
  isCloudflareRuntime,
  PROOF_SIGNED_URL_TTL_MINUTES,
} from "@mindkid/config";
import { ServiceUnavailableError } from "@mindkid/errors";
import { detectAudioMimeType, normalizeAudioAsset } from "#src/audio-storage";
import { InMemoryObjectStorageDriver } from "#src/in-memory-driver";
import {
  getActiveObjectStorageDriver,
  type ObjectStorageDriver,
} from "#src/object-storage-driver";
import {
  assetBaseUrl,
  assetSigningSecret,
  sanitizeRelativeStoragePath,
  TRAILING_SLASHES_REGEX,
} from "#src/storage-common";

export * from "#src/audio-storage";
export * from "#src/d1-blob-port";
export * from "#src/in-memory-driver";
export * from "#src/object-storage-driver";
export { sanitizeRelativeStoragePath } from "#src/storage-common";

export interface UploadPrivateAssetOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  /** Hạn lưu (BR-IMG-15); bỏ trống = không hết hạn. */
  expiresAt?: Date;
}

export interface PrivateUploadResult {
  path: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

/**
 * Detect image MIME type strictly by inspecting magic bytes (BR-IMG-03)
 */
export function detectImageMimeType(
  buffer: Buffer | Uint8Array
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length < 12) {
    return null;
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Detect if payload contains SVG markup (BR-IMG-02: strictly forbidden)
 */
export function isSvgContent(buffer: Buffer | Uint8Array): boolean {
  const str = Buffer.from(buffer.subarray(0, 4096))
    .toString("utf-8")
    .toLowerCase()
    .trim();
  return str.includes("<svg") || str.includes("<?xml");
}

let defaultStorageDriver: ObjectStorageDriver | undefined;

/** Driver đang hoạt động, hoặc driver in-memory mặc định (BR-IMG-11). */
function resolvePrivateDriver(): ObjectStorageDriver {
  const active = getActiveObjectStorageDriver();
  if (active) {
    return active;
  }
  // BR-IMG-16: trên Cloudflare không có driver thì đóng-khi-lỗi, không rơi về in-memory.
  if (isCloudflareRuntime()) {
    throw new ServiceUnavailableError(
      "Cloudflare object storage driver is not configured (BR-IMG-16)"
    );
  }
  defaultStorageDriver ??= new InMemoryObjectStorageDriver();
  return defaultStorageDriver;
}

export async function uploadPrivateAsset(
  options: UploadPrivateAssetOptions
): Promise<PrivateUploadResult> {
  const normalizedPath = sanitizeRelativeStoragePath(options.key);
  await resolvePrivateDriver().putObject({
    bucket: "private",
    key: normalizedPath,
    body:
      options.body instanceof Uint8Array
        ? options.body
        : new Uint8Array(options.body),
    contentType: options.contentType,
    expiresAt: options.expiresAt,
  });
  return { path: normalizedPath };
}

export async function readPrivateAsset(
  path: string
): Promise<{ body: Uint8Array; contentType: string } | undefined> {
  const normalizedPath = sanitizeRelativeStoragePath(path);
  const found = await resolvePrivateDriver().getObject(
    "private",
    normalizedPath
  );
  return found
    ? { body: found.body, contentType: found.contentType }
    : undefined;
}

export async function deletePrivateAsset(path: string): Promise<boolean> {
  const normalizedPath = sanitizeRelativeStoragePath(path);
  return await resolvePrivateDriver().deleteObject("private", normalizedPath);
}

/** Xoá mọi tệp private đã quá hạn lưu (BR-IMG-15); trả số tệp đã xoá. */
export async function deleteExpiredPrivateAssets(
  now: Date = new Date()
): Promise<number> {
  return await resolvePrivateDriver().deleteExpired(now);
}

/** Chỉ dùng cho test: bỏ driver in-memory mặc định đã tạo. */
export function resetDefaultObjectStorageDriver(): void {
  defaultStorageDriver = undefined;
}

/**
 * Generates a time-limited signed URL for private asset access (BR-IMG-10, BR-PQU-03, D-JK, D-KD)
 * Default TTL: 15 minutes (900 seconds)
 */
export function signedUrl(path: string, ttlSeconds = 900): string {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const normalizedPath = sanitizeRelativeStoragePath(path);

  const secret = assetSigningSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${normalizedPath}:${expiresAt.getTime()}`)
    .digest("hex");

  const baseUrl = assetBaseUrl();

  return `${baseUrl.replace(TRAILING_SLASHES_REGEX, "")}/private/${encodeURIComponent(
    normalizedPath
  )}?expires=${expiresAt.getTime()}&signature=${signature}`;
}

/**
 * Generates a time-limited signed URL for private asset access (BR-PQU-03, D-JK)
 * Default TTL: 15 minutes
 */
export async function getPrivateSignedUrl(options: {
  path: string;
  expiresInMinutes?: number;
}): Promise<SignedUrlResult> {
  await Promise.resolve();
  const ttlMinutes = options.expiresInMinutes ?? PROOF_SIGNED_URL_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const normalizedPath = sanitizeRelativeStoragePath(options.path);

  const secret = assetSigningSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${normalizedPath}:${expiresAt.getTime()}`)
    .digest("hex");

  const baseUrl = assetBaseUrl();

  const resultUrl = `${baseUrl.replace(TRAILING_SLASHES_REGEX, "")}/private/${encodeURIComponent(
    normalizedPath
  )}?expires=${expiresAt.getTime()}&signature=${signature}`;

  return {
    url: resultUrl,
    expiresAt,
  };
}

/** HMAC-SHA256 hex: đúng 64 ký tự thường — `Buffer.from(_, "hex")` nuốt đuôi rác nên phải kiểm trước. */
const SIGNATURE_HEX_REGEX = /^[0-9a-f]{64}$/;

/**
 * Verify a signed URL request token
 */
export function verifySignedUrlToken(
  path: string,
  expiresTimestamp: number,
  signature: string
): boolean {
  if (!Number.isFinite(expiresTimestamp) || Date.now() > expiresTimestamp) {
    return false; // Expired or invalid timestamp
  }
  if (typeof signature !== "string" || !SIGNATURE_HEX_REGEX.test(signature)) {
    return false;
  }

  let normalizedPath: string;
  try {
    normalizedPath = sanitizeRelativeStoragePath(path);
  } catch {
    return false;
  }

  const secret = assetSigningSecret();
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${normalizedPath}:${expiresTimestamp}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function isPrivateStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
}

export const storage = {
  signedUrl,
  uploadPrivateAsset,
  readPrivateAsset,
  deletePrivateAsset,
  deleteExpiredPrivateAssets,
  getPrivateSignedUrl,
  verifySignedUrlToken,
  detectImageMimeType,
  detectAudioMimeType,
  normalizeAudioAsset,
  isSvgContent,
};
