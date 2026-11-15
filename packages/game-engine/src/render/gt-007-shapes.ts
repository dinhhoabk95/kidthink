import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type GT007PartSocketOptions as PartOpt,
  resolveGT007OptionPose,
  resolveWholeShakeOffset,
  type GT007OptionTokenOptions as TokenOpt,
  type GT007WholeFrameOptions as WholeOpt,
} from "#src/templates/GT-007/layout";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawTextInSlot } from "./shared-render.js";

type Ctx = CanvasRenderingContext2D;
type Fill = string | CanvasGradient;

const COLORS = designTokens.colors;
const WOOD = COLORS.montessori;
const OK_500 = COLORS.semantic.success[500];
const RETRY_500 = COLORS.retry[500];

function fillDisk(ctx: Ctx, cx: number, cy: number, r: number, f: Fill): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = f;
  ctx.fill();
}

function stroke(ctx: Ctx, color: string, lineWidth: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawCheckBadge(ctx: Ctx, cx: number, cy: number, r: number): void {
  fillDisk(ctx, cx, cy, r, OK_500);
  stroke(ctx, COLORS.surface[0], 1.6);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.42, cy + 0.2);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.46, cy - r * 0.32);
  stroke(ctx, COLORS.surface[0], 1.8);
}

function drawSlotAura(ctx: Ctx, cx: number, cy: number, r: number, k: number) {
  const key = Math.round(r) * 100 + k;
  const gen = getContextGeneration(ctx);
  let grad = getCachedGradient(ctx, gen, k, key);
  if (!grad) {
    const isOk = k === PRIMITIVE_GRADIENTS.CONTAINER_AURA;
    const c0 = isOk
      ? alpha(COLORS.semantic.success[300], 0.38)
      : alpha(WOOD.amber, 0.34);
    grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, alpha(WOOD.amberLight, 0));
    setCachedGradient(ctx, gen, k, key, grad);
  }
  ctx.save();
  ctx.translate(cx, cy);
  fillDisk(ctx, 0, 0, r, grad);
  ctx.restore();
}

export function drawGT007BondConnector(
  ctx: Ctx,
  a: Slot,
  b: Slot,
  isFilled: boolean,
  isWon: boolean
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  stroke(ctx, WOOD.woodBorder, 8);
  if (!(isWon || isFilled)) {
    ctx.setLineDash([6, 5]);
  }
  const activeCore = (isWon && COLORS.semantic.success[400]) || WOOD.amber;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  stroke(ctx, isFilled && !isWon ? WOOD.woodTrayHigh : activeCore, 4);
  ctx.restore();
}

export function drawGT007WholeFrame(
  ctx: Ctx,
  rs: RenderSystem,
  s: Slot,
  o: WholeOpt
): void {
  const cx =
    s.x +
    resolveWholeShakeOffset(o.wrongProgress, rs.reducedMotion, s, o.stage);
  const w = Math.max(24, s.w - 4);
  const h = Math.max(24, s.h - 4);
  const isWrong = o.wrongProgress !== null;
  const rim = isWrong ? RETRY_500 : (o.isWon && OK_500) || WOOD.amber;
  ctx.save();
  if (o.isWon) {
    const r = Math.max(12, Math.min(w, h) * 0.46);
    drawSlotAura(ctx, cx, s.y, r, PRIMITIVE_GRADIENTS.CONTAINER_AURA);
  }
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, s.y - h / 2, w, h, o.isTenFrame ? 14 : 16);
  if (!o.isTenFrame) {
    ctx.fillStyle = isWrong ? COLORS.retry[50] : WOOD.amberLight;
    ctx.fill();
  }
  stroke(ctx, rim, o.isTenFrame && !isWrong ? 2.5 : 3.5);
  if (!o.isTenFrame) {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 5, s.y - h / 2 + 5, w - 10, h - 10, 12);
    stroke(ctx, WOOD.woodBorder, 1.8);
    drawTextInSlot(ctx, o.label, { ...s, x: cx });
  }
  if (o.wrongProgress !== null) {
    const ringR = Math.max(10, Math.min(w, h) * 0.42);
    const prog = rs.reducedMotion ? 0.25 : o.wrongProgress;
    rs.drawRetryRing(ctx, cx, s.y, ringR, prog);
  }
  ctx.restore();
}

function drawEmptyPart(ctx: Ctx, s: Slot, w: number, h: number, on: boolean) {
  if (on) {
    const r = Math.max(12, Math.min(w, h) * 0.46);
    drawSlotAura(ctx, s.x, s.y, r, PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA);
  }
  ctx.beginPath();
  ctx.roundRect(s.x - w / 2, s.y - h / 2, w, h, 14);
  ctx.fillStyle = on
    ? alpha(WOOD.amberLight, 0.72)
    : alpha(WOOD.woodBorder, 0.14);
  ctx.fill();
  ctx.setLineDash([6, 4]);
  stroke(ctx, on ? WOOD.amber : WOOD.woodBorder, on ? 3 : 2);
  ctx.setLineDash([]);
  drawTextInSlot(ctx, "?", s, WOOD.woodBorder);
}

function drawNumPart(ctx: Ctx, s: Slot, w: number, h: number, opt: PartOpt) {
  ctx.beginPath();
  ctx.roundRect(s.x - w / 2, s.y - h / 2, w, h, 14);
  const rev = opt.isSolutionReveal && !opt.isFilled;
  if (rev) {
    ctx.setLineDash([5, 4]);
  }
  const baseFill = rev ? WOOD.amberLight : WOOD.woodTray;
  const baseRim = rev ? WOOD.amber : WOOD.woodBorder;
  ctx.fillStyle = opt.isFilled ? COLORS.semantic.success[50] : baseFill;
  ctx.fill();
  stroke(ctx, opt.isFilled ? OK_500 : baseRim, 2.8);
  ctx.setLineDash([]);
  drawTextInSlot(ctx, opt.valueText, s);
}

