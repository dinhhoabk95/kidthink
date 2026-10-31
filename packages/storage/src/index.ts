import crypto from "node:crypto";
import { PROOF_SIGNED_URL_TTL_MINUTES, requireEnv } from "@mindkid/config";
import sharp from "sharp";
import {
  buildRelativeAudioPath,
  deletePublicAudio,
  detectAudioMimeType,
  getPublicAudio,
  normalizeAudioAsset,
  uploadPublicAudio,
} from "#src/audio-storage";
import {
  assetBaseUrl,
  assetSigningSecret,
  EXTENSION_REGEX,
  inMemoryPrivateStore,
  inMemoryPublicStore,
  sanitizeRelativeStoragePath,
  setBoundedStoreEntry,
  TRAILING_SLASHES_REGEX,
} from "#src/storage-common";

export * from "#src/audio-storage";
export { sanitizeRelativeStoragePath } from "#src/storage-common";

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

export const MAX_IMAGE_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_EDGE_PX = 960;
export const IMAGE_THUMB_SIZE_PX = 160;
export const IMAGE_WEBP_QUALITY = 82;

export interface NormalizedImageAsset {
  buffer: Buffer;
  detectedMimeType: "image/jpeg" | "image/png" | "image/webp";
  outputMimeType: "image/webp";
  outputExtension: "webp";
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  quality: 82;
  fileSizeBytes: number;
}

export function getS3BucketName(): string {
  return requireEnv("AWS_S3_PRIVATE_BUCKET");
}

