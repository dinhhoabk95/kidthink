export interface ResolvedEmojiAsset {
  ref: string;
  kind: "emoji";
  glyph: string;
}

export interface ResolvedImageAsset {
  ref: string;
  kind: "image";
  url?: string;
  width?: number;
  height?: number;
  error?: "not_found";
}

export interface ResolvedAudioAsset {
  ref: string;
  kind: "audio";
  url?: string;
  duration_ms?: number;
  error?: "not_found";
}

export type ResolvedAsset =
  | ResolvedEmojiAsset
  | ResolvedImageAsset
  | ResolvedAudioAsset;

export interface AssetResolverOptions {
  /** Optional storage lookup for image refs/paths -> { url, width, height } */
  imageStorageLookup?: (
    refOrPath: string
  ) => { url: string; width?: number; height?: number } | null | undefined;
  /** Optional storage lookup for audio refs/paths -> { url, duration_ms } */
  audioStorageLookup?: (
    refOrPath: string
  ) => { url: string; duration_ms?: number } | null | undefined;
}

/**
 * Task #202 (D-EE): Emoji ref is identity (`glyph = ref`).
 * No registry lookup, no not_found error.
 */
function resolveEmojiRef(ref: string): ResolvedEmojiAsset {
  return { ref, kind: "emoji", glyph: ref };
}

function resolveImageRef(
  ref: string,
  options: AssetResolverOptions
): ResolvedImageAsset {
  const imgInfo = options.imageStorageLookup?.(ref);
  if (imgInfo) {
    return {
      ref,
      kind: "image",
      url: imgInfo.url,
      width: imgInfo.width,
      height: imgInfo.height,
    };
  }
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    return { ref, kind: "image", url: ref };
  }
  return { ref, kind: "image", error: "not_found" };
}

function resolveAudioRef(
  ref: string,
  options: AssetResolverOptions
): ResolvedAudioAsset {
  const audInfo = options.audioStorageLookup?.(ref);
  if (audInfo) {
    return {
      ref,
      kind: "audio",
      url: audInfo.url,
      duration_ms: audInfo.duration_ms,
    };
  }
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    return { ref, kind: "audio", url: ref };
  }
  return { ref, kind: "audio", error: "not_found" };
}

function isImageRef(ref: string, kindHint?: string): boolean {
  return (
    kindHint === "image" ||
    ref.startsWith("IMG-") ||
    ref.includes("/") ||
    ref.endsWith(".png") ||
    ref.endsWith(".jpg") ||
    ref.endsWith(".svg")
  );
}

function isAudioRef(ref: string, kindHint?: string): boolean {
  return (
    kindHint === "audio" ||
    ref.startsWith("AUD-") ||
    ref.endsWith(".mp3") ||
    ref.endsWith(".wav") ||
    ref.endsWith(".ogg")
  );
}

/**
 * Traverses content_pack and resolves all asset references (emoji, image, audio)
 * into fully resolved objects according to BR-CFG-07.
 */
export function resolveAssets(
  contentPack: unknown,
  options: AssetResolverOptions = {}
): ResolvedAsset[] {
  const assetsMap = new Map<string, ResolvedAsset>();

  function processRef(ref: string, kindHint?: "emoji" | "image" | "audio") {
    if (!ref) {
      return;
    }
    const key = `${kindHint || "unknown"}:${ref}`;
    if (assetsMap.has(key)) {
      return;
    }

    if (kindHint === "emoji") {
      assetsMap.set(key, resolveEmojiRef(ref));
    } else if (isImageRef(ref, kindHint)) {
      assetsMap.set(key, resolveImageRef(ref, options));
    } else if (isAudioRef(ref, kindHint)) {
      assetsMap.set(key, resolveAudioRef(ref, options));
    }
  }

  function handleRecordKind(record: Record<string, unknown>) {
    if (typeof record.kind !== "string") {
      return;
    }
    const kind = record.kind as "emoji" | "image" | "audio";
    if (kind === "emoji" && typeof record.ref === "string") {
      processRef(record.ref, "emoji");
    } else if (
      (kind === "image" || kind === "audio") &&
      (typeof record.ref === "string" || typeof record.path === "string")
    ) {
      processRef((record.ref || record.path) as string, kind);
    }
  }

  function checkStringEntry(key: string, value: string) {
    if (
      key.includes("emoji") ||
      key === "icon_emoji_ref" ||
      key === "thumbnail_emoji" ||
      key === "label_emoji"
    ) {
      processRef(value, "emoji");
    } else if (key.includes("audio") || value.startsWith("AUD-")) {
      processRef(value, "audio");
    } else if (key.includes("image") || value.startsWith("IMG-")) {
      processRef(value, "image");
    }
  }

  function handleRecordEntries(record: Record<string, unknown>) {
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string") {
        checkStringEntry(key, value);
      } else {
        traverse(value);
      }
    }
  }

  function traverse(obj: unknown) {
    if (!obj || typeof obj !== "object") {
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        traverse(item);
      }
      return;
    }

    const record = obj as Record<string, unknown>;
    handleRecordKind(record);
    handleRecordEntries(record);
  }

  traverse(contentPack);
  return Array.from(assetsMap.values());
}