export function drawGT007PartSocket(ctx: Ctx, slot: Slot, opt: PartOpt): void {
  const scale = Math.min(1, opt.popScale * 0.96);
  const w = Math.max(24, (slot.w - 4) * scale);
  const h = Math.max(24, (slot.h - 4) * scale);
  const x = slot.x - w / 2;
  const y = slot.y - h / 2;
  ctx.save();
  if (opt.isTarget && !opt.isFilled && !opt.isSolutionReveal) {
    drawEmptyPart(ctx, slot, w, h, opt.isHovered || opt.isStagedReady);
    ctx.restore();
    return;
  }
  if (!opt.isTenFrame) {
    drawNumPart(ctx, slot, w, h, opt);
  }
  if (!opt.isTarget) {
    fillDisk(ctx, x + 9, y + 9, 2.5, WOOD.woodBorder);
    fillDisk(ctx, x + w - 9, y + 9, 2.5, WOOD.woodBorder);
  } else if (opt.isFilled) {
    drawCheckBadge(ctx, x + w - 10, y + 10, 7.5);
  }
  ctx.restore();
}

export function drawGT007OptionToken(
  ctx: Ctx,
  rs: RenderSystem,
  s: Slot,
  txt: string,
  o: TokenOpt
): void {
  const maxHalf = Math.max(14, Math.min(s.w, s.h) / 2 - 5);
  ctx.save();
  if (o.state === "locked" || o.state === "correct") {
    fillDisk(ctx, s.x, s.y, maxHalf, alpha(WOOD.woodBorder, 0.16));
    stroke(ctx, alpha(WOOD.woodBorder, 0.36), 2);
    drawCheckBadge(ctx, s.x, s.y, Math.max(7, maxHalf * 0.32));
    ctx.restore();
    return;
  }
  const pose = resolveGT007OptionPose(o, s.index, rs.reducedMotion);
  const baseR = Math.max(12, maxHalf - 3.5);
  const r = Math.min(maxHalf - 0.5, Math.max(11, baseR * pose.scale));
  const cy = s.y + Math.max(-2, Math.min(2, pose.offsetY));
  const isSel = o.state === "selected";
  const isTouch = o.state === "touching";
  const baseY = cy + Math.min(3.5, pose.baseLift);
  fillDisk(ctx, s.x, baseY, r, isSel ? WOOD.amber : WOOD.woodBevel);
  fillDisk(ctx, s.x, cy, r, isSel ? WOOD.amberLight : COLORS.surface[0]);
  const rim = isSel
    ? WOOD.amber
    : (isTouch && COLORS.brand[400]) || WOOD.woodBorder;
  stroke(ctx, rim, isSel || isTouch ? 3.2 : 2.2);
  fillDisk(
    ctx,
    s.x - r * 0.32,
    cy - r * 0.32,
    Math.max(2.5, r * 0.18),
    alpha(COLORS.surface[0], 0.72)
  );
  drawTextInSlot(ctx, txt, { ...s, y: cy });
  ctx.restore();
}

export function drawGT007CandyPlateFrame(
  ctx: Ctx,
  rs: RenderSystem,
  p: Slot,
  wp: number | null,
  status: "idle" | "selected" | "won"
): void {
  const isSel = status === "selected";
  const okRim =
    status === "won" ? OK_500 : (isSel && WOOD.amber) || WOOD.woodBevel;
  const w = Math.max(20, p.w - 8);
  const h = Math.max(20, p.h - 8);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(p.x - p.w / 2 + 4, p.y - p.h / 2 + 4, w, h, 12);
  if (isSel && wp === null) {
    ctx.fillStyle = alpha(WOOD.amberLight, 0.36);
    ctx.fill();
  }
  const lw = wp === null ? (isSel && 3.6) || 2.5 : 3.5;
  stroke(ctx, wp === null ? okRim : RETRY_500, lw);
  if (wp !== null) {
    const r = Math.max(12, Math.min(p.w, p.h) * 0.4);
    rs.drawRetryRing(ctx, p.x, p.y, r, rs.reducedMotion ? 0.25 : wp);
  }
  ctx.restore();
}

const TRAY_RIMS = [COLORS.brand[500], COLORS.cta[500], WOOD.indigo] as const;

export function drawGT007CandyTrayFrame(
  ctx: Ctx,
  tray: Slot,
  trayIndex: number,
  locked: boolean,
  status: "idle" | "active" | "done"
): void {
  const baseRim = TRAY_RIMS[trayIndex % TRAY_RIMS.length] ?? TRAY_RIMS[0];
  const isDone = status === "done";
  const isAct = status === "active";
  const rim = isDone ? OK_500 : baseRim;
  const x = tray.x - tray.w / 2 + 4;
  const y = tray.y - tray.h / 2 + 4;
  const w = Math.max(20, tray.w - 8);
  const h = Math.max(20, tray.h - 8);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  if (isAct) {
    ctx.fillStyle = alpha(WOOD.amberLight, 0.32);
    ctx.fill();
    ctx.setLineDash([7, 4]);
  }
  stroke(ctx, rim, isAct ? 3.6 : 2.2);
  ctx.setLineDash([]);
  for (let d = 0; d < Math.min(3, trayIndex + 1); d++) {
    fillDisk(ctx, x + 10 + d * 7, y + 9, 2.4, rim);
  }
  if (locked) {
    fillDisk(ctx, x + w - 10, y + 10, 4.5, COLORS.surface[500]);
  } else if (isDone) {
    drawCheckBadge(ctx, x + w - 11, y + 11, 7.5);
  }
  ctx.restore();
}
