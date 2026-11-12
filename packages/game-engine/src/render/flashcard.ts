import { isNumberEntity } from "@mindkid/shared/preschool-terminology";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { resolveGT000FlashcardRect } from "./gt-000-shapes.js";
import { drawPlaceholderBox } from "./numeracy-primitives.js";
import {
  applyCanvasFontAtSize,
  applyEmojiFont,
  minLegiblePx,
  spaceOf,
} from "./type-scale.js";
import type { ItemVisualState } from "./types.js";

const DIGIT_REGEX = /^\d+$/;

interface FlashcardComparisonCue {
  readonly kind: "length" | "height" | "size" | "weight" | "capacity";
  readonly glyphScale: number;
  readonly barRatio: number;
}

const VI_LONG_RE =
  /(?:^|\s)(rất dài|dài nhất|dài hơn|dài|rộng nhất|rộng hơn|rộng|xa nhất|xa hơn|xa)(?:$|\s)/i;
const VI_SHORT_RE =
  /(?:^|\s)(rất ngắn|ngắn nhất|ngắn hơn|ngắn|hẹp nhất|hẹp hơn|hẹp|gần nhất|gần hơn|gần)(?:$|\s)/i;
const VI_TALL_RE = /(?:^|\s)(rất cao|cao nhất|cao hơn|cao)(?:$|\s)/i;
const VI_LOW_RE = /(?:^|\s)(rất thấp|thấp nhất|thấp hơn|thấp|lùn)(?:$|\s)/i;
const VI_BIG_RE =
  /(?:^|\s)(rất to|to lớn|khổng lồ|to nhất|to hơn|lớn nhất|lớn hơn|to|lớn|dày nhất|dày hơn|dày)(?:$|\s)/i;
const VI_SMALL_RE =
  /(?:^|\s)(nhỏ xíu|rất nhỏ|bé xíu|tí hon|nhỏ nhất|nhỏ hơn|bé nhất|bé hơn|nhỏ|bé|mỏng nhất|mỏng hơn|mỏng)(?:$|\s)/i;
const VI_HEAVY_RE = /(?:^|\s)(rất nặng|nặng nhất|nặng hơn|nặng)(?:$|\s)/i;
const VI_LIGHT_RE = /(?:^|\s)(rất nhẹ|nhẹ nhất|nhẹ hơn|nhẹ)(?:$|\s)/i;
const VI_FULL_RE =
  /(?:^|\s)(đầy tràn|rất đầy|đầy nước|đầy|nhiều nước)(?:$|\s)/i;
const VI_EMPTY_RE = /(?:^|\s)(vơi|cạn|rỗng|ít nước|trống)(?:$|\s)/i;

function ratioFromValue(val: number | undefined, fallback: number): number {
  if (val === undefined || !Number.isFinite(val)) {
    return fallback;
  }
  const clamped = Math.max(1, Math.min(5, val));
  return 0.24 + ((clamped - 1) / 4) * 0.62;
}

