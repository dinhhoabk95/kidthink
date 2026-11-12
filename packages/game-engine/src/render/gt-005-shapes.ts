import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  resolveGT005CardPalette,
  resolveGT005CardPose,
} from "#src/templates/GT-005/layout";
import {
  computeGT005CardBox,
  computeGT005MatchedCurve,
  computeGT005PreviewCurve,
  type GT005CardAnchor,
  type GT005CardBox,
  type GT005CardPalette,
  type GT005CardPose,
  type GT005PairCardOptions,
  type GT005RopeCurve,
} from "#src/templates/GT-005/pair-columns";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawPlaceholderBox } from "./numeracy-primitives.js";
import { drawAssetInSlot, drawTextInSlot } from "./shared-render.js";
import {
  detectSlotVisualComparisonCue,
  drawSlotVisualComparisonCue,
} from "./slot-decor.js";

const PREVIEW_DASH: readonly number[] = Object.freeze([9, 6]);
const SOLID_DASH: readonly number[] = Object.freeze([]);

function traceCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

function strokeRopeCurve(
  ctx: CanvasRenderingContext2D,
  c: GT005RopeCurve,
  dy: number
): void {
  ctx.beginPath();
  ctx.moveTo(c.p1.x, c.p1.y + dy);
  ctx.quadraticCurveTo(c.ctrl.x, c.ctrl.y + dy, c.p2.x, c.p2.y + dy);
  ctx.stroke();
}

function drawSelectedAura(
  ctx: CanvasRenderingContext2D,
  box: GT005CardBox
): void {
  const gen = getContextGeneration(ctx);
  const kind = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;
  let grad = getCachedGradient(ctx, gen, kind, box.slotIndex);
  if (!grad) {
    grad = ctx.createRadialGradient(
      box.cx,
      box.cy,
      box.auraR * 0.25,
      box.cx,
      box.cy,
      box.auraR
    );
    grad.addColorStop(0, alpha(designTokens.colors.montessori.amber, 0.42));
    grad.addColorStop(1, alpha(designTokens.colors.montessori.amberLight, 0));
    setCachedGradient(ctx, gen, kind, box.slotIndex, grad);
  }
  ctx.save();
  ctx.fillStyle = grad;
  traceCircle(ctx, box.cx, box.cy, box.auraR);
  ctx.fill();
  ctx.restore();
}

