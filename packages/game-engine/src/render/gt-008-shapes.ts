import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type GT008CardAsset,
  type GT008SourceTokenOptions,
  type GT008TargetWellOptions,
  resolveGT008TokenPalette,
  resolveGT008TokenPose,
  resolveGT008WellPopScale,
} from "#src/templates/GT-008/layout";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawStable } from "./craft-shapes.js";
import { drawPlaceholderBox } from "./numeracy-primitives.js";
import {
  detectSlotVisualComparisonCue,
  drawAssetInSlot,
  drawSlotVisualComparisonCue,
  drawTextInSlot,
} from "./shared-render.js";
import type { SceneBox } from "./types.js";

type C2D = CanvasRenderingContext2D;
type Sys = RenderSystem;
type WellOpt = GT008TargetWellOptions;
type TokOpt = GT008SourceTokenOptions;
type Fill = string | CanvasGradient;

const WELL_DASH: readonly number[] = Object.freeze([8, 6]);
const RECEIVE_DASH: readonly number[] = Object.freeze([6, 4]);
const SOLID_DASH: readonly number[] = Object.freeze([]);
const c = designTokens.colors;
const m = c.montessori;
const s = c.semantic.success;

function fillDot(c2d: C2D, x: number, y: number, r: number, f: Fill): void {
  c2d.fillStyle = f;
  c2d.beginPath();
  c2d.arc(x, y, r, 0, Math.PI * 2);
  c2d.fill();
}
function wellDash(staged: boolean, active: boolean): readonly number[] {
  if (staged) {
    return SOLID_DASH;
  }
  return active ? RECEIVE_DASH : WELL_DASH;
}
function drawAura(c2d: C2D, sl: Slot, r: number): void {
  const gen = getContextGeneration(c2d);
  const kind = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;
  const k = Math.round(r);
  let g = getCachedGradient(c2d, gen, kind, k);
  if (!g) {
    g = c2d.createRadialGradient(0, 0, r * 0.25, 0, 0, r);
    g.addColorStop(0, alpha(m.amber, 0.4));
    g.addColorStop(1, alpha(m.amberLight, 0));
    setCachedGradient(c2d, gen, kind, k, g);
  }
  c2d.save();
  c2d.translate(sl.x, sl.y);
  fillDot(c2d, 0, 0, r, g);
  c2d.restore();
}
function drawAudioSpeakerIcon(c2d: C2D, sl: Slot): void {
  const r = Math.max(10, Math.min(sl.w, sl.h) * 0.36);
  const w = Math.max(6, r * 0.55);
  const h = Math.max(8, r * 0.72);
  const lx = sl.x - r * 0.48;
  c2d.fillStyle = c.brand[500];
  c2d.strokeStyle = c.brand[700];
  c2d.lineWidth = 2;
  c2d.beginPath();
  c2d.moveTo(lx, sl.y - h * 0.28);
  c2d.lineTo(lx + w * 0.45, sl.y - h * 0.28);
  c2d.lineTo(lx + w, sl.y - h * 0.58);
  c2d.lineTo(lx + w, sl.y + h * 0.58);
  c2d.lineTo(lx + w * 0.45, sl.y + h * 0.28);
  c2d.lineTo(lx, sl.y + h * 0.28);
  c2d.closePath();
  c2d.fill();
  c2d.stroke();
  c2d.strokeStyle = c.cta[500];
  c2d.lineWidth = 2.2;
  for (const k of [0.34, 0.58]) {
    c2d.beginPath();
    c2d.arc(lx + w * 0.82, sl.y, Math.max(4, r * k), -0.9, 0.9);
    c2d.stroke();
  }
}
function drawItemAsset(
  c2d: C2D,
  sl: Slot,
  a: GT008CardAsset | undefined,
  id: string,
  lbl?: string
): void {
  if (!a) {
    return;
  }
  if (a.kind === "audio") {
    drawAudioSpeakerIcon(c2d, sl);
    return;
  }
  if (a.kind === "text") {
    drawTextInSlot(c2d, a.text, sl);
    return;
  }
  const emoji = a.kind === "emoji" ? a.ref : undefined;
  const cue = detectSlotVisualComparisonCue(lbl, id, emoji);
  if (cue) {
    drawSlotVisualComparisonCue(c2d, sl, cue);
  }
  const sc = cue?.glyphScale ?? 1;
  if (a.kind === "image" || !drawAssetInSlot(c2d, a, sl, sc)) {
    drawPlaceholderBox(c2d, { ...sl, w: sl.w * sc, h: sl.h * sc });
  }
}