function scaleFromRatio(ratio: number): number {
  return 0.68 + ratio * 0.56;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: clear multi-attribute comparison detector
function resolveFlashcardComparisonCue(asset: {
  asset_id: string;
  label: string;
  value?: number;
  contrast_group?: string;
}): FlashcardComparisonCue | null {
  const group = (asset.contrast_group ?? "").toLowerCase();
  const text = `${asset.label} ${asset.asset_id.replaceAll("_", " ")}`;

  if (group === "length" || VI_LONG_RE.test(text) || VI_SHORT_RE.test(text)) {
    const fallback = VI_SHORT_RE.test(text) ? 0.28 : 0.82;
    const barRatio = ratioFromValue(asset.value, fallback);
    return {
      kind: "length",
      glyphScale: scaleFromRatio(barRatio),
      barRatio,
    };
  }
  if (group === "height" || VI_TALL_RE.test(text) || VI_LOW_RE.test(text)) {
    const fallback = VI_LOW_RE.test(text) ? 0.3 : 0.82;
    const barRatio = ratioFromValue(asset.value, fallback);
    return {
      kind: "height",
      glyphScale: scaleFromRatio(barRatio),
      barRatio,
    };
  }
  if (group === "capacity" || VI_FULL_RE.test(text) || VI_EMPTY_RE.test(text)) {
    const fallback = VI_EMPTY_RE.test(text) ? 0.24 : 0.84;
    const barRatio = ratioFromValue(asset.value, fallback);
    return {
      kind: "capacity",
      glyphScale: 0.86 + barRatio * 0.26,
      barRatio,
    };
  }
  if (group === "weight" || VI_HEAVY_RE.test(text) || VI_LIGHT_RE.test(text)) {
    const fallback = VI_LIGHT_RE.test(text) ? 0.28 : 0.82;
    const barRatio = ratioFromValue(asset.value, fallback);
    return {
      kind: "weight",
      glyphScale: scaleFromRatio(barRatio),
      barRatio,
    };
  }
  if (group === "size" || VI_BIG_RE.test(text) || VI_SMALL_RE.test(text)) {
    const fallback = VI_SMALL_RE.test(text) ? 0.28 : 0.84;
    const barRatio = ratioFromValue(asset.value, fallback);
    return {
      kind: "size",
      glyphScale: scaleFromRatio(barRatio),
      barRatio,
    };
  }
  return null;
}

function drawFlashcardComparisonCue(
  ctx: CanvasRenderingContext2D,
  cue: FlashcardComparisonCue,
  cardW: number,
  x: number,
  y: number
): void {
  ctx.save();
  if (cue.kind === "length" || cue.kind === "weight") {
    const maxBarW = Math.min(cardW * 0.74, 230);
    const barH = cue.kind === "weight" ? 16 : 14;
    const barY = y + 32;
    const trackLeft = x - maxBarW / 2;
    const fillW = Math.max(24, Math.round(maxBarW * cue.barRatio));

    ctx.fillStyle = designTokens.colors.surface[100];
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(trackLeft, barY, maxBarW, barH, barH / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      cue.kind === "weight"
        ? designTokens.colors.brand[500]
        : designTokens.colors.cta[500];
    ctx.beginPath();
    ctx.roundRect(trackLeft, barY, fillW, barH, barH / 2);
    ctx.fill();
  } else if (cue.kind === "height" || cue.kind === "capacity") {
    const rodW = 16;
    const maxRodH = 110;
    const rodX = x + Math.min(cardW * 0.3, 96);
    const rodBottom = y + 40;
    const rodTop = rodBottom - maxRodH;
    const fillH = Math.max(20, Math.round(maxRodH * cue.barRatio));

    ctx.fillStyle = designTokens.colors.surface[100];
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rodX, rodTop, rodW, maxRodH, rodW / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      cue.kind === "capacity"
        ? designTokens.colors.brand[400]
        : designTokens.colors.semantic.success[500];
    ctx.beginPath();
    ctx.roundRect(rodX, rodBottom - fillH, rodW, fillH, rodW / 2);
    ctx.fill();
  } else if (cue.kind === "size") {
    const ringRadius = Math.round(26 + 38 * cue.barRatio);
    ctx.fillStyle = alpha(designTokens.colors.montessori.amberLight, 0.45);
    ctx.strokeStyle = designTokens.colors.montessori.amber;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y - 28, ringRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

const FLASHCARD_COUNTER_EMOJIS: readonly string[] = [
  "🍎",
  "🍓",
  "🍌",
  "🍊",
  "🍉",
  "🥕",
  "🌽",
  "🌻",
  "⭐",
  "🎈",
  "🐟",
  "🦆",
  "🐰",
  "🚗",
  "⚽",
  "🧁",
  "🦋",
  "🐢",
  "🐶",
  "🐱",
  "🐸",
];

export interface FlashcardRenderOptions {
  readonly state?: ItemVisualState;
  readonly depressed?: boolean;
  readonly scale?: number;
  readonly offsetY?: number;
  readonly softShadowsEnabled?: boolean;
}

export function drawFlashcardFrame(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cardW: number,
  cardH: number,
  options?: FlashcardRenderOptions
): void {
  const isSelected = options?.state === "selected";
  const isTouching = options?.state === "touching";
  const isDepressed = Boolean(options?.depressed || isTouching);
  const slabOffset = isDepressed ? 2 : 5;

  // 1. Warm ambient drop shadow (tôn trọng rs.softShadowsEnabled — BR-ERC-09)
  ctx.save();
  if (options?.softShadowsEnabled !== false) {
    ctx.shadowColor = alpha(designTokens.colors.scene.night[900], 0.12);
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
  }
  ctx.fillStyle = designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 2. 3D bottom slab (≥2 kênh thị giác khi chạm/chọn)
  ctx.save();
  ctx.fillStyle =
    isSelected || isTouching
      ? designTokens.colors.montessori.amberDark
      : designTokens.colors.surface[200];
  ctx.beginPath();
  ctx.roundRect(left, top + slabOffset, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // 3. Main card body
  ctx.save();
  ctx.fillStyle =
    isSelected || isTouching
      ? designTokens.colors.montessori.amberLight
      : designTokens.colors.surface[0];
  if (isTouching) {
    ctx.strokeStyle = designTokens.colors.brand[500];
    ctx.lineWidth = 5;
  } else if (isSelected) {
    ctx.strokeStyle = designTokens.colors.montessori.amber;
    ctx.lineWidth = 5;
  } else {
    ctx.strokeStyle = designTokens.colors.surface[200];
    ctx.lineWidth = 4;
  }
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

function drawFlashcardFallbackEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cardW: number,
  minFontPx: number,
  labelToDraw: string
): void {
  ctx.save();
  ctx.fillStyle = designTokens.colors.montessori.amberLight;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 44, y - 72, 88, 88, 22);
  ctx.fill();
  ctx.stroke();

  const initial = labelToDraw.trim().charAt(0).toUpperCase() || "★";
  const emblemFontPx = Math.max(minFontPx, Math.round(cardW * 0.14));
  applyCanvasFontAtSize(ctx, emblemFontPx, "heading", "bold");
  ctx.fillStyle = designTokens.colors.brand[600];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, x, y - 28);
  ctx.restore();
}

function drawFlashcardMainVisual(
  ctx: CanvasRenderingContext2D,
  asset: {
    glyph?: string;
    text?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  cue: FlashcardComparisonCue | null,
  cardW: number,
  x: number,
  y: number,
  labelToDraw: string,
  minFontPx: number
): void {
  const emojiRef =
    asset.image_ref?.kind === "emoji" ? asset.image_ref.ref?.trim() : undefined;
  if (emojiRef) {
    const emojiFontSize = cue ? Math.round(82 * cue.glyphScale) : 84;
    ctx.save();
    applyEmojiFont(ctx, emojiFontSize);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojiRef, x, y - 28);
    ctx.restore();
    return;
  }

  if (asset.glyph?.trim()) {
    ctx.save();
    applyCanvasFontAtSize(ctx, 100, "heading", "bold");
    ctx.fillStyle = designTokens.colors.brand[600];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(asset.glyph, x, y - 25);
    ctx.restore();
    return;
  }

  const textRef =
    asset.image_ref?.kind === "text" ? asset.image_ref.text?.trim() : undefined;
  const word = textRef || asset.text?.trim();
  if (word) {
    const wordFontPx = Math.max(minFontPx, Math.round(cardW * 0.2));
    ctx.save();
    applyCanvasFontAtSize(ctx, wordFontPx, "heading", "bold");
    ctx.fillStyle = designTokens.colors.brand[600];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(word, x, y - 25, cardW - 40);
    ctx.restore();
    return;
  }

  if (asset.image_ref?.kind === "image") {
    drawPlaceholderBox(ctx, {
      index: 0,
      page: 0,
      role: "neutral",
      x,
      y: y - 28,
      w: Math.round(cardW * 0.52),
      h: 176,
      hitW: 88,
      hitH: 88,
    });
  }
  drawFlashcardFallbackEmblem(ctx, x, y, cardW, minFontPx, labelToDraw);
}

function drawFlashcardNonNumberContent(
  ctx: CanvasRenderingContext2D,
  asset: {
    asset_id: string;
    label: string;
    value?: number;
    glyph?: string;
    text?: string;
    contrast_group?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  cardW: number,
  x: number,
  y: number,
  labelToDraw: string,
  minFontPx: number
): void {
  const cue = resolveFlashcardComparisonCue(asset);
  if (cue) {
    drawFlashcardComparisonCue(ctx, cue, cardW, x, y);
  }

  drawFlashcardMainVisual(ctx, asset, cue, cardW, x, y, labelToDraw, minFontPx);

  ctx.save();
  applyCanvasFontAtSize(ctx, Math.max(24, minFontPx), "sans", "bold");
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
  applyEmojiFont(ctx, 44);
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
  applyCanvasFontAtSize(ctx, 100, "heading", "bold");
  ctx.fillStyle = designTokens.colors.cta[500];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), x, y - 50);
  ctx.restore();

  if (val === 0) {
    ctx.save();
    applyCanvasFontAtSize(ctx, Math.max(18, minFontPx), "sans");
    ctx.fillStyle = designTokens.colors.surface[500];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("(Không có đồ vật nào)", x, y + 55);
    ctx.restore();
  } else {
    const fallbackEmoji =
      FLASHCARD_COUNTER_EMOJIS[
        Math.abs(val) % FLASHCARD_COUNTER_EMOJIS.length
      ] ?? "🍎";
    const itemEmoji =
      asset.image_ref?.kind === "emoji" &&
      asset.image_ref.ref &&
      !asset.image_ref.ref.includes("️⃣")
        ? asset.image_ref.ref
        : fallbackEmoji;
    drawFlashcardCounterItems(ctx, itemEmoji, val, cardW, x, y);
  }

  // Label at bottom
  ctx.save();
  applyCanvasFontAtSize(ctx, Math.max(22, minFontPx), "sans", "bold");
  ctx.fillStyle = designTokens.colors.surface[700];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelToDraw, x, y + 115);
  ctx.restore();
}

function resolveFlashcardNumericValue(asset: {
  label: string;
  value?: number;
  glyph?: string;
  contrast_group?: string;
}): number | undefined {
  const hasDigit = Boolean(asset.glyph && DIGIT_REGEX.test(asset.glyph));
  const isNumericCard =
    hasDigit ||
    isNumberEntity(asset.label, { glyph: asset.glyph }) ||
    asset.contrast_group === "quantity" ||
    asset.contrast_group === "num" ||
    asset.contrast_group === "numbers";
  if (!isNumericCard) {
    return undefined;
  }
  if (asset.value !== undefined) {
    return asset.value;
  }
  return hasDigit && asset.glyph ? Number.parseInt(asset.glyph, 10) : undefined;
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
    text?: string;
    contrast_group?: string;
    image_ref?: {
      kind: string;
      ref?: string;
      path?: string;
      text?: string;
      url?: string;
    };
  },
  displayLabel?: string,
  options?: FlashcardRenderOptions
): void {
  const { space, scale } = spaceOf(rs);
  const rect = resolveGT000FlashcardRect(space, slot);
  const poseScale = options?.scale ?? 1;
  const poseOffsetY = options?.offsetY ?? 0;
  const hasTransform = poseScale !== 1 || poseOffsetY !== 0;

  if (hasTransform) {
    ctx.save();
    ctx.translate(rect.x, rect.y + poseOffsetY);
    ctx.scale(poseScale, poseScale);
    ctx.translate(-rect.x, -rect.y);
  }

  drawFlashcardFrame(ctx, rect.left, rect.top, rect.w, rect.h, {
    ...options,
    softShadowsEnabled: options?.softShadowsEnabled ?? rs.softShadowsEnabled,
  });

  const val = resolveFlashcardNumericValue(asset);
  const labelToDraw = displayLabel ?? asset.label;
  const minFontPx = minLegiblePx(space, scale);

  if (val === undefined) {
    drawFlashcardNonNumberContent(
      ctx,
      asset,
      rect.w,
      rect.x,
      rect.y,
      labelToDraw,
      minFontPx
    );
  } else {
    drawFlashcardNumberContent(
      ctx,
      asset,
      val,
      rect.w,
      rect.x,
      rect.y,
      labelToDraw,
      minFontPx
    );
  }

  if (hasTransform) {
    ctx.restore();
  }
}

