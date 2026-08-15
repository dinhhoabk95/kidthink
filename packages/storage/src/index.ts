import crypto from "node:crypto";

export const PROOF_SIGNED_URL_TTL_MINUTES = 15;

const EXTENSION_REGEX = /\.[a-zA-Z0-9]+$/;
const TRAILING_SLASHES_REGEX = /\/+$/;

export interface UploadPrivateAssetOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface PrivateUploadResult {
  path: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

export interface PublicImageUploadOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface ImageDimensionResult {
  width: number;
  height: number;
}

// In-memory store for local testing/dev when S3 is not configured
const inMemoryPrivateStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

const inMemoryPublicStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

export function getS3BucketName(): string {
  return process.env.AWS_S3_PRIVATE_BUCKET || "kidthink-private-assets";
}

export function getS3PublicBucketName(): string {
  return process.env.AWS_S3_PUBLIC_BUCKET || "kidthink-public-assets";
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
  const str = Buffer.from(buffer.slice(0, 256))
    .toString("utf-8")
    .toLowerCase()
    .trim();
  return str.includes("<svg") || str.includes("<?xml");
}

export async function uploadPublicImage(
  options: PublicImageUploadOptions
): Promise<{ path: string }> {
  await Promise.resolve();
  const normalizedPath = options.key.startsWith("/")
    ? options.key.slice(1)
    : options.key;

  inMemoryPublicStore.set(normalizedPath, {
    body: options.body,
    contentType: options.contentType,
    createdAt: new Date(),
  });

  return {
    path: normalizedPath,
  };
}

export function getPublicImage(
  path: string
): { body: Buffer | Uint8Array; contentType: string } | undefined {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return inMemoryPublicStore.get(normalizedPath);
}

export function deletePublicImage(path: string): boolean {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return inMemoryPublicStore.delete(normalizedPath);
}

export async function uploadPrivateAsset(
  options: UploadPrivateAssetOptions
): Promise<PrivateUploadResult> {
  await Promise.resolve();
  const normalizedPath = options.key.startsWith("/")
    ? options.key.slice(1)
    : options.key;

  inMemoryPrivateStore.set(normalizedPath, {
    body: options.body,
    contentType: options.contentType,
    createdAt: new Date(),
  });

  return {
    path: normalizedPath,
  };
}

export function deletePrivateAsset(path: string): boolean {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return inMemoryPrivateStore.delete(normalizedPath);
}

/**
 * Construct public asset URL dynamically from relative path (BR-IMG-05, D-KD)
 */
export function url(
  path: string,
  options?: { variant?: "full" | "thumb" }
): string {
  if (!path) {
    return "";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  let targetPath = normalizedPath;
  if (options?.variant === "thumb" && !targetPath.endsWith("_thumb.webp")) {
    targetPath = targetPath.replace(EXTENSION_REGEX, "_thumb.webp");
  }
  const baseUrl =
    process.env.STORAGE_BASE_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "https://assets.kidthink.edu.vn";
  return `${baseUrl.replace(TRAILING_SLASHES_REGEX, "")}/${targetPath}`;
}

/**
 * Generates a time-limited signed URL for private asset access (BR-IMG-10, BR-PQU-03, D-JK, D-KD)
 * Default TTL: 15 minutes (900 seconds)
 */
export function signedUrl(path: string, ttlSeconds = 900): string {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  const secret =
    process.env.STORAGE_SIGNING_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    "storage-private-secret-key-signed-proof-token-123456";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${normalizedPath}:${expiresAt.getTime()}`)
    .digest("hex");

  const baseUrl =
    process.env.STORAGE_BASE_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "https://storage.kidthink.test";

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

  const normalizedPath = options.path.startsWith("/")
    ? options.path.slice(1)
    : options.path;

  const secret =
    process.env.STORAGE_SIGNING_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    "storage-private-secret-key-signed-proof-token-123456";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${normalizedPath}:${expiresAt.getTime()}`)
    .digest("hex");

  const baseUrl =
    process.env.STORAGE_BASE_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "https://storage.kidthink.test";

  const resultUrl = `${baseUrl.replace(TRAILING_SLASHES_REGEX, "")}/private/${encodeURIComponent(
    normalizedPath
  )}?expires=${expiresAt.getTime()}&signature=${signature}`;

  return {
    url: resultUrl,
    expiresAt,
  };
}

/**
 * Verify a signed URL request token
 */
export function verifySignedUrlToken(
  path: string,
  expiresTimestamp: number,
  signature: string
): boolean {
  if (Date.now() > expiresTimestamp) {
    return false; // Expired
  }

  const secret =
    process.env.STORAGE_SIGNING_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    "storage-private-secret-key-signed-proof-token-123456";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${path}:${expiresTimestamp}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSig, "hex")
  );
}

export function isPrivateStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
}

export const storage = {
  url,
  signedUrl,
  uploadPublicImage,
  uploadPrivateAsset,
  getPublicImage,
  deletePublicImage,
  deletePrivateAsset,
  getPrivateSignedUrl,
  verifySignedUrlToken,
  detectImageMimeType,
  isSvgContent,
};