interface RBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly r: number;
}

function rbox(x: number, y: number, w: number, h: number, r: number): RBox {
  return { x, y, w, h, r };
}

function fillR(c2d: C2D, b: RBox, fill: Fill, stroke?: string, lw = 2): void {
  c2d.fillStyle = fill;
  c2d.beginPath();
  c2d.roundRect(b.x, b.y, b.w, b.h, b.r);
  c2d.fill();
  if (stroke) {
    c2d.strokeStyle = stroke;
    c2d.lineWidth = lw;
    c2d.stroke();
  }
}

function strokeR(c2d: C2D, b: RBox, stroke: string, lw: number): void {
  c2d.strokeStyle = stroke;
  c2d.lineWidth = lw;
  c2d.beginPath();
  c2d.roundRect(b.x, b.y, b.w, b.h, b.r);
  c2d.stroke();
}

export function drawGT008InsetBoard(c2d: C2D, rs: Sys, box: SceneBox): void {
  if (box.w <= 8 || box.h <= 8) {
    return;
  }
  const lift = Math.min(4, Math.max(2, box.h * 0.03));
  const h = Math.max(8, box.h - lift);
  const r = Math.max(10, Math.min(20, Math.round(Math.min(box.w, h) * 0.14)));
  c2d.save();
  if (rs.softShadowsEnabled) {
    c2d.shadowColor = alpha(m.woodBorder, 0.2);
    c2d.shadowBlur = 10;
    c2d.shadowOffsetY = 3;
  }
  fillR(c2d, rbox(box.x, box.y + lift, box.w, h, r), m.woodBorder);
  c2d.restore();
  c2d.save();
  fillR(c2d, rbox(box.x, box.y, box.w, h, r), c.surface[50], m.woodBevel, 3);
  if (box.w > 24 && h > 24) {
    const ib = rbox(box.x + 4, box.y + 4, box.w - 8, h - 8, Math.max(6, r - 3));
    strokeR(c2d, ib, alpha(c.surface[0], 0.72), 1.5);
  }
  c2d.restore();
}

function drawPlacedWell(c2d: C2D, rs: Sys, sl: Slot, o: WellOpt): void {
  const placed = o.placedItem;
  if (!placed) {
    return;
  }
  const sc = resolveGT008WellPopScale(o.popElapsedMs, rs.reducedMotion);
  const maxR = Math.min(sl.hitW, sl.hitH) / 2 - 2;
  const r = Math.max(12, Math.min(maxR, (Math.min(sl.w, sl.h) / 2) * sc));
  const rad = Math.max(10, Math.round(r * 0.25));
  const w = r * 2;
  const h = r * 2 - 2;
  c2d.save();
  fillR(c2d, rbox(sl.x - r, sl.y - r + 2, w, h, rad), s[600]);
  const top = rbox(sl.x - r, sl.y - r, w, h, rad);
  fillR(c2d, top, s[50], m.emeraldBright, 3);
  const inner: Slot = { ...sl, w: r * 1.65, h: r * 1.65 };
  drawItemAsset(c2d, inner, placed.asset, placed.item_id, placed.label);
  const br = Math.max(8, Math.min(11, Math.round(r * 0.26)));
  const bx = sl.x + r - br - 3;
  const by = sl.y - r + br + 3;
  fillDot(c2d, bx, by, br, s[500]);
  c2d.strokeStyle = c.surface[0];
  c2d.lineWidth = 2;
  c2d.beginPath();
  c2d.moveTo(bx - br * 0.42, by);
  c2d.lineTo(bx - br * 0.08, by + br * 0.36);
  c2d.lineTo(bx + br * 0.46, by - br * 0.34);
  c2d.stroke();
  c2d.restore();
}