// ── Lật thẻ giả 3D (GT-020, `BR-E020-08`) ─────────────────────────────

/** Thời gian một lần lật thẻ. */
export const CARD_FLIP_MS = 260;
const CARD_FLIP_MIN_SCALE = 0.04;

export interface CardFlipPose {
  /** Co ngang quanh tâm thẻ để giả xoay quanh trục dọc. */
  readonly scaleX: number;
  /** `true` khi đã qua nửa vòng: vẽ mặt mới thay vì mặt cũ. */
  readonly showsNewFace: boolean;
}

/**
 * Tư thế lật ở `elapsedMs` kể từ lúc đổi mặt — hàm thuần. Nửa đầu co mặt cũ về
 * mỏng, nửa sau bung mặt mới ra. Hết thời gian hoặc `reduced_motion` là trạng
 * thái cuối: mặt mới, không co (`BR-FBK-09`).
 */
export function cardFlipPose(
  elapsedMs: number,
  reducedMotion: boolean
): CardFlipPose {
  if (reducedMotion || elapsedMs >= CARD_FLIP_MS) {
    return { scaleX: 1, showsNewFace: true };
  }
  const t = Math.min(1, Math.max(0, elapsedMs / CARD_FLIP_MS));
  return {
    scaleX: Math.max(CARD_FLIP_MIN_SCALE, Math.abs(Math.cos(Math.PI * t))),
    showsNewFace: t >= 0.5,
  };
}
