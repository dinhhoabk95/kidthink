import {
  inMemoryPublicStore,
  sanitizeRelativeStoragePath,
  setBoundedStoreEntry,
} from "#src/storage-common";

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
  const cleanHash = contentHashHex.replace(/[^a-f0-9]/gi, "").slice(0, 16);
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
  const normalizedPath = sanitizeRelativeStoragePath(path);
  return inMemoryPublicStore.get(normalizedPath);
}

export function deletePublicAudio(path: string): boolean {
  const normalizedPath = sanitizeRelativeStoragePath(path);
  return inMemoryPublicStore.delete(normalizedPath);
}
