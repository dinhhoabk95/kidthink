import { resolveCustomEmojiSprite } from "@mindkid/emoji";
import {
  closeSpriteBitmapIfUnreferenced,
  FLASHCARD_COUNTER_EMOJI_POOL,
  registerEmojiSprite,
  registerHeroEmojiSprite,
  registerImageSprite,
  unregisterImageSprite,
} from "@mindkid/game-engine";

export type SpriteScanValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | readonly SpriteScanValue[]
  | { readonly [key: string]: SpriteScanValue };

export interface PreloadItemSpritesOptions {
  readonly includeFlashcardCounters?: boolean;
  readonly dpr?: number;
  readonly highRes?: boolean;
}

export type PreloadSpritesOptions = PreloadItemSpritesOptions;

const LOAD_TIMEOUT_MS = 2500;
const MAX_HERO_CACHE_ENTRIES = 64;
export const MAX_DECODED_BITMAP_CACHE_ENTRIES = 256;
export const MIN_RASTER_PX = 120;
export const STANDARD_RASTER_BASE_PX = 128;
export const MAX_STANDARD_RASTER_PX = 256;
export const HIGH_RES_RASTER_BASE_PX = 192;
export const MAX_HIGH_RES_RASTER_PX = 384;

const PICTOGRAPHIC_REGEX = /\p{Extended_Pictographic}/u;
const GRAPHEME_SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("vi", { granularity: "grapheme" })
    : null;

interface DecodedBitmapEntry {
  readonly src: string;
  readonly promise: Promise<CanvasImageSource>;
  resolved: CanvasImageSource | null;
  readonly registeredPaths: Set<string>;
  evicted: boolean;
  closed: boolean;
}

const loadedImageCache = new Map<string, Promise<HTMLImageElement | null>>();
const rasterizedSvgCache = new Map<string, CanvasImageSource>();
const heroBitmapCache = new Map<string, Promise<CanvasImageSource>>();
const decodedBitmapCache = new Map<string, DecodedBitmapEntry>();

function collectEmojisFromString(text: string, out: Set<string>): void {
  if (!PICTOGRAPHIC_REGEX.test(text)) {
    return;
  }
  const parts = GRAPHEME_SEGMENTER
    ? Array.from(GRAPHEME_SEGMENTER.segment(text), (part) => part.segment)
    : Array.from(text);
  for (const part of parts) {
    if (PICTOGRAPHIC_REGEX.test(part)) {
      out.add(part.normalize("NFC"));
    }
  }
}

interface ImageTarget {
  readonly fetchUrl: string;
  readonly registerKeys: readonly string[];
}

function setBoundedCache<V>(
  cache: Map<string, V>,
  key: string,
  value: V,
  maxEntries = MAX_DECODED_BITMAP_CACHE_ENTRIES
): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= maxEntries) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, value);
}

export function resolveSvgRasterSize(dpr: number, highRes = false): number {
  const clampedDpr = Number.isFinite(dpr) && dpr > 0 ? Math.min(3, dpr) : 1;
  if (highRes) {
    return Math.min(
      MAX_HIGH_RES_RASTER_PX,
      Math.max(MIN_RASTER_PX, Math.ceil(HIGH_RES_RASTER_BASE_PX * clampedDpr))
    );
  }
  return Math.min(
    MAX_STANDARD_RASTER_PX,
    Math.max(MIN_RASTER_PX, Math.ceil(STANDARD_RASTER_BASE_PX * clampedDpr))
  );
}

function collectImageTarget(
  record: { readonly [key: string]: SpriteScanValue },
  images: Map<string, Set<string>>
): void {
  if (record.kind !== "image") {
    return;
  }
  const pathKey = typeof record.path === "string" ? record.path.trim() : "";
  const urlKey = typeof record.url === "string" ? record.url.trim() : "";
  const refKey = typeof record.ref === "string" ? record.ref.trim() : "";
  const fetchUrl = urlKey || pathKey || refKey;
  if (!fetchUrl) {
    return;
  }
  let keys = images.get(fetchUrl);
  if (!keys) {
    keys = new Set<string>();
    images.set(fetchUrl, keys);
  }
  if (pathKey) {
    keys.add(pathKey);
  }
  if (urlKey) {
    keys.add(urlKey);
  }
  if (refKey) {
    keys.add(refKey);
  }
}

