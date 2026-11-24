/**
 * Primitive vẽ vùng lời dẫn (`play-stage-zones.md`, `BR-PSZ-08..10`).
 *
 * Nằm trong `zones.prompt`:
 * 1. Mascot: ô vuông đầu vùng lời dẫn `(prompt.x, prompt.y, prompt.h, prompt.h)`
 * 2. Loa nghe lại: `zones.promptSpeaker` (bắt chạm thật qua shell, `BR-PSZ-08`)
 * 3. Picto mục tiêu / chữ đề: bên phải loa (`BR-PSZ-09`)
 *
 * Landscape thấp (`zones.promptPlacement === "side"`) lời dẫn là cột: mascot ở
 * đầu cột, loa ngay dưới, picto dưới loa nếu còn chỗ. Cột hẹp nên không có chữ phụ.
 */

import type { StageZones, ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils";
import { drawMascot, type MascotPose, type MascotSprites } from "./mascot";
import { drawEmojiContent, graphemes } from "./shared-render";
import { applyCanvasFontAtSize, canvasFontPx } from "./type-scale";
import type { RenderAsset } from "./types";
import { drawBambooJointAccent, drawDoPaperFiberMarks } from "./vn-folk-motifs";

export interface PromptZoneOptions {
  readonly promptText?: string;
  readonly targetAsset?: RenderAsset | null;
  /** Dáng mascot của khung này (`feedback-and-celebration.md` §7.4). */
  readonly mascotPose?: MascotPose;
  /** Thời gian từ lúc dáng bắt đầu, để hoạt ảnh chạy từ đầu mỗi lần đổi dáng. */
  readonly mascotElapsedMs?: number;
  readonly mascotSprites?: MascotSprites;
  readonly isSpeakerActive?: boolean;
}

function drawPromptContainer(
  ctx: CanvasRenderingContext2D,
  prompt: ZoneRect
): void {
  const radius = Math.min(24, prompt.h / 2);
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.14);
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.beginPath();
  ctx.roundRect(prompt.x, prompt.y, prompt.w, prompt.h, radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.vnMaterials.bamboo.stalk;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(prompt.x, prompt.y, prompt.w, prompt.h, radius);
  ctx.stroke();

  drawDoPaperFiberMarks(ctx, prompt.x, prompt.y, prompt.w, prompt.h);
  if (prompt.w >= 260) {
    drawBambooJointAccent(
      ctx,
      prompt.x + radius + 12,
      prompt.y + prompt.h - 4,
      prompt.x + prompt.w - radius - 12,
      prompt.y + prompt.h - 4,
      3
    );
  }
}

/** Cạnh ô vuông của mascot: chiều cao dải (`top`) hoặc bề rộng cột (`side`). */
function mascotSize(zones: StageZones): number {
  return zones.promptPlacement === "side" ? zones.prompt.w : zones.prompt.h;
}

function drawPromptMascot(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  zones: StageZones,
  options?: PromptZoneOptions
): void {
  const { prompt } = zones;
  const size = mascotSize(zones);
  const placement = {
    cx: prompt.x + size / 2,
    cy: prompt.y + size / 2,
    radius: size * 0.38,
  };

  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[50];
  ctx.strokeStyle = designTokens.colors.brand[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(placement.cx, placement.cy, placement.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawMascot(
    ctx,
    { ...placement, radius: placement.radius * 0.8 },
    options?.mascotPose ?? "idle",
    options?.mascotElapsedMs ?? 0,
    { sprites: options?.mascotSprites, reducedMotion: rs.reducedMotion }
  );
}

function drawPromptSpeaker(
  ctx: CanvasRenderingContext2D,
  promptSpeaker: ZoneRect,
  isActive?: boolean
): void {
  const speakerRadius = Math.min(promptSpeaker.w, promptSpeaker.h) / 2;
  const speakerCenter = {
    x: promptSpeaker.x + promptSpeaker.w / 2,
    y: promptSpeaker.y + promptSpeaker.h / 2,
  };

  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.18);
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = isActive
    ? designTokens.colors.cta[500]
    : designTokens.colors.montessori.amber;
  ctx.beginPath();
  ctx.arc(speakerCenter.x, speakerCenter.y, speakerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(speakerCenter.x, speakerCenter.y, speakerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Loa + sóng âm bằng Canvas 2D vector
  const iconSize = speakerRadius * 0.9;
  const half = iconSize / 2;
  const left = speakerCenter.x - half * 0.7;
  const cy = speakerCenter.y;
  ctx.fillStyle = designTokens.colors.surface[900];
  ctx.strokeStyle = designTokens.colors.surface[900];
  ctx.beginPath();
  ctx.moveTo(left, cy - half * 0.3);
  ctx.lineTo(left + half * 0.4, cy - half * 0.3);
  ctx.lineTo(left + half * 0.85, cy - half * 0.75);
  ctx.lineTo(left + half * 0.85, cy + half * 0.75);
  ctx.lineTo(left + half * 0.4, cy + half * 0.3);
  ctx.lineTo(left, cy + half * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = Math.max(2, iconSize * 0.1);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    speakerCenter.x + half * 0.1,
    cy,
    half * 0.45,
    -Math.PI / 4,
    Math.PI / 4
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    speakerCenter.x + half * 0.1,
    cy,
    half * 0.8,
    -Math.PI / 4,
    Math.PI / 4
  );
  ctx.stroke();
  ctx.restore();
}

const PROMPT_MAX_LINES = 2;
const SIDE_PICTO_GAP_PX = 12;
const SIDE_PICTO_MIN_PX = 40;
const WHITESPACE_RUN = /\s+/;

interface PromptWrapCacheEntry {
  rawText: string;
  font: string;
  maxWidth: number;
  lines: readonly string[];
}

const promptWrapCache = new WeakMap<
  CanvasRenderingContext2D,
  PromptWrapCacheEntry
>();

/**
 * Ngắt chữ lời dẫn theo từ thành tối đa `PROMPT_MAX_LINES` dòng. Vùng lời dẫn
 * cao bằng loa (96 px CSS) nên chứa được hai dòng; cắt "…" ngay dòng đầu làm
 * mất nửa câu ở điện thoại 390 px (QA 2026-10-03). Quá hai dòng thì dòng cuối
 * mới bị cắt.
 */
function wrapPromptText(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number
): readonly string[] {
  const font = ctx.font;
  const cached = promptWrapCache.get(ctx);
  if (
    cached &&
    cached.rawText === rawText &&
    cached.font === font &&
    cached.maxWidth === maxWidth
  ) {
    return cached.lines;
  }
  const words = rawText.split(WHITESPACE_RUN).filter((word) => word.length > 0);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  let resolvedLines: readonly string[];
  if (lines.length <= PROMPT_MAX_LINES) {
    resolvedLines = lines;
  } else {
    const kept = lines.slice(0, PROMPT_MAX_LINES - 1);
    const rest = lines.slice(PROMPT_MAX_LINES - 1).join(" ");
    resolvedLines = [...kept, truncateToWidth(ctx, rest, maxWidth)];
  }
  promptWrapCache.set(ctx, {
    rawText,
    font,
    maxWidth,
    lines: resolvedLines,
  });
  return resolvedLines;
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number
): string {
  if (ctx.measureText(rawText).width <= maxWidth) {
    return rawText;
  }
  // Cắt theo cụm ký tự (grapheme), không theo đơn vị UTF-16: `slice(0, -1)`
  // tách đôi emoji và dấu tiếng Việt dạng tổ hợp (NFD).
  const chars = graphemes(rawText);
  while (
    chars.length > 3 &&
    ctx.measureText(`${chars.join("")}…`).width > maxWidth
  ) {
    chars.pop();
  }
  return `${chars.join("")}…`;
}

/** Picto mục tiêu của cột lời dẫn: dưới loa, vừa bề rộng cột, chỉ khi còn chỗ. */
function drawSidePicto(
  ctx: CanvasRenderingContext2D,
  zones: StageZones,
  options?: PromptZoneOptions
): void {
  const { prompt, promptSpeaker } = zones;
  if (options?.targetAsset?.kind !== "emoji") {
    return;
  }
  const top = promptSpeaker.y + promptSpeaker.h + SIDE_PICTO_GAP_PX;
  const room = prompt.y + prompt.h - top - SIDE_PICTO_GAP_PX;
  const size = Math.min(prompt.w * 0.7, room);
  if (size < SIDE_PICTO_MIN_PX) {
    return;
  }
  const slot: Slot = {
    index: 0,
    x: prompt.x + prompt.w / 2,
    y: top + room / 2,
    w: size,
    h: size,
    hitW: size,
    hitH: size,
    page: 0,
    role: "target",
  };
  drawEmojiContent(ctx, options.targetAsset.ref, slot);
}

function drawSidePromptContent(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  zones: StageZones,
  options?: PromptZoneOptions
): void {
  if (options?.targetAsset) {
    drawSidePicto(ctx, zones, options);
    return;
  }
  const trimmed = options?.promptText?.trim();
  if (!trimmed) {
    return;
  }
  const textTop = zones.promptSpeaker.y + zones.promptSpeaker.h + 12;
  const textW = Math.max(40, zones.prompt.w - 16);
  const fontPx = Math.max(
    16,
    canvasFontPx(rs.logicSpace, "subPrompt", rs.viewport?.scale)
  );
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[700];
  applyCanvasFontAtSize(ctx, fontPx, "sans", 600);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const lines = wrapPromptText(ctx, trimmed, textW);
  const lineH = fontPx * 1.3;
  const centerX = zones.prompt.x + zones.prompt.w / 2;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined) {
      ctx.fillText(line, centerX, textTop + i * lineH);
    }
  }
  ctx.restore();
}

function drawPromptContent(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  zones: StageZones,
  options?: PromptZoneOptions
): void {
  if (zones.promptPlacement === "side") {
    drawSidePromptContent(ctx, rs, zones, options);
    return;
  }
  const { prompt, promptSpeaker } = zones;
  const contentLeft = promptSpeaker.x + promptSpeaker.w + 12;
  const contentW = prompt.x + prompt.w - contentLeft - 12;

  if (contentW <= 40) {
    return;
  }

  if (options?.targetAsset?.kind === "emoji") {
    const pictoSize = Math.min(prompt.h * 0.7, contentW);
    const pictoX = contentLeft + pictoSize / 2;
    const pictoY = prompt.y + prompt.h / 2;
    const slot: Slot = {
      index: 0,
      x: pictoX,
      y: pictoY,
      w: pictoSize,
      h: pictoSize,
      hitW: pictoSize,
      hitH: pictoSize,
      page: 0,
      role: "target",
    };
    drawEmojiContent(ctx, options.targetAsset.ref, slot);
    return;
  }

  if (options?.promptText) {
    // Không đặt trần: trần 18 px logic chỉ chạm trên máy dọc, đúng chỗ sàn
    // 16 px CSS cần chữ to hơn (`BR-A11-08`).
    const fontPx = Math.max(
      16,
      canvasFontPx(rs.logicSpace, "subPrompt", rs.viewport?.scale)
    );
    ctx.save();
    ctx.fillStyle = designTokens.colors.surface[700];
    applyCanvasFontAtSize(ctx, fontPx, "sans", 600);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const lines = wrapPromptText(ctx, options.promptText, contentW);
    const lineH = fontPx * 1.3;
    const firstY = prompt.y + prompt.h / 2 - ((lines.length - 1) * lineH) / 2;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) {
        ctx.fillText(line, contentLeft, firstY + i * lineH);
      }
    }
    ctx.restore();
  }
}

export function drawPromptZone(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  zones: StageZones,
  options?: PromptZoneOptions
): void {
  const { prompt, promptSpeaker } = zones;
  if (prompt.w <= 0 || prompt.h <= 0) {
    return;
  }

  ctx.save();
  drawPromptContainer(ctx, prompt);
  drawPromptMascot(ctx, rs, zones, options);
  drawPromptSpeaker(ctx, promptSpeaker, options?.isSpeakerActive);
  drawPromptContent(ctx, rs, zones, options);
  ctx.restore();
}
