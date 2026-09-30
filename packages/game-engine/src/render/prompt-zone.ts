/**
 * Primitive vẽ vùng lời dẫn (`play-stage-zones.md`, `BR-PSZ-08..10`).
 *
 * Nằm trong `zones.prompt`:
 * 1. Mascot: ô vuông đầu vùng lời dẫn `(prompt.x, prompt.y, prompt.h, prompt.h)`
 * 2. Loa nghe lại: `zones.promptSpeaker` (bắt chạm thật qua shell, `BR-PSZ-08`)
 * 3. Picto mục tiêu / chữ đề: bên phải loa (`BR-PSZ-09`)
 */

import type { StageZones, ZoneRect } from "#src/layout/stage-zones.js";
import type { Slot } from "#src/layout/types.js";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { drawEmojiContent } from "./shared-render.js";
import { canvasFontPx } from "./type-scale.js";
import type { RenderAsset } from "./types.js";

export interface PromptZoneOptions {
  readonly promptText?: string;
  readonly targetAsset?: RenderAsset | null;
  readonly mascotEmoji?: string;
  readonly isSpeakerActive?: boolean;
}

function drawPromptContainer(
  ctx: CanvasRenderingContext2D,
  prompt: ZoneRect
): void {
  const radius = Math.min(24, prompt.h / 2);
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.12)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.roundRect(prompt.x, prompt.y, prompt.w, prompt.h, radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(prompt.x, prompt.y, prompt.w, prompt.h, radius);
  ctx.stroke();
}

function drawPromptMascot(
  ctx: CanvasRenderingContext2D,
  prompt: ZoneRect,
  mascotEmoji: string
): void {
  const mascotCenter = {
    x: prompt.x + prompt.h / 2,
    y: prompt.y + prompt.h / 2,
  };
  const mascotRadius = prompt.h * 0.38;

  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[50];
  ctx.strokeStyle = designTokens.colors.brand[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mascotCenter.x, mascotCenter.y, mascotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = `${Math.round(prompt.h * 0.44)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mascotEmoji, mascotCenter.x, mascotCenter.y);
  ctx.restore();
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
  ctx.shadowColor = "rgba(130, 118, 96, 0.18)";
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
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(speakerCenter.x, speakerCenter.y, speakerRadius, 0, Math.PI * 2);
  ctx.stroke();

  const speakerFontPx = Math.round(speakerRadius * 0.9);
  ctx.font = `${speakerFontPx}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔊", speakerCenter.x, speakerCenter.y);
  ctx.restore();
}

function truncateTextToFit(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number
): string {
  let text = rawText;
  if (ctx.measureText(text).width > maxWidth) {
    while (text.length > 3 && ctx.measureText(`${text}…`).width > maxWidth) {
      text = text.slice(0, -1);
    }
    return `${text}…`;
  }
  return text;
}

function drawPromptContent(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  zones: StageZones,
  options?: PromptZoneOptions
): void {
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
    const space = { w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
    const fontPx = Math.min(
      18,
      canvasFontPx(space, "subPrompt", rs.viewport?.scale)
    );
    ctx.save();
    ctx.fillStyle = designTokens.colors.surface[700];
    ctx.font = `600 ${fontPx}px ${designTokens.fonts.sans}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const text = truncateTextToFit(ctx, options.promptText, contentW);
    ctx.fillText(text, contentLeft, prompt.y + prompt.h / 2);
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
  drawPromptMascot(ctx, prompt, options?.mascotEmoji ?? "🐻");
  drawPromptSpeaker(ctx, promptSpeaker, options?.isSpeakerActive);
  drawPromptContent(ctx, rs, zones, options);
  ctx.restore();
}