function scanValue(
  value: SpriteScanValue,
  visited: Set<object>,
  emojis: Set<string>,
  images: Map<string, Set<string>>
): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string") {
    collectEmojisFromString(value, emojis);
    return;
  }
  if (typeof value !== "object" || visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value as readonly SpriteScanValue[]) {
      scanValue(item, visited, emojis, images);
    }
    return;
  }

  const record = value as { readonly [key: string]: SpriteScanValue };
  collectImageTarget(record, images);
  for (const val of Object.values(record)) {
    scanValue(val, visited, emojis, images);
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement | null> {
  const existing = loadedImageCache.get(src);
  if (existing) {
    loadedImageCache.delete(src);
    loadedImageCache.set(src, existing);
    return existing;
  }
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (result: HTMLImageElement | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (result === null) {
        loadedImageCache.delete(src);
      }
      resolve(result);
    };
    const timer = setTimeout(() => {
      console.warn(`[sprites] Hết hạn chờ tải sprite: ${src}`);
      finish(null);
    }, LOAD_TIMEOUT_MS);
    img.onload = () => {
      finish(img.naturalWidth > 0 ? img : null);
    };
    img.onerror = () => {
      console.warn(`[sprites] Không tải được sprite: ${src}`);
      finish(null);
    };
    img.src = src;
  });
  setBoundedCache(loadedImageCache, src, promise);
  return promise;
}

function rasterizeSvgToCanvas(
  img: HTMLImageElement,
  svgPath: string,
  dpr: number,
  highRes: boolean
): CanvasImageSource {
  const targetPx = resolveSvgRasterSize(dpr, highRes);
  const cacheKey = `${svgPath}@${targetPx}`;
  const cached = rasterizedSvgCache.get(cacheKey);
  if (cached) {
    rasterizedSvgCache.delete(cacheKey);
    rasterizedSvgCache.set(cacheKey, cached);
    return cached;
  }
  if (typeof document === "undefined") {
    return img;
  }
  const canvas = document.createElement("canvas");
  canvas.width = targetPx;
  canvas.height = targetPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return img;
  }
  ctx.drawImage(img, 0, 0, targetPx, targetPx);
  setBoundedCache(rasterizedSvgCache, cacheKey, canvas);
  return canvas;
}

function decodeHeroBitmapOrImage(
  img: HTMLImageElement,
  src: string
): Promise<CanvasImageSource> {
  if (typeof createImageBitmap !== "function") {
    return Promise.resolve(img);
  }
  const existing = heroBitmapCache.get(src);
  if (existing) {
    heroBitmapCache.delete(src);
    heroBitmapCache.set(src, existing);
    return existing;
  }
  const promise = createImageBitmap(img).catch(() => img);
  setBoundedCache(heroBitmapCache, src, promise, MAX_HERO_CACHE_ENTRIES);
  return promise;
}

function disposeDecodedBitmapEntry(entry: DecodedBitmapEntry): void {
  if (entry.closed || entry.resolved === null) {
    return;
  }
  entry.closed = true;
  for (const pathKey of entry.registeredPaths) {
    unregisterImageSprite(pathKey, entry.resolved);
  }
  entry.registeredPaths.clear();
  closeSpriteBitmapIfUnreferenced(entry.resolved);
}

function evictDecodedBitmapEntry(entry: DecodedBitmapEntry): void {
  entry.evicted = true;
  disposeDecodedBitmapEntry(entry);
}