export function getS3PublicBucketName(): string {
  return requireEnv("AWS_S3_PUBLIC_BUCKET");
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

function extractJpegDimensions(buf: Buffer): ImageDimensionResult | null {
  let offset = 2;
  while (offset + 8 < buf.length) {
    if (buf[offset] !== 0xff) {
      break;
    }
    const marker = buf[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) {
        return { width, height };
      }
      break;
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      break;
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function parseBinaryImageDimensions(
  buffer: Buffer | Uint8Array
): ImageDimensionResult | null {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const mime = detectImageMimeType(buf);

  if (
    mime === "image/png" &&
    buf.length >= 24 &&
    buf[12] === 0x49 &&
    buf[13] === 0x48 &&
    buf[14] === 0x44 &&
    buf[15] === 0x52
  ) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  if (mime === "image/jpeg") {
    const jpegDims = extractJpegDimensions(buf);
    if (jpegDims) {
      return jpegDims;
    }
  }

  if (
    mime === "image/webp" &&
    buf.length >= 30 &&
    buf[12] === 0x56 &&
    buf[13] === 0x50 &&
    buf[14] === 0x38 &&
    buf[15] === 0x58
  ) {
    const width = buf.readUIntLE(24, 3) + 1;
    const height = buf.readUIntLE(27, 3) + 1;
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  return null;
}

export function extractImageDimensions(
  buffer: Buffer | Uint8Array
): ImageDimensionResult {
  return (
    parseBinaryImageDimensions(buffer) ?? {
      width: MAX_IMAGE_EDGE_PX,
      height: MAX_IMAGE_EDGE_PX,
    }
  );
}

export function normalizeImageAsset(
  input: Buffer | Uint8Array,
  options?: { declaredWidth?: number; declaredHeight?: number }
): NormalizedImageAsset {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new Error("IMAGE_SIZE_LIMIT_EXCEEDED");
  }
  if (isSvgContent(buffer)) {
    throw new Error("IMAGE_SVG_FORBIDDEN");
  }
  const detectedMimeType = detectImageMimeType(buffer);
  if (!detectedMimeType) {
    throw new Error("IMAGE_FORMAT_INVALID");
  }

  const parsedDims = parseBinaryImageDimensions(buffer);
  const sourceWidth =
    parsedDims?.width ??
    (options?.declaredWidth && options.declaredWidth > 0
      ? options.declaredWidth
      : MAX_IMAGE_EDGE_PX);
  const sourceHeight =
    parsedDims?.height ??
    (options?.declaredHeight && options.declaredHeight > 0
      ? options.declaredHeight
      : MAX_IMAGE_EDGE_PX);

  const maxSourceEdge = Math.max(sourceWidth, sourceHeight);
  let width = sourceWidth;
  let height = sourceHeight;

  // §7.2 & §5: Clamp max edge to 960px, never upscale images smaller than 960px (or < 160x160)
  if (maxSourceEdge > MAX_IMAGE_EDGE_PX) {
    const scale = MAX_IMAGE_EDGE_PX / maxSourceEdge;
    width = Math.max(1, Math.round(sourceWidth * scale));
    height = Math.max(1, Math.round(sourceHeight * scale));
  }

  // §7.2 & §5: Thumbnail 160x160 center-crop, never upscale images smaller than 160x160
  const thumbWidth = Math.min(width, IMAGE_THUMB_SIZE_PX);
  const thumbHeight = Math.min(height, IMAGE_THUMB_SIZE_PX);

  return {
    buffer,
    detectedMimeType,
    outputMimeType: "image/webp",
    outputExtension: "webp",
    width,
    height,
    thumbWidth,
    thumbHeight,
    quality: IMAGE_WEBP_QUALITY,
    fileSizeBytes: buffer.length,
  };
}

export async function reencodeImageAssetWebp(
  input: Buffer | Uint8Array
): Promise<NormalizedImageAsset & { thumbBuffer: Buffer }> {
  const normalized = normalizeImageAsset(input);
  try {
    const fullResult = await sharp(normalized.buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE_PX,
        height: MAX_IMAGE_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    const outWidth = fullResult.info.width || normalized.width;
    const outHeight = fullResult.info.height || normalized.height;
    const thumbWidth = Math.min(outWidth, IMAGE_THUMB_SIZE_PX);
    const thumbHeight = Math.min(outHeight, IMAGE_THUMB_SIZE_PX);

    const thumbBuffer = await sharp(normalized.buffer)
      .rotate()
      .resize({
        width: thumbWidth,
        height: thumbHeight,
        fit: "cover",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_WEBP_QUALITY })
      .toBuffer();

    return {
      ...normalized,
      buffer: fullResult.data,
      width: outWidth,
      height: outHeight,
      thumbWidth,
      thumbHeight,
      fileSizeBytes: fullResult.data.length,
      thumbBuffer,
    };
  } catch {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      return {
        ...normalized,
        thumbBuffer: normalized.buffer,
      };
    }
    throw new Error("IMAGE_FORMAT_INVALID");
  }
}

export function buildRelativeImagePath(
  fileHashHex: string,
  now = new Date()
): { path: string; thumbPath: string } {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const cleanHash = fileHashHex.replace(/[^a-fA-F0-9]/g, "").slice(0, 16);
  return {
    path: `content/${year}/${month}/${cleanHash}.webp`,
    thumbPath: `content/${year}/${month}/${cleanHash}_thumb.webp`,
  };
}

export async function uploadPublicImage(
  options: PublicImageUploadOptions
): Promise<{ path: string }> {
  await Promise.resolve();
  if (options.key.startsWith("http://") || options.key.startsWith("https://")) {
    throw new Error("BR-IMG-05: Image path must be relative");
  }
  const normalizedPath = sanitizeRelativeStoragePath(options.key);

  if (inMemoryPublicStore.has(normalizedPath)) {
    throw new Error("BR-IMG-06: Image file overwrite is forbidden");
  }

  setBoundedStoreEntry(inMemoryPublicStore, normalizedPath, {
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
  const normalizedPath = sanitizeRelativeStoragePath(path);
  return inMemoryPublicStore.get(normalizedPath);
}

export function deletePublicImage(path: string): boolean {
  const normalizedPath = sanitizeRelativeStoragePath(path);
  return inMemoryPublicStore.delete(normalizedPath);
}

export async function uploadPrivateAsset(
  options: UploadPrivateAssetOptions
): Promise<PrivateUploadResult> {
  await Promise.resolve();
  const normalizedPath = sanitizeRelativeStoragePath(options.key);

  setBoundedStoreEntry(inMemoryPrivateStore, normalizedPath, {
    body: options.body,
    contentType: options.contentType,
    createdAt: new Date(),
  });

  return {
    path: normalizedPath,
  };
}

export function deletePrivateAsset(path: string): boolean {
  const normalizedPath = sanitizeRelativeStoragePath(path);
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
  const normalizedPath = sanitizeRelativeStoragePath(path);
  let targetPath = normalizedPath;
  if (options?.variant === "thumb" && !targetPath.endsWith("_thumb.webp")) {
    targetPath = targetPath.replace(EXTENSION_REGEX, "_thumb.webp");
  }
  const baseUrl = assetBaseUrl();
  return `${baseUrl.replace(TRAILING_SLASHES_REGEX, "")}/${targetPath}`;
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
  if (!signature || typeof signature !== "string") {
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
  url,
  signedUrl,
  uploadPublicImage,
  uploadPublicAudio,
  uploadPrivateAsset,
  getPublicImage,
  getPublicAudio,
  deletePublicImage,
  deletePublicAudio,
  deletePrivateAsset,
  getPrivateSignedUrl,
  verifySignedUrlToken,
  detectImageMimeType,
  extractImageDimensions,
  normalizeImageAsset,
  reencodeImageAssetWebp,
  buildRelativeImagePath,
  detectAudioMimeType,
  normalizeAudioAsset,
  buildRelativeAudioPath,
  isSvgContent,
};
