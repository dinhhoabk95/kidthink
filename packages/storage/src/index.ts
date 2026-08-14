import crypto from "node:crypto";
import { PROOF_SIGNED_URL_TTL_MINUTES } from "@kidthink/config";

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

// In-memory store for local testing/dev when S3 is not configured
const inMemoryPrivateStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

export function getS3BucketName(): string {
  return process.env.AWS_S3_PRIVATE_BUCKET || "kidthink-private-assets";
}

export async function uploadPrivateAsset(
  options: UploadPrivateAssetOptions
): Promise<PrivateUploadResult> {
  await Promise.resolve();
  const normalizedPath = options.key.startsWith("/")
    ? options.key.slice(1)
    : options.key;

  // If AWS S3 credentials are configured, we would upload to S3 private bucket
  // Otherwise, use secure local/in-memory store for testing & dev
  inMemoryPrivateStore.set(normalizedPath, {
    body: options.body,
    contentType: options.contentType,
    createdAt: new Date(),
  });

  return {
    path: normalizedPath,
  };
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

  // Generate signed token with HMAC
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

  const url = `${baseUrl}/private/${encodeURIComponent(
    normalizedPath
  )}?expires=${expiresAt.getTime()}&signature=${signature}`;

  return {
    url,
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