function acquireDecodedImageEntry(
  img: HTMLImageElement,
  src: string
): DecodedBitmapEntry {
  const existing = decodedBitmapCache.get(src);
  if (existing && !existing.evicted) {
    decodedBitmapCache.delete(src);
    decodedBitmapCache.set(src, existing);
    return existing;
  }
  if (decodedBitmapCache.size >= MAX_DECODED_BITMAP_CACHE_ENTRIES) {
    const oldestKey = decodedBitmapCache.keys().next().value;
    if (oldestKey !== undefined) {
      const oldestEntry = decodedBitmapCache.get(oldestKey);
      decodedBitmapCache.delete(oldestKey);
      if (oldestEntry) {
        evictDecodedBitmapEntry(oldestEntry);
      }
    }
  }
  const rawPromise: Promise<CanvasImageSource> =
    typeof createImageBitmap === "function"
      ? createImageBitmap(img).then(
          (bmp) => bmp,
          () => img
        )
      : Promise.resolve(img);

  const entry: DecodedBitmapEntry = {
    src,
    promise: rawPromise.then((resolved) => {
      entry.resolved = resolved;
      if (entry.evicted) {
        disposeDecodedBitmapEntry(entry);
      }
      return resolved;
    }),
    resolved: null,
    registeredPaths: new Set<string>(),
    evicted: false,
    closed: false,
  };
  decodedBitmapCache.set(src, entry);
  return entry;
}

async function preloadEmojiMeta(
  emoji: string,
  dpr: number,
  highRes: boolean
): Promise<void> {
  const meta = resolveCustomEmojiSprite(emoji);
  if (!meta) {
    return;
  }
  const tasks: Promise<void>[] = [
    loadHtmlImage(meta.svgPath).then((img) => {
      if (!img) {
        return;
      }
      const source = rasterizeSvgToCanvas(img, meta.svgPath, dpr, highRes);
      registerEmojiSprite(emoji, source);
      registerEmojiSprite(meta.emoji, source);
    }),
  ];

  if (meta.heroWebpPath) {
    const heroPath = meta.heroWebpPath;
    tasks.push(
      loadHtmlImage(heroPath).then(async (img) => {
        if (!img) {
          return;
        }
        const source = await decodeHeroBitmapOrImage(img, heroPath);
        registerHeroEmojiSprite(emoji, source);
        registerHeroEmojiSprite(meta.emoji, source);
      })
    );
  }

  await Promise.all(tasks);
}

async function preloadImageTarget(target: ImageTarget): Promise<void> {
  const img = await loadHtmlImage(target.fetchUrl);
  if (!img) {
    return;
  }
  const entry = acquireDecodedImageEntry(img, target.fetchUrl);
  const decoded = await entry.promise;
  // Nếu entry đã bị đẩy ra khỏi LRU trong lúc chờ decode, bitmap đã được đóng —
  // fallback về HTMLImageElement để ctx.drawImage không bao giờ chạm bitmap đã close().
  const activeSource: CanvasImageSource = entry.evicted ? img : decoded;
  for (const rawKey of target.registerKeys) {
    const key = rawKey.trim();
    if (!key) {
      continue;
    }
    if (!entry.evicted) {
      entry.registeredPaths.add(key);
    }
    registerImageSprite(key, activeSource);
  }
}

export function resetItemSpriteCachesForTests(): void {
  loadedImageCache.clear();
  rasterizedSvgCache.clear();
  heroBitmapCache.clear();
  for (const entry of decodedBitmapCache.values()) {
    evictDecodedBitmapEntry(entry);
  }
  decodedBitmapCache.clear();
}

export async function preloadSpritesForSession(
  source: SpriteScanValue,
  options?: PreloadItemSpritesOptions
): Promise<void> {
  if (typeof window === "undefined" || typeof Image === "undefined") {
    return;
  }

  const emojis = new Set<string>();
  const images = new Map<string, Set<string>>();
  scanValue(source, new Set<object>(), emojis, images);

  if (options?.includeFlashcardCounters) {
    for (const counterEmoji of FLASHCARD_COUNTER_EMOJI_POOL) {
      emojis.add(counterEmoji.normalize("NFC"));
    }
  }

  const dpr = options?.dpr ?? (window.devicePixelRatio || 1);
  const highRes = options?.highRes === true;
  const tasks: Promise<void>[] = [];

  for (const emoji of emojis) {
    tasks.push(preloadEmojiMeta(emoji, dpr, highRes));
  }
  for (const [fetchUrl, keys] of images) {
    tasks.push(
      preloadImageTarget({
        fetchUrl,
        registerKeys: Array.from(keys),
      })
    );
  }

  await Promise.all(tasks);
}