export function drawGT008TargetWell(
  c2d: C2D,
  rs: Sys,
  sl: Slot,
  o: WellOpt
): void {
  if (o.placedItem) {
    drawPlacedWell(c2d, rs, sl, o);
    return;
  }
  const r = Math.max(12, Math.min(sl.w, sl.h) / 2);
  const rad = Math.max(10, Math.round(r * 0.25));
  const active = o.isReceiving || o.isStagedTarget || o.isHighlightedEmpty;
  c2d.save();
  if (active) {
    drawAura(c2d, sl, Math.min(sl.hitW, sl.hitH) / 2 - 1);
  }
  const wb = rbox(sl.x - r, sl.y - r, r * 2, r * 2, rad);
  const wf = active ? m.amberGlow : c.surface[100];
  fillR(c2d, wb, wf, alpha(m.woodBorder, 0.28), 2);
  c2d.setLineDash(wellDash(o.isStagedTarget, active));
  const dSz = (r - 3) * 2;
  const db = rbox(sl.x - r + 3, sl.y - r + 3, dSz, dSz, Math.max(8, rad - 2));
  strokeR(c2d, db, o.isStagedTarget ? c.cta[500] : m.amber, active ? 3.2 : 2.5);
  c2d.setLineDash(SOLID_DASH);
  drawStable(c2d, sl, o.breath);
  if (o.expectedItem) {
    c2d.save();
    c2d.globalAlpha = active ? 0.48 : 0.35;
    const exp = o.expectedItem;
    drawItemAsset(c2d, sl, exp.asset, exp.item_id, exp.label);
    c2d.restore();
  }
  if (o.wrongProgress !== null) {
    rs.drawRetryRing(c2d, sl.x, sl.y, r - 2, o.wrongProgress);
  }
  c2d.restore();
}

export function drawGT008SourceToken(
  c2d: C2D,
  rs: Sys,
  sl: Slot,
  o: TokOpt
): void {
  const pal = resolveGT008TokenPalette(o.state);
  const pose = resolveGT008TokenPose(sl.index, o, rs.reducedMotion);
  const maxW = sl.hitW - 4;
  const maxH = sl.hitH - 4;
  const w = Math.max(24, Math.min(maxW, Math.round((sl.w - 6) * pose.scale)));
  const rawH = Math.round((sl.h - 6 - pose.baseLift) * pose.scale);
  const h = Math.max(24, Math.min(maxH - pose.baseLift, rawH));
  const dx = maxW / 2 - w / 2;
  const cx = Math.max(sl.x - dx, Math.min(sl.x + dx, sl.x + pose.offsetX));
  const minY = sl.y - maxH / 2 + h / 2;
  const maxY = sl.y + maxH / 2 - h / 2 - pose.baseLift;
  const cy = Math.max(
    minY,
    Math.min(maxY, sl.y + pose.offsetY - pose.baseLift / 2)
  );
  const rx = cx - w / 2;
  const ry = cy - h / 2;
  const rad = Math.max(8, Math.min(18, Math.round(Math.min(w, h) * 0.24)));
  const inner: Slot = { ...sl, x: cx, y: cy, w: w * 0.78, h: h * 0.78 };
  c2d.save();
  if (o.state === "selected") {
    drawAura(c2d, inner, Math.min(maxW, maxH) / 2);
  }
  c2d.save();
  if (rs.softShadowsEnabled && pose.shadowBlur > 0) {
    c2d.shadowColor = alpha(c.surface[900], 0.14);
    c2d.shadowBlur = pose.shadowBlur;
    c2d.shadowOffsetY = 2;
  }
  fillR(c2d, rbox(rx, ry + pose.baseLift, w, h, rad), pal.base);
  c2d.restore();
  fillR(c2d, rbox(rx, ry, w, h, rad), pal.fill, pal.rim, pal.lineWidth);
  if (pal.innerRim && w > 24 && h > 24) {
    const ib = rbox(rx + 4, ry + 4, w - 8, h - 8, Math.max(6, rad - 2));
    strokeR(c2d, ib, pal.innerRim, 1.5);
  }
  const a = o.assetOverride ?? o.item.asset;
  drawItemAsset(c2d, inner, a, o.item.item_id, o.item.label);
  if (o.state === "wrong" && o.wrongProgress !== null) {
    rs.drawRetryRing(c2d, cx, cy, Math.min(w, h) / 2 - 2, o.wrongProgress);
  }
  c2d.restore();
}