function drawAudioSpeakerIcon(ctx: CanvasRenderingContext2D, s: Slot): void {
  const r = Math.max(10, Math.min(s.w, s.h) * 0.36);
  const w = Math.max(6, r * 0.55);
  const h = Math.max(8, r * 0.72);
  const lx = s.x - r * 0.48;
  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[500];
  ctx.strokeStyle = designTokens.colors.brand[700];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx, s.y - h * 0.28);
  ctx.lineTo(lx + w * 0.45, s.y - h * 0.28);
  ctx.lineTo(lx + w, s.y - h * 0.58);
  ctx.lineTo(lx + w, s.y + h * 0.58);
  ctx.lineTo(lx + w * 0.45, s.y + h * 0.28);
  ctx.lineTo(lx, s.y + h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = designTokens.colors.cta[500];
  ctx.lineWidth = 2.2;
  for (const ratio of [0.34, 0.58]) {
    ctx.beginPath();
    ctx.arc(lx + w * 0.82, s.y, Math.max(4, r * ratio), -0.9, 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCardAssetContent(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  opt: GT005PairCardOptions
): void {
  const { asset, id } = opt;
  if (asset.kind === "audio") {
    drawAudioSpeakerIcon(ctx, slot);
    return;
  }
  if (asset.kind === "text") {
    drawTextInSlot(ctx, asset.text, slot);
    return;
  }
  const emoji = asset.kind === "emoji" ? asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(undefined, id, emoji);
  if (cue) {
    drawSlotVisualComparisonCue(ctx, slot, cue);
  }
  if (!drawAssetInSlot(ctx, asset, slot, cue?.glyphScale ?? 1)) {
    drawPlaceholderBox(ctx, slot);
  }
}

function drawCardShell(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: GT005CardBox,
  pal: GT005CardPalette,
  pose: GT005CardPose,
  accent: string | null
): void {
  ctx.save();
  if (rs.softShadowsEnabled && pose.shadowBlur > 0) {
    ctx.shadowColor = alpha(designTokens.colors.surface[900], 0.14);
    ctx.shadowBlur = pose.shadowBlur;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillStyle = accent ?? pal.base;
  ctx.beginPath();
  ctx.roundRect(box.rx, box.ry + pose.baseLift, box.w, box.h, box.r);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = pal.fill;
  ctx.strokeStyle = accent ?? pal.rim;
  ctx.lineWidth = pal.lineWidth;
  ctx.beginPath();
  ctx.roundRect(box.rx, box.ry, box.w, box.h, box.r);
  ctx.fill();
  ctx.stroke();

  if (pal.innerRim && box.w > 20 && box.h > 20) {
    ctx.strokeStyle = pal.innerRim;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(box.rx + 4, box.ry + 4, box.w - 8, box.h - 8, box.r - 2);
    ctx.stroke();
  }
}

function drawCardDecorations(
  ctx: CanvasRenderingContext2D,
  box: GT005CardBox,
  opt: GT005PairCardOptions
): void {
  const c = designTokens.colors;
  const fallbackPeg =
    opt.state === "selected" ? c.montessori.amber : c.montessori.woodBevel;
  ctx.fillStyle = opt.accentColor ?? fallbackPeg;
  ctx.strokeStyle = c.montessori.woodBorder;
  ctx.lineWidth = 1.5;
  traceCircle(ctx, box.pegX, box.pegY, 4);
  ctx.fill();
  ctx.stroke();

  if (opt.state === "correct") {
    const { badgeX: bx, badgeY: by, badgeR: br } = box;
    ctx.fillStyle = opt.accentColor ?? c.semantic.success[500];
    traceCircle(ctx, bx, by, br);
    ctx.fill();
    ctx.strokeStyle = c.surface[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - br * 0.42, by);
    ctx.lineTo(bx - br * 0.08, by + br * 0.36);
    ctx.lineTo(bx + br * 0.46, by - br * 0.34);
    ctx.stroke();
  }
}

export function drawGT005PairCard(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  opt: GT005PairCardOptions
): void {
  const pal = resolveGT005CardPalette(opt.state);
  const pose = resolveGT005CardPose({
    ...opt,
    slotIndex: slot.index,
    reducedMotion: rs.reducedMotion,
  });
  const box = computeGT005CardBox(slot, pose, opt.anchorSide, opt.stageRect);

  ctx.save();
  if (opt.state === "selected") {
    drawSelectedAura(ctx, box);
  }
  drawCardShell(ctx, rs, box, pal, pose, opt.accentColor);
  drawCardAssetContent(ctx, box.innerSlot, opt);
  drawCardDecorations(ctx, box, opt);
  if (opt.state === "wrong") {
    const prog = rs.reducedMotion ? 0.25 : (opt.wrongProgress ?? 0.25);
    rs.drawRetryRing(ctx, box.cx, box.cy, box.ringR, prog);
  }
  ctx.restore();
}

export function drawGT005MatchedRope(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  from: GT005CardAnchor,
  to: GT005CardAnchor,
  st: ZoneRect | undefined,
  accentColor: string,
  elapsedMs: number
): void {
  const curve = computeGT005MatchedCurve(
    from,
    to,
    st,
    elapsedMs,
    rs.reducedMotion
  );
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = alpha(designTokens.colors.surface[900], 0.14);
  ctx.lineWidth = 5.5;
  strokeRopeCurve(ctx, curve, 1.5);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3.8;
  strokeRopeCurve(ctx, curve, 0);

  for (const pt of [curve.p1, curve.p2]) {
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = designTokens.colors.surface[0];
    ctx.lineWidth = 1.8;
    traceCircle(ctx, pt.x, pt.y, 5.2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGT005PreviewRope(
  ctx: CanvasRenderingContext2D,
  from: GT005CardAnchor,
  to: { readonly x: number; readonly y: number },
  st: ZoneRect | undefined,
  isTargetHovered: boolean
): void {
  const curve = computeGT005PreviewCurve(from, to, st);
  if (curve.dist < 10) {
    return;
  }
  const col = isTargetHovered
    ? designTokens.colors.cta[500]
    : designTokens.colors.montessori.amber;

  ctx.save();
  ctx.strokeStyle = alpha(col, 0.88);
  ctx.lineWidth = isTargetHovered ? 4 : 3.2;
  ctx.lineCap = "round";
  ctx.setLineDash(isTargetHovered ? SOLID_DASH : PREVIEW_DASH);
  strokeRopeCurve(ctx, curve, 0);

  ctx.setLineDash(SOLID_DASH);
  ctx.fillStyle = col;
  traceCircle(ctx, curve.p1.x, curve.p1.y, 4.5);
  ctx.fill();
  traceCircle(ctx, curve.p2.x, curve.p2.y, isTargetHovered ? 5.5 : 4.5);
  ctx.fill();
  ctx.restore();
}
