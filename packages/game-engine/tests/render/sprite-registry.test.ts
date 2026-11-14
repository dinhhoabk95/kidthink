import { afterEach, describe, expect, it, vi } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  clearAllSprites,
  drawAssetInSlot,
  drawFlashcard,
  drawGlyphInSlot,
  drawMirroredSlotItem,
  FLASHCARD_COUNTER_EMOJI_POOL,
  getEmojiSprite,
  getHeroEmojiSprite,
  getImageSprite,
  MAX_IMAGE_SPRITES,
  registerEmojiSprite,
  registerHeroEmojiSprite,
  registerImageSprite,
  SPRITE_FILL_RATIO,
} from "#src/render/index.js";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

function makeCtx(w = 960, h = 540): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(w, h).getContext("2d");
  if (!ctx) {
    throw new Error("2d context unavailable");
  }
  return ctx as CanvasRenderingContext2D;
}

function makeSprite(w = 120, h = 120): CanvasImageSource {
  return makeCtx(w, h).canvas;
}

function makeRs(): RenderSystem {
  const rs = new RenderSystem();
  rs.logicSpace = { w: 960, h: 540 };
  return rs;
}

const TEST_SLOT: Slot = {
  index: 0,
  x: 480,
  y: 270,
  w: 100,
  h: 100,
  hitW: 100,
  hitH: 100,
  page: 0,
  role: "source",
};

