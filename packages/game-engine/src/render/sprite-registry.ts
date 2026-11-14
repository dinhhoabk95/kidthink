const VARIATION_SELECTOR_16 = "\uFE0F";
export const MAX_IMAGE_SPRITES = 128;

const emojiSprites = new Map<string, CanvasImageSource>();
const heroEmojiSprites = new Map<string, CanvasImageSource>();
const imagePathSprites = new Map<string, CanvasImageSource>();

function registerNormalizedEmoji(
  map: Map<string, CanvasImageSource>,
  emoji: string,
  source: CanvasImageSource
): void {
  const nfc = emoji.trim().normalize("NFC");
  if (!nfc) {
    return;
  }
  map.set(nfc, source);
  const stripped = nfc.replaceAll(VARIATION_SELECTOR_16, "");
  if (stripped && stripped !== nfc) {
    map.set(stripped, source);
  }
}

function lookupNormalizedEmoji(
  map: ReadonlyMap<string, CanvasImageSource>,
  emoji: string
): CanvasImageSource | null {
  const nfc = emoji.trim().normalize("NFC");
  if (!nfc) {
    return null;
  }
  const direct = map.get(nfc);
  if (direct) {
    return direct;
  }
  const stripped = nfc.replaceAll(VARIATION_SELECTOR_16, "");
  if (stripped && stripped !== nfc) {
    return map.get(stripped) ?? null;
  }
  return null;
}

export interface RegisterImageSpriteOptions {
  readonly closeOnEvict?: boolean;
}

interface ClosableBitmap {
  close(): void;
}

function isClosableBitmap(
  source: CanvasImageSource
): source is CanvasImageSource & ClosableBitmap {
  return (
    typeof source === "object" &&
    source !== null &&
    "close" in source &&
    typeof source.close === "function"
  );
}

function mapContainsSource(
  map: ReadonlyMap<string, CanvasImageSource>,
  target: CanvasImageSource
): boolean {
  for (const current of map.values()) {
    if (current === target) {
      return true;
    }
  }
  return false;
}

function isSourceReferencedInRegistry(source: CanvasImageSource): boolean {
  return (
    mapContainsSource(imagePathSprites, source) ||
    mapContainsSource(emojiSprites, source) ||
    mapContainsSource(heroEmojiSprites, source)
  );
}

export function closeSpriteBitmapIfUnreferenced(
  source: CanvasImageSource
): boolean {
  if (!isClosableBitmap(source) || isSourceReferencedInRegistry(source)) {
    return false;
  }
  try {
    source.close();
    return true;
  } catch {
    return false;
  }
}

export function registerEmojiSprite(
  emoji: string,
  source: CanvasImageSource
): void {
  registerNormalizedEmoji(emojiSprites, emoji, source);
}

export function registerHeroEmojiSprite(
  emoji: string,
  source: CanvasImageSource
): void {
  registerNormalizedEmoji(heroEmojiSprites, emoji, source);
}

export function registerImageSprite(
  path: string,
  source: CanvasImageSource,
  options?: RegisterImageSpriteOptions
): void {
  const key = path.trim();
  if (!key) {
    return;
  }
  let displaced: CanvasImageSource | undefined;
  if (imagePathSprites.has(key)) {
    displaced = imagePathSprites.get(key);
    imagePathSprites.delete(key);
  } else if (imagePathSprites.size >= MAX_IMAGE_SPRITES) {
    const oldestKey = imagePathSprites.keys().next().value;
    if (oldestKey !== undefined) {
      displaced = imagePathSprites.get(oldestKey);
      imagePathSprites.delete(oldestKey);
    }
  }
  imagePathSprites.set(key, source);
  if (options?.closeOnEvict && displaced && displaced !== source) {
    closeSpriteBitmapIfUnreferenced(displaced);
  }
}

export function unregisterImageSprite(
  path: string,
  expectedSource?: CanvasImageSource
): void {
  const key = path.trim();
  if (!key) {
    return;
  }
  if (expectedSource !== undefined) {
    const current = imagePathSprites.get(key);
    if (current !== expectedSource) {
      return;
    }
  }
  imagePathSprites.delete(key);
}

export function getEmojiSprite(emoji: string): CanvasImageSource | null {
  return lookupNormalizedEmoji(emojiSprites, emoji);
}

export function getHeroEmojiSprite(emoji: string): CanvasImageSource | null {
  return lookupNormalizedEmoji(heroEmojiSprites, emoji);
}

export function getImageSprite(path: string): CanvasImageSource | null {
  const key = path.trim();
  if (!key) {
    return null;
  }
  const hit = imagePathSprites.get(key);
  if (!hit) {
    return null;
  }
  imagePathSprites.delete(key);
  imagePathSprites.set(key, hit);
  return hit;
}

export function clearAllSprites(): void {
  emojiSprites.clear();
  heroEmojiSprites.clear();
  imagePathSprites.clear();
}
