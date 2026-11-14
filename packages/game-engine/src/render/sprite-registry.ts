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
  source: CanvasImageSource
): void {
  const key = path.trim();
  if (!key) {
    return;
  }
  if (imagePathSprites.has(key)) {
    imagePathSprites.delete(key);
  } else if (imagePathSprites.size >= MAX_IMAGE_SPRITES) {
    const oldestKey = imagePathSprites.keys().next().value;
    if (oldestKey !== undefined) {
      imagePathSprites.delete(oldestKey);
    }
  }
  imagePathSprites.set(key, source);
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