describe("SpriteRegistry & 3-tier sprite rendering", () => {
  afterEach(() => {
    clearAllSprites();
  });

  it("lưu và tra cứu emoji/hero/image độc lập kèm chuẩn hoá NFC và variation selector \\uFE0F", () => {
    const emojiSprite = makeSprite(120, 120);
    const heroSprite = makeSprite(360, 360);
    const imgSprite = makeSprite(200, 200);

    registerEmojiSprite("⭐️", emojiSprite);
    registerHeroEmojiSprite("⭐", heroSprite);
    registerImageSprite(" /sprites/hero/rabbit.webp ", imgSprite);

    expect(getEmojiSprite("⭐")).toBe(emojiSprite);
    expect(getEmojiSprite("⭐️")).toBe(emojiSprite);
    expect(getHeroEmojiSprite("⭐️")).toBe(heroSprite);
    expect(getHeroEmojiSprite("⭐")).toBe(heroSprite);
    expect(getImageSprite("/sprites/hero/rabbit.webp")).toBe(imgSprite);

    expect(getEmojiSprite("   ")).toBeNull();
    expect(getImageSprite("")).toBeNull();

    clearAllSprites();
    expect(getEmojiSprite("⭐")).toBeNull();
    expect(getHeroEmojiSprite("⭐")).toBeNull();
    expect(getImageSprite("/sprites/hero/rabbit.webp")).toBeNull();
  });

  it("drawAssetInSlot dùng drawImage khi có emoji/image sprite và fallback an toàn khi thiếu", () => {
    const sprite = makeSprite();
    registerEmojiSprite("🍎", sprite);

    const ctx1 = makeCtx();
    const drawImage1 = vi.spyOn(ctx1, "drawImage");
    const fillText1 = vi.spyOn(ctx1, "fillText");
    expect(drawAssetInSlot(ctx1, { kind: "emoji", ref: "🍎" }, TEST_SLOT)).toBe(
      true
    );
    const expectedSize = Math.floor(100 * SPRITE_FILL_RATIO);
    expect(drawImage1).toHaveBeenCalledWith(
      sprite,
      TEST_SLOT.x - expectedSize / 2,
      TEST_SLOT.y - expectedSize / 2,
      expectedSize,
      expectedSize
    );
    expect(fillText1).not.toHaveBeenCalled();

    const imgSprite = makeSprite();
    registerImageSprite("/sprites/hero/bear.webp", imgSprite);
    const ctx2 = makeCtx();
    const drawImage2 = vi.spyOn(ctx2, "drawImage");
    const fillRect2 = vi.spyOn(ctx2, "fillRect");
    expect(
      drawAssetInSlot(
        ctx2,
        { kind: "image", path: "/sprites/hero/bear.webp" },
        TEST_SLOT
      )
    ).toBe(true);
    expect(drawImage2).toHaveBeenCalledTimes(1);
    expect(fillRect2).not.toHaveBeenCalled();

    const ctx3 = makeCtx();
    const fillRect3 = vi.spyOn(ctx3, "fillRect");
    expect(
      drawAssetInSlot(ctx3, { kind: "image", path: "/missing.webp" }, TEST_SLOT)
    ).toBe(true);
    expect(fillRect3).toHaveBeenCalled();
  });

  it("drawGlyphInSlot hỗ trợ cả đơn cụm và cụm nhiều emoji qua sprite", () => {
    const apple = makeSprite();
    registerEmojiSprite("🍎", apple);

    const ctx = makeCtx();
    const drawImage = vi.spyOn(ctx, "drawImage");
    const fillText = vi.spyOn(ctx, "fillText");

    drawGlyphInSlot(ctx, "🍎🍎🍎", TEST_SLOT);
    expect(drawImage).toHaveBeenCalledTimes(3);
    expect(fillText).not.toHaveBeenCalled();

    clearAllSprites();
    const ctxFallback = makeCtx();
    const drawImageFallback = vi.spyOn(ctxFallback, "drawImage");
    const fillTextFallback = vi.spyOn(ctxFallback, "fillText");
    drawGlyphInSlot(ctxFallback, "🍎", TEST_SLOT);
    expect(drawImageFallback).not.toHaveBeenCalled();
    expect(fillTextFallback).toHaveBeenCalledWith(
      "🍎",
      TEST_SLOT.x,
      TEST_SLOT.y
    );
  });

  it("drawMirroredSlotItem vẽ sprite dưới transform lật gương", () => {
    const fish = makeSprite();
    registerEmojiSprite("🐟", fish);
    const ctx = makeCtx();
    const rs = makeRs();
    const scale = vi.spyOn(ctx, "scale");
    const drawImage = vi.spyOn(ctx, "drawImage");

    drawMirroredSlotItem(
      ctx,
      rs,
      TEST_SLOT,
      { id: "fish", asset: { kind: "emoji", ref: "🐟" } },
      "vertical"
    );

    expect(scale).toHaveBeenCalledWith(-1, 1);
    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it("drawFlashcard ưu tiên Tier 3 Hero WebP, hỗ trợ kind image và vật đếm số", () => {
    expect(FLASHCARD_COUNTER_EMOJI_POOL.length).toBeGreaterThan(0);

    const tier2 = makeSprite(120, 120);
    const tier3 = makeSprite(360, 360);
    registerEmojiSprite("🐟", tier2);
    registerHeroEmojiSprite("🐟", tier3);

    const rs = makeRs();
    const ctxHero = makeCtx();
    const drawImageHero = vi.spyOn(ctxHero, "drawImage");
    const fillTextHero = vi.spyOn(ctxHero, "fillText");
    drawFlashcard(ctxHero, rs, TEST_SLOT, {
      asset_id: "fish",
      label: "Con cá",
      image_ref: { kind: "emoji", ref: "🐟" },
    });
    expect(drawImageHero).toHaveBeenCalledTimes(1);
    expect(drawImageHero.mock.calls[0]?.[0]).toBe(tier3);
    expect(drawImageHero.mock.calls[0]?.[3]).toBe(118);
    expect(fillTextHero).toHaveBeenCalledWith(
      "Con cá",
      expect.any(Number),
      expect.any(Number)
    );

    const rabbitImg = makeSprite(360, 360);
    registerImageSprite("/sprites/hero/rabbit.webp", rabbitImg);
    const ctxImg = makeCtx();
    const drawImageImg = vi.spyOn(ctxImg, "drawImage");
    const fillRectImg = vi.spyOn(ctxImg, "fillRect");
    drawFlashcard(ctxImg, rs, TEST_SLOT, {
      asset_id: "rabbit",
      label: "Con thỏ",
      image_ref: { kind: "image", path: "/sprites/hero/rabbit.webp" },
    });
    expect(drawImageImg).toHaveBeenCalledTimes(1);
    expect(drawImageImg.mock.calls[0]?.[0]).toBe(rabbitImg);
    expect(fillRectImg).not.toHaveBeenCalled();

    const apple = makeSprite(120, 120);
    registerEmojiSprite("🍎", apple);
    const ctxNum = makeCtx();
    const drawImageNum = vi.spyOn(ctxNum, "drawImage");
    drawFlashcard(ctxNum, rs, TEST_SLOT, {
      asset_id: "num_3",
      label: "Số 3",
      value: 3,
      glyph: "3",
      image_ref: { kind: "emoji", ref: "🍎" },
    });
    expect(drawImageNum).toHaveBeenCalledTimes(3);
    expect(drawImageNum.mock.calls[0]?.[3]).toBe(48);
    expect(drawImageNum.mock.calls[0]?.[4]).toBe(48);
  });

  it("drawFlashcard co kích thước vật đếm theo khoảng cách khi val = 6..10 để không chồng chéo", () => {
    const apple = makeSprite(120, 120);
    registerEmojiSprite("🍎", apple);
    const rs = makeRs();
    const ctx = makeCtx();
    const drawImage = vi.spyOn(ctx, "drawImage");

    drawFlashcard(ctx, rs, TEST_SLOT, {
      asset_id: "num_10",
      label: "Số 10",
      value: 10,
      glyph: "10",
      image_ref: { kind: "emoji", ref: "🍎" },
    });

    expect(drawImage).toHaveBeenCalledTimes(10);
    const cardW = Math.min(350, rs.logicSpace.w - 40);
    const gap = Math.min(60, (cardW - 60) / 10);
    const drawnSize = drawImage.mock.calls[0]?.[3];
    expect(typeof drawnSize).toBe("number");
    expect(drawnSize).toBeLessThan(gap);
    expect(drawnSize).toBeGreaterThanOrEqual(24);
  });

  it("giới hạn imagePathSprites theo MAX_IMAGE_SPRITES và đẩy phần tử cũ nhất theo LRU", () => {
    const first = makeSprite(10, 10);
    registerImageSprite("/img/0.webp", first);
    for (let i = 1; i < MAX_IMAGE_SPRITES; i++) {
      registerImageSprite(`/img/${i}.webp`, makeSprite(10, 10));
    }

    // Truy cập lại key 0 để đẩy nó lên mới nhất trước khi thêm key vượt trần
    expect(getImageSprite("/img/0.webp")).toBe(first);

    const overflow = makeSprite(20, 20);
    registerImageSprite(`/img/${MAX_IMAGE_SPRITES}.webp`, overflow);

    expect(getImageSprite("/img/0.webp")).toBe(first);
    expect(getImageSprite("/img/1.webp")).toBeNull();
    expect(getImageSprite(`/img/${MAX_IMAGE_SPRITES}.webp`)).toBe(overflow);

    // Đăng ký đè key đã tồn tại phải làm mới thứ tự và không đẩy key khác ra
    const updated = makeSprite(30, 30);
    registerImageSprite("/img/2.webp", updated);
    registerImageSprite("/img/extra.webp", makeSprite(20, 20));
    expect(getImageSprite("/img/2.webp")).toBe(updated);
    expect(getImageSprite("/img/3.webp")).toBeNull();
  });
});
