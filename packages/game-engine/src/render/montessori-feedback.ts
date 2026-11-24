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
import type { RenderSystem } from "#src/systems/render-system";
import type { BallPoint } from "./beat-ball";
import { alpha } from "./color-utils";
import {
  applyCanvasFont,
  applyCanvasFontAtSize,
  canvasFontPx,
  legibleFontPx,
  spaceOf,
} from "./type-scale";
import type { SceneBox } from "./types";
import { drawBambooJointAccent } from "./vn-folk-motifs";

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

/** Vẽ bóng nảy GT-034 (`BR-E034-12`): vector: thân hổ phách, viền gỗ, một đốm sáng. */
export function drawBeatBall(
  ctx: CanvasRenderingContext2D,
  pose: BallPoint,
  radius: number
): void {
  const { montessori } = designTokens.colors;
  ctx.save();
  // Bóng đổ nhỏ dưới đáy cho thấy bóng đang chạm ô.
  ctx.fillStyle = alpha(montessori.woodBorder, 0.25);
  ctx.beginPath();
  ctx.arc(pose.x, pose.y + radius * 0.9, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = montessori.amber;
  ctx.strokeStyle = montessori.amberDark;
  ctx.lineWidth = Math.max(2, radius * 0.18);
  ctx.beginPath();
  ctx.arc(pose.x, pose.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = montessori.amberGlow;
  ctx.beginPath();
  ctx.arc(
    pose.x - radius * 0.3,
    pose.y - radius * 0.3,
    radius * 0.25,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

// ── Thẻ chip của dải biểu tượng thay âm thanh (GT-018, `BR-E018-06`) ──

/**
 * Nền thẻ cho một chip của dải chỉ dẫn khi tắt tiếng: giấy kem, viền gỗ.
 * Chỉ vẽ nền; biểu tượng bên trong do engine vẽ bằng primitive của slot.
 * `speaker` đổi nền sang hổ phách nhạt để phân biệt chip loa tắt tiếng với
 * các bước chỉ dẫn.
 */
export function drawStripChipCard(
  ctx: CanvasRenderingContext2D,
  chip: { readonly cx: number; readonly cy: number; readonly size: number },
  speaker = false
): void {
  const half = chip.size / 2;
  ctx.save();
  ctx.fillStyle = speaker
    ? designTokens.colors.montessori.amberLight
    : designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(chip.cx - half, chip.cy - half, chip.size, chip.size, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export type EncouragementBannerKind = "praise" | "retry" | "celebrate";

const BANNER_SHADOW_COLOR = alpha(
  designTokens.colors.montessori.woodBorder,
  0.16
);
const DEFAULT_BANNER_BOX = { x: 0, y: 12, w: 960, h: 52 };

/**
 * Bảng lụa / giấy dó viền tre ngà hiển thị câu khích lệ đồng dao trên HUD
 * Canvas (`BR-A11-08`: cỡ chữ >= 16px CSS qua `applyCanvasFont`, tuyệt đối
 * không dùng màu đỏ `danger` trừng phạt, 0 cấp phát object mỗi khung khi truyền `box`).
 */
export function drawEncouragementBanner(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  text: string,
  kind: EncouragementBannerKind = "praise",
  box?: SceneBox
): void {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  const { space, scale } = spaceOf(rs);
  const fontPx = canvasFontPx(space, "hud", scale);
  let targetBox: SceneBox;
  if (box) {
    targetBox = box;
  } else {
    DEFAULT_BANNER_BOX.w = rs.LOGIC_WIDTH;
    DEFAULT_BANNER_BOX.h = Math.max(48, Math.round(fontPx * 2));
    targetBox = DEFAULT_BANNER_BOX;
  }

  ctx.save();
  applyCanvasFont(ctx, "hud", space, scale, "heading", "bold");
  const textW = ctx.measureText(trimmed).width;
  const padX = 24;
  const bannerW = Math.min(
    Math.max(180, Math.ceil(textW + padX * 2)),
    Math.max(180, targetBox.w - 24)
  );
  const bannerH = Math.max(44, Math.round(fontPx * 1.8));
  const bannerX = targetBox.x + (targetBox.w - bannerW) / 2;
  const bannerY = targetBox.y + (targetBox.h - bannerH) / 2;
  const radius = Math.min(24, bannerH / 2);

  const vn = designTokens.colors.vnMaterials;
  let fill: string = vn.doPaper.sheet;
  let border: string = designTokens.colors.semantic.success[500];
  let ink: string = designTokens.colors.semantic.success[900];

  if (kind === "retry") {
    fill = designTokens.colors.retry[50];
    border = designTokens.colors.retry[500];
    ink = designTokens.colors.retry[900];
  } else if (kind === "celebrate") {
    fill = vn.bamboo.light;
    border = vn.terracotta.clay;
    ink = vn.doPaper.ink;
  }

  ctx.shadowColor = BANNER_SHADOW_COLOR;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = fill;
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerW, bannerH, radius);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
  if (bannerW >= 200) {
    drawBambooJointAccent(
      ctx,
      bannerX + radius + 8,
      bannerY + bannerH - 5,
      bannerX + bannerW - radius - 8,
      bannerY + bannerH - 5,
      3
    );
  }

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    trimmed,
    bannerX + bannerW / 2,
    bannerY + bannerH / 2,
    bannerW - padX
  );
  ctx.restore();
}
