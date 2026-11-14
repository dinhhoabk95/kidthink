import { resolveCustomEmojiSprite } from "@mindkid/emoji";
import {
  FLASHCARD_COUNTER_EMOJI_POOL,
  registerEmojiSprite,
  registerHeroEmojiSprite,
  registerImageSprite,
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

export interface PreloadSpritesOptions {
  readonly includeFlashcardCounters?: boolean;
  readonly dpr?: number;
}

const LOAD_TIMEOUT_MS = 2500;
const MAX_CACHE_ENTRIES = 256;
const SVG_RASTER_BASE_PX = 192;
const SVG_RASTER_MAX_PX = 384;

const PICTOGRAPHIC_REGEX = /\p{Extended_Pictographic}/u;
const GRAPHEME_SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("vi", { granularity: "grapheme" })
    : null;

const loadedImageCache = new Map<string, Promise<HTMLImageElement | null>>();
const rasterizedSvgCache = new Map<string, CanvasImageSource>();
const decodedBitmapCache = new Map<string, Promise<CanvasImageSource>>();

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
  value: V
): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, value);
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
  dpr: number
): CanvasImageSource {
  const safeDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const targetSize = Math.min(
    SVG_RASTER_MAX_PX,
    Math.ceil(SVG_RASTER_BASE_PX * Math.max(1, safeDpr))
  );
  const cacheKey = `${svgPath}@${targetSize}`;
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
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return img;
  }
  ctx.drawImage(img, 0, 0, targetSize, targetSize);
  setBoundedCache(rasterizedSvgCache, cacheKey, canvas);
  return canvas;
}

function decodeBitmapOrImage(
  img: HTMLImageElement,
  src: string
): Promise<CanvasImageSource> {
  if (typeof createImageBitmap !== "function") {
    return Promise.resolve(img);
  }
  const existing = decodedBitmapCache.get(src);
  if (existing) {
    decodedBitmapCache.delete(src);
    decodedBitmapCache.set(src, existing);
    return existing;
  }
  const promise = createImageBitmap(img).catch(() => img);
  setBoundedCache(decodedBitmapCache, src, promise);
  return promise;
}

async function preloadEmojiMeta(emoji: string, dpr: number): Promise<void> {
  const meta = resolveCustomEmojiSprite(emoji);
  if (!meta) {
    return;
  }
  const tasks: Promise<void>[] = [
    loadHtmlImage(meta.svgPath).then((img) => {
      if (!img) {
        return;
      }
      const source = rasterizeSvgToCanvas(img, meta.svgPath, dpr);
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
        const source = await decodeBitmapOrImage(img, heroPath);
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
  const source = await decodeBitmapOrImage(img, target.fetchUrl);
  for (const key of target.registerKeys) {
    registerImageSprite(key, source);
  }
}

export async function preloadSpritesForSession(
  source: SpriteScanValue,
  options?: PreloadSpritesOptions
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
  const tasks: Promise<void>[] = [];

  for (const emoji of emojis) {
    tasks.push(preloadEmojiMeta(emoji, dpr));
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
