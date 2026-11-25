import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "./numeracy-primitives.js";
import {
  detectSlotVisualComparisonCue,
  drawCheckMark,
  drawSlotVisualComparisonCue,
} from "./slot-decor.js";
import { getEmojiSprite, getImageSprite } from "./sprite-registry.js";
import {
  applyCanvasFontAtSize,
  applyEmojiFont,
  type LogicSpace,
  minLegiblePx,
} from "./type-scale.js";
import type { ItemVisualState, RenderAsset, RenderItem } from "./types.js";

const LABEL_FONT_RATIO = 0.16;
const GLYPH_FILL_RATIO = 0.52;
export const SPRITE_FILL_RATIO = 0.68;

const SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("vi", { granularity: "grapheme" })
    : null;

/** Tách chuỗi theo cụm ký tự người đọc thấy — giữ nguyên emoji và dấu tổ hợp (NFD). */
export function graphemes(text: string): string[] {
  return SEGMENTER
    ? Array.from(SEGMENTER.segment(text), (part) => part.segment)
    : Array.from(text);
}

function drawCenteredSprite(
  ctx: CanvasRenderingContext2D,
  sprite: CanvasImageSource,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  ctx.drawImage(sprite, cx - half, cy - half, size, size);
}

export function getColorsForState(state: ItemVisualState): {
  fill: string;
  border: string;
} {
  switch (state) {
    case "correct":
      return {
        fill: designTokens.colors.semantic.success[100],
        border: designTokens.colors.semantic.success[600],
      };
    case "wrong":
      return {
        fill: designTokens.colors.retry[100],
        border: designTokens.colors.retry[600],
      };
    case "touching":
      return {
        fill: designTokens.colors.montessori.amberLight,
        border: designTokens.colors.montessori.amberDark,
      };
    case "selected":
      return {
        fill: designTokens.colors.montessori.amberLight,
        border: designTokens.colors.montessori.amber,
      };
    case "locked":
      return {
        fill: designTokens.colors.vnMaterials.bamboo.light,
        border: designTokens.colors.vnMaterials.bamboo.joint,
      };
    default:
      return {
        fill: designTokens.colors.vnMaterials.doPaper.sheet,
        border: designTokens.colors.vnMaterials.bamboo.stalk,
      };
  }
}

export type EmojiResolver = (code: string) => string | null;
let customEmojiResolver: EmojiResolver | null = null;

export function setEmojiResolver(resolver: EmojiResolver | null): void {
  customEmojiResolver = resolver;
}

/**
 * Tra cứu glyph emoji theo `asset.ref` (Task #202 D-EE).
 * Ref chính là glyph UTF-8 thật.
 */
export function resolveEmojiGlyph(ref: string): string | null {
  if (customEmojiResolver) {
    const resolved = customEmojiResolver(ref);
    if (resolved) {
      return resolved;
    }
  }
  if (ref && ref.length > 0) {
    return ref;
  }
  return null;
}

export function drawEmojiContent(
  ctx: CanvasRenderingContext2D,
  emojiRef: string,
  slot: Slot
): boolean {
  return drawAssetInSlot(ctx, { kind: "emoji", ref: emojiRef }, slot);
}

/** Vẽ nội dung asset vào tâm slot. Trả `false` khi không vẽ được gì. */
export function drawAssetInSlot(
  ctx: CanvasRenderingContext2D,
  asset: RenderAsset | null | undefined,
  slot: Slot,
  glyphScale = 1
): boolean {
  if (!asset) {
    return false;
  }
  if (asset.kind === "text") {
    drawTextInSlot(ctx, asset.text, slot);
    return true;
  }
  if (asset.kind === "image") {
    const sprite = getImageSprite(asset.path);
    if (sprite) {
      const size = Math.max(
        18,
        Math.floor(Math.min(slot.w, slot.h) * SPRITE_FILL_RATIO * glyphScale)
      );
      drawCenteredSprite(ctx, sprite, slot.x, slot.y, size);
      return true;
    }
    drawPlaceholderBox(ctx, slot);
    return true;
  }
  const glyph = resolveEmojiGlyph(asset.ref);
  if (!glyph) {
    drawPlaceholderBox(ctx, slot);
    return true;
  }
  const parts = getGraphemeParts(glyph);
  if (parts.length === 1) {
    const single = parts[0] ?? glyph;
    const sprite = getEmojiSprite(single);
    if (sprite) {
      const size = Math.max(
        18,
        Math.floor(Math.min(slot.w, slot.h) * SPRITE_FILL_RATIO * glyphScale)
      );
      drawCenteredSprite(ctx, sprite, slot.x, slot.y, size);
      return true;
    }
  }
  drawGlyphInSlot(ctx, glyph, slot, glyphScale);
  return true;
}

