import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { minLegiblePx, spaceOf } from "./type-scale.js";

const DIGIT_REGEX = /^\d+$/;

export function drawFlashcardFrame(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cardW: number,
  cardH: number
): void {
  // 1. Warm ambient drop shadow
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.scene.night[900], 0.12);
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 2. 3D bottom slab
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top + 5, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 3. Main card white body
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // 4. White top specular highlight
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left + 28, top + 4);
  ctx.lineTo(left + cardW - 28, top + 4);
  ctx.stroke();
  ctx.restore();
}

function drawFlashcardNonNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  x: number,
  y: number,
  labelToDraw: string,
  minFontPx: number
): void {
  if (asset.image_ref?.kind === "emoji" && asset.image_ref.ref) {
    ctx.save();
    ctx.font = `84px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.image_ref.ref, x, y - 25);
    ctx.restore();
  } else if (asset.glyph) {
    ctx.save();
    ctx.font = `bold 100px ${designTokens.fonts.heading}`;
    ctx.fillStyle = designTokens.colors.brand[600];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.glyph, x, y - 25);
    ctx.restore();
  }

  ctx.save();
  ctx.font = `bold ${Math.max(24, minFontPx)}px ${designTokens.fonts.sans}`;
  ctx.fillStyle = designTokens.colors.surface[800];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelToDraw, x, y + 80);
  ctx.restore();
}

function drawFlashcardCounterItems(
  ctx: CanvasRenderingContext2D,
  itemEmoji: string,
  val: number,
  cardW: number,
  x: number,
  y: number
): void {
  const maxCount = Math.min(val, 10);
  const gap = Math.min(60, (cardW - 60) / maxCount);
  const startX = x - ((maxCount - 1) * gap) / 2;

  ctx.save();
  ctx.font = `44px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < maxCount; i++) {
    ctx.fillText(itemEmoji, startX + i * gap, y + 55);
  }
  ctx.restore();
}

function drawFlashcardNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  val: number,
  cardW: number,
  x: number,
  y: number,
  labelToDraw: string,
  minFontPx: number
): void {
  // Large orange numeral
  ctx.save();
  ctx.font = `bold 100px ${designTokens.fonts.heading}`;
  ctx.fillStyle = designTokens.colors.cta[500];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), x, y - 50);
  ctx.restore();

  if (val === 0) {
    ctx.save();
    ctx.font = `${Math.max(18, minFontPx)}px ${designTokens.fonts.sans}`;
    ctx.fillStyle = designTokens.colors.surface[500];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("(Không có đồ vật nào)", x, y + 55);
    ctx.restore();
  } else {
    const itemEmoji =
      asset.image_ref?.kind === "emoji" &&
      asset.image_ref.ref &&
      !asset.image_ref.ref.includes("️⃣")
        ? asset.image_ref.ref
        : "⚽";
    drawFlashcardCounterItems(ctx, itemEmoji, val, cardW, x, y);
  }

  // Label at bottom
  ctx.save();
  ctx.font = `bold ${Math.max(22, minFontPx)}px ${designTokens.fonts.sans}`;
  ctx.fillStyle = designTokens.colors.surface[700];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelToDraw, x, y + 115);
  ctx.restore();
}

export function drawFlashcard(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  displayLabel?: string
): void {
  const cardW = Math.max(
    280,
    Math.min(slot.w > 0 ? slot.w : 350, rs.LOGIC_WIDTH * 0.42)
  );
  const cardH = Math.max(
    260,
    Math.min(slot.h > 0 ? slot.h : 320, rs.LOGIC_HEIGHT * 0.62)
  );
  const x = slot.x;
  const y = slot.y;
  const left = x - cardW / 2;
  const top = y - cardH / 2;

  drawFlashcardFrame(ctx, left, top, cardW, cardH);

  const hasDigit = Boolean(asset.glyph && DIGIT_REGEX.test(asset.glyph));
  const val =
    asset.value ??
    (hasDigit ? Number.parseInt(asset.glyph as string, 10) : undefined);

  const labelToDraw = displayLabel ?? asset.label;
  const { space, scale } = spaceOf(rs);
  const minFontPx = minLegiblePx(space, scale);

  if (val === undefined) {
    drawFlashcardNonNumberContent(ctx, asset, x, y, labelToDraw, minFontPx);
  } else {
    drawFlashcardNumberContent(
      ctx,
      asset,
      val,
      cardW,
      x,
      y,
      labelToDraw,
      minFontPx
    );
  }
}
