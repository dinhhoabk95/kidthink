/**
 * Primitive vẽ huy hiệu Phản hồi Nhân-Quả Vật lý (Control of Error) &
 * trạng thái Khám phá 2 Pha (Explore -> Challenge / Micro-Sandbox) trên Canvas 2D.
 *
 * Tuân thủ nghiêm ngặt `07-game-engine.md`:
 * - 100% màu từ `designTokens`, 0 hex literal.
 * - 100% font qua `applyCanvasFontAtSize` + `legibleFontPx` (>= 16px CSS).
 * - Không dùng màu đỏ (`danger`) trừng phạt trẻ; dùng hổ phách ấm (`retry`) và ngọc (`brand`).
 */

import { designTokens } from "#src/systems/designTokens";
import type { MontessoriExploreTracker } from "#src/systems/montessori-explore-system";
import { alpha } from "./color-utils";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale";
import type { SceneBox } from "./types";

export function drawMontessoriControlOfErrorPill(
  ctx: CanvasRenderingContext2D,
  stageBox: SceneBox,
  tracker: MontessoriExploreTracker,
  cssScale?: number
): void {
  const diag = tracker.getControlOfErrorDiagnostics();
  const phase = tracker.getPhase();

  let badgeText: string | null = null;
  let isSandboxPill = false;

  if (diag) {
    badgeText =
      phase === "micro_sandbox"
        ? `Thử nghiệm: ${diag.reasonVi}`
        : diag.reasonVi;
    isSandboxPill = phase === "micro_sandbox";
  } else if (phase === "explore") {
    const done = tracker.getExploreActionsCount();
    const target = tracker.getMilestoneTarget();
    badgeText = `Khám phá tự do (${Math.min(done, target)}/${target})`;
    isSandboxPill = true;
  }

  if (!badgeText) {
    return;
  }

  const fontPx = legibleFontPx(18, cssScale);
  ctx.save();
  applyCanvasFontAtSize(ctx, fontPx, "sans", 700);
  const measuredW = ctx.measureText(badgeText).width;
  const padX = 20;
  const pillH = Math.max(36, Math.round(fontPx * 1.75));
  const pillW = Math.min(stageBox.w - 24, Math.ceil(measuredW + padX * 2));
  const pillX = stageBox.x + (stageBox.w - pillW) / 2;
  const pillY = stageBox.y + 8;
  const radius = pillH / 2;

  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = isSandboxPill
    ? designTokens.colors.brand[50]
    : designTokens.colors.retry[50];
  ctx.strokeStyle = isSandboxPill
    ? designTokens.colors.brand[400]
    : designTokens.colors.retry[400];
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, radius);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = isSandboxPill
    ? designTokens.colors.brand[900]
    : designTokens.colors.retry[900];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    badgeText,
    pillX + pillW / 2,
    pillY + pillH / 2,
    pillW - padX * 1.2
  );
  ctx.restore();
}