const EMOJI_CODE_REGEX = /^EMJ-[a-z0-9-]+$/i;

const graphemePartsCache = new Map<string, readonly string[]>();

function getGraphemeParts(drawable: string): readonly string[] {
  const cached = graphemePartsCache.get(drawable);
  if (cached !== undefined) {
    return cached;
  }
  const parts =
    drawable.length <= 2
      ? [drawable]
      : graphemes(drawable).filter((p) => p.trim().length > 0);
  if (graphemePartsCache.size > 4096) {
    graphemePartsCache.clear();
  }
  graphemePartsCache.set(drawable, parts);
  return parts;
}

/** Phần slot mà cụm emoji chiếm — đủ lớn để đếm được từng vật. */
const MULTI_GLYPH_FILL = 0.92;

const EMOJI_GRAPHEME_REGEX = /^\p{Extended_Pictographic}/u;

/**
 * Chuỗi chỉ gồm từ hai emoji trở lên (vd. "⚙️⚙️⚙️"): đại diện cho một số lượng
 * vật, nên vẽ thành cụm lưới thay vì một dòng chữ co nhỏ.
 */
export function isEmojiRun(text: string): boolean {
  const parts = graphemes(text).filter((p) => p.trim().length > 0);
  return (
    parts.length >= 2 &&
    parts.length <= 12 &&
    parts.every((p) => EMOJI_GRAPHEME_REGEX.test(p))
  );
}

function resolveMultiGlyphCols(count: number): number {
  if (count <= 2) {
    return count;
  }
  if (count <= 4) {
    return 2;
  }
  if (count <= 6) {
    return 3;
  }
  return 4;
}

function drawMultiGlyphClusterInSlot(
  ctx: CanvasRenderingContext2D,
  parts: readonly string[],
  slot: Slot
): void {
  const count = parts.length;
  const cols = resolveMultiGlyphCols(count);
  const rows = Math.ceil(count / cols);
  const cellW = (slot.w * MULTI_GLYPH_FILL) / cols;
  const cellH = (slot.h * MULTI_GLYPH_FILL) / rows;
  const itemSize = Math.max(14, Math.floor(Math.min(cellW, cellH) * 0.95));
  applyEmojiFont(ctx, itemSize);
  const totalH = (rows - 1) * cellH;
  const startY = slot.y - totalH / 2;
  for (let r = 0; r < rows; r++) {
    const rowStart = r * cols;
    const rowCount = Math.min(cols, count - rowStart);
    const totalW = (rowCount - 1) * cellW;
    const startX = slot.x - totalW / 2;
    for (let c = 0; c < rowCount; c++) {
      const g = parts[rowStart + c];
      if (g) {
        const gx = startX + c * cellW;
        const gy = startY + r * cellH;
        const sprite = getEmojiSprite(g);
        if (sprite) {
          drawCenteredSprite(ctx, sprite, gx, gy, itemSize);
        } else {
          ctx.fillText(g, gx, gy);
        }
      }
    }
  }
}

/**
 * Vẽ một glyph vào ô. Mã `EMJ-*` không phân giải được thì vẽ ô thay thế,
 * tuyệt đối không in mã thô ra màn hình cho trẻ.
 */
export function drawGlyphInSlot(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  slot: Slot,
  glyphScale = 1
): void {
  let drawable = glyph;
  if (EMOJI_CODE_REGEX.test(drawable)) {
    const resolved = resolveEmojiGlyph(drawable);
    if (!resolved || EMOJI_CODE_REGEX.test(resolved)) {
      drawPlaceholderBox(ctx, slot);
      return;
    }
    drawable = resolved;
  }
  const parts = getGraphemeParts(drawable);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (parts.length > 1 && parts.length <= 12) {
    drawMultiGlyphClusterInSlot(ctx, parts, slot);
    ctx.restore();
    return;
  }
  const single = parts.length === 1 ? (parts[0] ?? drawable) : drawable;
  const sprite = getEmojiSprite(single);
  if (sprite) {
    const spriteSize = Math.max(
      18,
      Math.floor(Math.min(slot.w, slot.h) * SPRITE_FILL_RATIO * glyphScale)
    );
    drawCenteredSprite(ctx, sprite, slot.x, slot.y, spriteSize);
    ctx.restore();
    return;
  }
  const size = Math.max(
    14,
    Math.floor(Math.min(slot.w, slot.h) * GLYPH_FILL_RATIO * glyphScale)
  );
  applyEmojiFont(ctx, size);
  ctx.fillText(drawable, slot.x, slot.y);
  ctx.restore();
}

