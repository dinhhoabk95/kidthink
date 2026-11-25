import {
  clearAllSprites,
  getEmojiSprite,
  getImageSprite,
} from "@mindkid/game-engine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAudioUrl,
  MAX_DECODED_BITMAP_CACHE_ENTRIES,
  MAX_HIGH_RES_RASTER_PX,
  MAX_STANDARD_RASTER_PX,
  preloadSpritesForSession,
  resetItemSpriteCachesForTests,
  resolveSvgRasterSize,
} from "~/composables/play/use-item-sprites";

interface TrackedBitmap extends ImageBitmap {
  closed: boolean;
}

class MockHtmlImage {
  naturalWidth = 128;
  naturalHeight = 128;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private currentSrc = "";

  get src(): string {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

describe("use-item-sprites: Adaptive Raster Cap & ImageBitmap VRAM lifecycle", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalImage = globalThis.Image;
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  let createdCanvases: Array<{ width: number; height: number }> = [];
  let createdBitmaps: TrackedBitmap[] = [];

  beforeEach(() => {
    createdCanvases = [];
    createdBitmaps = [];

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: { devicePixelRatio: 2 },
    });

    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      writable: true,
      value: MockHtmlImage,
    });

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      writable: true,
      value: {
        createElement: (tag: string) => {
          if (tag !== "canvas") {
            throw new Error(`Unexpected tag: ${tag}`);
          }
          const canvas = {
            width: 0,
            height: 0,
            getContext: () => ({
              drawImage: vi.fn(),
            }),
          };
          createdCanvases.push(canvas);
          return canvas;
        },
      },
    });

    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      writable: true,
      value: vi.fn(() => {
        const bmp: TrackedBitmap = {
          width: 256,
          height: 256,
          closed: false,
          close() {
            bmp.closed = true;
          },
        };
        createdBitmaps.push(bmp);
        return Promise.resolve(bmp);
      }),
    });
  });

  afterEach(() => {
    resetItemSpriteCachesForTests();
    clearAllSprites();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      writable: true,
      value: originalDocument,
    });
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      writable: true,
      value: originalImage,
    });
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      writable: true,
      value: originalCreateImageBitmap,
    });
  });

  it("file âm thanh (.mp3...) không bị tải như ảnh sprite", async () => {
    const loaded: string[] = [];
    class RecordingImage extends MockHtmlImage {
      override get src(): string {
        return super.src;
      }
      override set src(value: string) {
        loaded.push(value);
        super.src = value;
      }
    }
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      writable: true,
      value: RecordingImage,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await preloadSpritesForSession([
      { kind: "image", path: "/audio/voice/common/numbers/3.mp3" },
      { kind: "image", url: "https://cdn.mindkid.test/v.m4a?x=1" },
      { kind: "image", path: "/s3/real-item.webp" },
    ]);

    expect(loaded).toContain("/s3/real-item.webp");
    expect(loaded.some((src) => isAudioUrl(src))).toBe(false);
    expect(warn).not.toHaveBeenCalled();
    expect(isAudioUrl("/audio/voice/common/numbers/3.MP3")).toBe(true);
    expect(isAudioUrl("/s3/a.svg")).toBe(false);
    warn.mockRestore();
  });

  it("resolveSvgRasterSize tính đúng mức standard (cap 256) và highRes (cap 384)", () => {
    expect(MAX_STANDARD_RASTER_PX).toBe(256);
    expect(MAX_HIGH_RES_RASTER_PX).toBe(384);

    // Chế độ mặc định (GT-001..GT-037): base 128, sàn 120, trần 256
    expect(resolveSvgRasterSize(0.5, false)).toBe(120);
    expect(resolveSvgRasterSize(1, false)).toBe(128);
    expect(resolveSvgRasterSize(2, false)).toBe(256);
    expect(resolveSvgRasterSize(3, false)).toBe(256);
    expect(resolveSvgRasterSize(Number.NaN, false)).toBe(128);

    // Chế độ highRes (GT-000 Flashcard): base 192, sàn 120, trần 384
    expect(resolveSvgRasterSize(0.5, true)).toBe(120);
    expect(resolveSvgRasterSize(1, true)).toBe(192);
    expect(resolveSvgRasterSize(2, true)).toBe(384);
    expect(resolveSvgRasterSize(3, true)).toBe(384);
  });

  it("preloadSpritesForSession tách cache key svgPath@targetPx giữa standard và highRes", async () => {
    await preloadSpritesForSession({ item: "🍎" }, { dpr: 2 });
    const standardSprite = getEmojiSprite("🍎") as {
      width: number;
      height: number;
    } | null;
    expect(standardSprite).not.toBeNull();
    expect(standardSprite?.width).toBe(256);
    expect(standardSprite?.height).toBe(256);

    await preloadSpritesForSession({ item: "🍎" }, { dpr: 2, highRes: true });
    const highResSprite = getEmojiSprite("🍎") as {
      width: number;
      height: number;
    } | null;
    expect(highResSprite).not.toBeNull();
    expect(highResSprite?.width).toBe(384);
    expect(highResSprite?.height).toBe(384);
    expect(highResSprite).not.toBe(standardSprite);

    // Gọi lại standard phải trúng cache 256x256 sẵn có, không tạo thêm canvas mới
    const canvasCountBeforeReuse = createdCanvases.length;
    await preloadSpritesForSession({ item: "🍎" }, { dpr: 2, highRes: false });
    expect(getEmojiSprite("🍎")).toBe(standardSprite);
    expect(createdCanvases.length).toBe(canvasCountBeforeReuse);
  });

  it("evict decodedBitmapCache gỡ mọi alias trong SpriteRegistry trước khi gọi ImageBitmap.close()", async () => {
    // Nạp ảnh #0 kèm nhiều alias (path + url + ref)
    await preloadSpritesForSession({
      kind: "image",
      path: "/s3/item-0.webp",
      url: "https://cdn.mindkid.test/item-0.webp",
      ref: "item-0-ref",
    });

    const firstBitmap = createdBitmaps[0];
    expect(firstBitmap).toBeDefined();
    expect(firstBitmap?.closed).toBe(false);
    expect(getImageSprite("/s3/item-0.webp")).toBe(firstBitmap);
    expect(getImageSprite("https://cdn.mindkid.test/item-0.webp")).toBe(
      firstBitmap
    );
    expect(getImageSprite("item-0-ref")).toBe(firstBitmap);

    // Nạp tiếp tới đúng trần MAX_DECODED_BITMAP_CACHE_ENTRIES (256):
    // Lưu ý: từ phần tử 128 trở đi imagePathSprites đã đẩy phần tử cũ ra khỏi bảng 128,
    // nhưng decodedBitmapCache vẫn chưa đóng firstBitmap!
    const batchToCap = Array.from(
      { length: MAX_DECODED_BITMAP_CACHE_ENTRIES - 1 },
      (_, idx) => ({
        kind: "image" as const,
        path: `/s3/item-${idx + 1}.webp`,
      })
    );
    await preloadSpritesForSession(batchToCap);
    expect(firstBitmap?.closed).toBe(false);

    // Chạm lại alias /s3/item-0.webp bằng cách nạp lại -> trúng decodedBitmapCache, đưa lại vào imagePathSprites
    // đồng thời đẩy item-1 thành phần tử cũ nhất của decodedBitmapCache!
    const secondBitmap = createdBitmaps[1];
    expect(secondBitmap?.closed).toBe(false);
    await preloadSpritesForSession({
      kind: "image",
      path: "/s3/item-0.webp",
      url: "https://cdn.mindkid.test/item-0.webp",
      ref: "item-0-ref",
    });
    expect(getImageSprite("/s3/item-0.webp")).toBe(firstBitmap);
    expect(firstBitmap?.closed).toBe(false);

    // Thêm 1 ảnh mới vượt trần 256 -> item-1 (cũ nhất) bị evict và close(), item-0 vẫn sống khoẻ!
    await preloadSpritesForSession({
      kind: "image",
      path: "/s3/item-overflow-1.webp",
    });
    expect(secondBitmap?.closed).toBe(true);
    expect(getImageSprite("/s3/item-1.webp")).toBeNull();
    expect(firstBitmap?.closed).toBe(false);
    expect(getImageSprite("/s3/item-0.webp")).toBe(firstBitmap);

    // Đẩy thêm 255 ảnh nữa để ép item-0 (đang nằm trong imagePathSprites!) bị evict khỏi decodedBitmapCache
    const overflowBatch = Array.from(
      { length: MAX_DECODED_BITMAP_CACHE_ENTRIES },
      (_, idx) => ({
        kind: "image" as const,
        path: `/s3/item-burst-${idx}.webp`,
      })
    );
    await preloadSpritesForSession(overflowBatch);

    // item-0 phải bị gỡ khỏi toàn bộ alias trong SpriteRegistry VÀ được gọi .close()!
    expect(firstBitmap?.closed).toBe(true);
    expect(getImageSprite("/s3/item-0.webp")).toBeNull();
    expect(getImageSprite("https://cdn.mindkid.test/item-0.webp")).toBeNull();
    expect(getImageSprite("item-0-ref")).toBeNull();

    // Bất biến sống còn: MỌI entry hiện diện trong imagePathSprites đều có closed !== true!
    for (let idx = 0; idx < MAX_DECODED_BITMAP_CACHE_ENTRIES; idx++) {
      const active = getImageSprite(
        `/s3/item-burst-${idx}.webp`
      ) as TrackedBitmap | null;
      if (active) {
        expect(active.closed).toBe(false);
      }
    }
  });
});
