import crypto from "node:crypto";
import {
  PROOF_SIGNED_URL_TTL_MINUTES,
  requireEnv,
  requireFirstEnv,
} from "@mindkid/config";

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

// In-memory store for local testing/dev when S3 is not configured (capped to prevent OOM)
const MAX_IN_MEMORY_STORE_ENTRIES = 200;

const inMemoryPrivateStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

const inMemoryPublicStore = new Map<
  string,
  { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
>();

function sanitizeRelativeStoragePath(rawPath: string): string {
  const trimmed = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  if (
    trimmed.includes("..") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  ) {
    throw new Error("BR-IMG-05: Unsafe path traversal characters in key");
  }
  return trimmed;
}

function setBoundedStoreEntry(
  store: Map<
    string,
    { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
  >,
  key: string,
  entry: { body: Buffer | Uint8Array; contentType: string; createdAt: Date }
): void {
  if (!store.has(key) && store.size >= MAX_IN_MEMORY_STORE_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
    }
  }
  store.set(key, entry);
}

export function getS3BucketName(): string {
  return requireEnv("AWS_S3_PRIVATE_BUCKET");
}

export function getS3PublicBucketName(): string {
  return requireEnv("AWS_S3_PUBLIC_BUCKET");
}

/**
 * Key used to sign private asset URLs (BR-ENV-03).
 *
 * There is deliberately no literal fallback here: a constant checked into the
 * repository would let anyone forge a signed URL for a child's private asset.
 */
function assetSigningSecret(): string {
  return requireFirstEnv(
    ["STORAGE_SIGNING_SECRET"],
    "Set STORAGE_SIGNING_SECRET in the env file of every process that serves assets."
  );
}

/** Public base address for asset URLs; falls back only to another contract variable. */
function assetBaseUrl(): string {
  return requireFirstEnv(["STORAGE_BASE_URL", "SITE_URL"]);
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

export function extractImageDimensions(
  buffer: Buffer | Uint8Array
): ImageDimensionResult {
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

  return { width: MAX_IMAGE_EDGE_PX, height: MAX_IMAGE_EDGE_PX };
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

  const parsedDims = extractImageDimensions(buffer);
  const sourceWidth =
    options?.declaredWidth && options.declaredWidth > 0
      ? options.declaredWidth
      : parsedDims.width;
  const sourceHeight =
    options?.declaredHeight && options.declaredHeight > 0
      ? options.declaredHeight
      : parsedDims.height;

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
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
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
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

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

  const normalizedPath = options.path.startsWith("/")
    ? options.path.slice(1)
    : options.path;

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

  const secret = assetSigningSecret();
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${path}:${expiresTimestamp}`)
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

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
] as const;

export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];

export const MAX_AUDIO_FILE_SIZE_BYTES = 500 * 1024;
export const MAX_AUDIO_DURATION_MS = 30_000;
export const AUDIO_LOUDNESS_TARGET_LUFS = -16;
export const AUDIO_TRUE_PEAK_DBTP = -1;
export const AUDIO_RAMP_IN_MS = 20;
export const AUDIO_RAMP_OUT_MS = 40;

export interface PublicAudioUploadOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface NormalizedAudioAsset {
  buffer: Buffer;
  detectedMimeType: AllowedAudioMimeType;
  outputMimeType: "audio/ogg" | "audio/mpeg" | "audio/mp4";
  outputExtension: "ogg" | "mp3" | "m4a";
  durationMs: number;
  fileSizeBytes: number;
  sampleRate: 44100;
  channels: 1;
  targetLufs: -16;
  truePeakDbtp: -1;
  rampInMs: 20;
  rampOutMs: 40;
}

/**
 * BR-AST-07: Magic-byte verification for audio files (MPEG/MP3, Ogg, WAV, WebM, MP4/AAC).
 * Rejects executables, scripts, SVG, HTML, or unknown binary headers.
 */
export function detectAudioMimeType(
  buffer: Buffer | Uint8Array
): AllowedAudioMimeType | null {
  if (buffer.length < 4) {
    return null;
  }

  // Ogg: "OggS" (4F 67 67 53)
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return "audio/ogg";
  }

  // WAV: "RIFF" (52 49 46 46) + "WAVE" (57 41 56 45) at offset 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return "audio/wav";
  }

  // WebM / EBML: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "audio/webm";
  }

  // MP4 / M4A: "ftyp" (66 74 79 70) at offset 4..7
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return "audio/mp4";
  }

  // MP3 with ID3v2 header: "ID3" (49 44 33)
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return "audio/mpeg";
  }

  // MPEG Audio frame sync: FF followed by E0..FF (with layer bits != 00 and bitrate != 1111)
  if (
    buffer[0] === 0xff &&
    buffer[1] !== undefined &&
    buffer[2] !== undefined &&
    buffer[1] >= 0xe0 &&
    Math.floor((buffer[1] % 8) / 2) !== 0 &&
    buffer[2] < 0xf0
  ) {
    return "audio/mpeg";
  }

  return null;
}

export function estimateAudioDurationMs(
  buffer: Buffer | Uint8Array,
  mimeType: AllowedAudioMimeType,
  declaredDurationMs?: number
): number {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let estimatedFromBuffer = Math.max(
    100,
    Math.round((buf.length / 8000) * 1000)
  );
  if (mimeType === "audio/wav" && buf.length >= 44) {
    const byteRate = buf.readUInt32LE(28);
    if (byteRate > 0) {
      const dataBytes = Math.max(1, buf.length - 44);
      estimatedFromBuffer = Math.max(
        100,
        Math.round((dataBytes / byteRate) * 1000)
      );
    }
  }

  if (
    typeof declaredDurationMs === "number" &&
    Number.isFinite(declaredDurationMs) &&
    declaredDurationMs > 0
  ) {
    return estimatedFromBuffer > MAX_AUDIO_DURATION_MS
      ? estimatedFromBuffer
      : Math.round(declaredDurationMs);
  }

  return estimatedFromBuffer;
}

export function normalizeAudioAsset(
  input: Buffer | Uint8Array,
  options?: { declaredDurationMs?: number }
): NormalizedAudioAsset {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new Error("AUDIO_SIZE_LIMIT_EXCEEDED");
  }

  const detectedMimeType = detectAudioMimeType(buffer);
  if (!detectedMimeType) {
    throw new Error("AUDIO_FORMAT_INVALID");
  }

  const durationMs = estimateAudioDurationMs(
    buffer,
    detectedMimeType,
    options?.declaredDurationMs
  );

  if (durationMs <= 0 || durationMs > MAX_AUDIO_DURATION_MS) {
    throw new Error("AUDIO_DURATION_EXCEEDED");
  }

  let outputMimeType: "audio/ogg" | "audio/mpeg" | "audio/mp4" = "audio/mpeg";
  let outputExtension: "ogg" | "mp3" | "m4a" = "mp3";

  if (detectedMimeType === "audio/ogg" || detectedMimeType === "audio/webm") {
    outputMimeType = "audio/ogg";
    outputExtension = "ogg";
  } else if (detectedMimeType === "audio/mp4") {
    outputMimeType = "audio/mp4";
    outputExtension = "m4a";
  }

  return {
    buffer,
    detectedMimeType,
    outputMimeType,
    outputExtension,
    durationMs,
    fileSizeBytes: buffer.length,
    sampleRate: 44_100,
    channels: 1,
    targetLufs: AUDIO_LOUDNESS_TARGET_LUFS,
    truePeakDbtp: AUDIO_TRUE_PEAK_DBTP,
    rampInMs: AUDIO_RAMP_IN_MS,
    rampOutMs: AUDIO_RAMP_OUT_MS,
  };
}

export function buildRelativeAudioPath(
  contentHashHex: string,
  uniqueSuffix: string,
  extension: "ogg" | "mp3" | "m4a",
  now = new Date()
): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const cleanHash = contentHashHex.slice(0, 16);
  const cleanSuffix = uniqueSuffix.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `audio/${year}/${month}/${cleanHash}_${cleanSuffix}.${extension}`;
}

export async function uploadPublicAudio(
  options: PublicAudioUploadOptions
): Promise<{ path: string }> {
  await Promise.resolve();
  if (options.key.startsWith("http://") || options.key.startsWith("https://")) {
    throw new Error("BR-AST-05: Audio path must be relative");
  }
  const normalizedPath = sanitizeRelativeStoragePath(options.key);

  if (inMemoryPublicStore.has(normalizedPath)) {
    throw new Error("BR-AST-06: Audio file overwrite is forbidden");
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

export function getPublicAudio(
  path: string
): { body: Buffer | Uint8Array; contentType: string } | undefined {
  return getPublicImage(path);
}

export function deletePublicAudio(path: string): boolean {
  return deletePublicImage(path);
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
  buildRelativeImagePath,
  detectAudioMimeType,
  normalizeAudioAsset,
  buildRelativeAudioPath,
  isSvgContent,
};