/** Chữ vẽ thay asset — số, dấu, giá trị phương án (sàn chữ ≥ 16px CSS). */
export function drawTextInSlot(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot,
  color: string = designTokens.colors.surface[800]
): void {
  const size = Math.max(
    minLegiblePx(DEFAULT_LOGIC_SPACE),
    Math.floor(Math.min(slot.w, slot.h) * 0.42)
  );
  ctx.save();
  ctx.fillStyle = color;
  applyCanvasFontAtSize(ctx, size, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, slot.x, slot.y, slot.w * 0.85);
  ctx.restore();
}

function slotLabelFontPx(slot: Slot, rs?: RenderSystem): number {
  const space: LogicSpace = rs
    ? { w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT }
    : DEFAULT_LOGIC_SPACE;
  return Math.max(
    minLegiblePx(space, rs?.viewport?.scale),
    Math.floor(Math.min(slot.w, slot.h) * LABEL_FONT_RATIO)
  );
}

export function slotLabelBandPx(slot: Slot, rs?: RenderSystem): number {
  return 4 + slotLabelFontPx(slot, rs);
}

/**
 * Nhãn chữ dưới một slot — sàn cỡ chữ 16 px CSS (`BR-A11-08`).
 */
export function drawSlotLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: Slot,
  rs?: RenderSystem
): void {
  const size = slotLabelFontPx(slot, rs);
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[700];
  applyCanvasFontAtSize(ctx, size, "sans", 500);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    text,
    slot.x,
    slot.y + slot.h / 2 + 4,
    Math.max(slot.hitW, slot.w)
  );
  ctx.restore();
}

export function drawGhostAssetInSlot(
  ctx: CanvasRenderingContext2D,
  asset: RenderItem["asset"],
  slot: Slot,
  ghostAlpha = 0.35
): void {
  ctx.save();
  ctx.globalAlpha = ghostAlpha;
  drawAssetInSlot(ctx, asset, slot);
  ctx.restore();
}

function drawSlotAssetOrPlaceholder(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  item: RenderItem
): void {
  const emojiRef = item.asset?.kind === "emoji" ? item.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(item.label, item.id, emojiRef);
  if (cue) {
    drawSlotVisualComparisonCue(ctx, slot, cue);
  }
  if (!drawAssetInSlot(ctx, item.asset, slot, cue?.glyphScale ?? 1)) {
    drawPlaceholderBox(ctx, slot);
  }
}

export function drawSlotItem(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem,
  shape: "circle" | "square" = "circle"
): void {
  const state = item.state ?? "idle";
  const { fill, border } = getColorsForState(state);
  const radius = Math.min(slot.w, slot.h) / 2;

  rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, shape);

  const drawnAsRepresentation = item.representation
    ? drawQuantityRepresentation(ctx, rs, slot, item.representation)
    : false;

  if (!drawnAsRepresentation) {
    if (item.text === undefined) {
      drawSlotAssetOrPlaceholder(ctx, slot, item);
    } else {
      drawTextInSlot(ctx, item.text, slot);
    }
  }

  if (item.label) {
    drawSlotLabel(ctx, item.label, slot, rs);
  }
  if (state === "correct") {
    drawCheckMark(ctx, slot);
  }
}

export function drawMirroredSlotItem(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem,
  axis: "vertical" | "horizontal",
  shape: "circle" | "square" = "square"
): void {
  const state = item.state ?? "idle";
  const { fill, border } = getColorsForState(state);
  const radius = Math.min(slot.w, slot.h) / 2;
  rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, shape);

  ctx.save();
  ctx.translate(slot.x, slot.y);
  if (axis === "vertical") {
    ctx.scale(-1, 1);
  } else {
    ctx.scale(1, -1);
  }
  ctx.translate(-slot.x, -slot.y);
  if (!drawAssetInSlot(ctx, item.asset, slot)) {
    drawPlaceholderBox(ctx, slot);
  }
  ctx.restore();

  if (state === "correct") {
    drawCheckMark(ctx, slot);
  }
}

export function drawSlotItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slots: readonly Slot[],
  items: readonly RenderItem[],
  shape: "circle" | "square" = "circle"
): void {
  const count = Math.min(slots.length, items.length);
  for (let i = 0; i < count; i++) {
    const slot = slots[i];
    const item = items[i];
    if (slot && item) {
      drawSlotItem(ctx, rs, slot, item, shape);
    }
  }
}
