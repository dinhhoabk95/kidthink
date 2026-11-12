import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { resolveGT006CardSpec } from "#src/templates/GT-006/layout";
import {
  computeGT006BannerSpan,
  computeGT006CouplerSegments,
  computeGT006SolutionSlots,
  computeGT006SwapArc,
  type GT006CardAsset,
  type GT006CardBox,
  type GT006StepCardOptions,
  type GT006StepItem,
} from "#src/templates/GT-006/stage-strip";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawPlaceholderBox } from "./numeracy-primitives.js";
import {
  detectSlotVisualComparisonCue,
  drawAssetInSlot,
  drawSlotLabel,
  drawSlotVisualComparisonCue,
  drawTextInSlot,
} from "./shared-render.js";
import { applyCanvasFont } from "./type-scale.js";

type C2D = CanvasRenderingContext2D;
type Sys = RenderSystem;
type Slots = readonly Slot[];
type Opt = GT006StepCardOptions;
type Steps = readonly GT006StepItem[];
type ZR = ZoneRect;
type Fill = string | CanvasGradient;
type A = GT006CardAsset;
interface Pt {
  readonly x: number;
  readonly y: number;
}

const PREVIEW_DASH: readonly number[] = Object.freeze([8, 6]);
const RECEIVE_DASH: readonly number[] = Object.freeze([6, 4]);
const SOLID_DASH: readonly number[] = Object.freeze([]);
const c = designTokens.colors;

function fillDot(c2d: C2D, x: number, y: number, r: number, f: Fill): void {
  c2d.fillStyle = f;
  c2d.beginPath();
  c2d.arc(x, y, r, 0, Math.PI * 2);
  c2d.fill();
}
function drawSelectedAura(c2d: C2D, b: GT006CardBox): void {
  const gen = getContextGeneration(c2d);
  const kind = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;
  let g = getCachedGradient(c2d, gen, kind, b.slotIndex);
  if (!g) {
    const r0 = b.auraR * 0.25;
    g = c2d.createRadialGradient(b.cx, b.cy, r0, b.cx, b.cy, b.auraR);
    g.addColorStop(0, alpha(c.montessori.amber, 0.42));
    g.addColorStop(1, alpha(c.montessori.amberLight, 0));
    setCachedGradient(c2d, gen, kind, b.slotIndex, g);
  }
  fillDot(c2d, b.cx, b.cy, b.auraR, g);
}
function drawAudioSpeakerIcon(c2d: C2D, s: Slot): void {
  const r = Math.max(10, Math.min(s.w, s.h) * 0.36);
  const w = Math.max(6, r * 0.55);
  const h = Math.max(8, r * 0.72);
  const lx = s.x - r * 0.48;
  c2d.fillStyle = c.brand[500];
  c2d.strokeStyle = c.brand[700];
  c2d.lineWidth = 2;
  c2d.beginPath();
  c2d.moveTo(lx, s.y - h * 0.28);
  c2d.lineTo(lx + w * 0.45, s.y - h * 0.28);
  c2d.lineTo(lx + w, s.y - h * 0.58);
  c2d.lineTo(lx + w, s.y + h * 0.58);
  c2d.lineTo(lx + w * 0.45, s.y + h * 0.28);
  c2d.lineTo(lx, s.y + h * 0.28);
  c2d.closePath();
  c2d.fill();
  c2d.stroke();
  c2d.strokeStyle = c.cta[500];
  c2d.lineWidth = 2.2;
  for (const k of [0.34, 0.58]) {
    c2d.beginPath();
    c2d.arc(lx + w * 0.82, s.y, Math.max(4, r * k), -0.9, 0.9);
    c2d.stroke();
  }
}
function drawCardAsset(c2d: C2D, s: Slot, a: A, id: string, l?: string): void {
  if (a.kind === "audio") {
    drawAudioSpeakerIcon(c2d, s);
    return;
  }
  if (a.kind === "text") {
    drawTextInSlot(c2d, a.text, s);
    return;
  }
  const emoji = a.kind === "emoji" ? a.ref : undefined;
  const cue = detectSlotVisualComparisonCue(l, id, emoji);
  if (cue) {
    drawSlotVisualComparisonCue(c2d, s, cue);
  }
  const sc = cue?.glyphScale ?? 1;
  if (a.kind === "image" || !drawAssetInSlot(c2d, a, s, sc)) {
    drawPlaceholderBox(c2d, { ...s, w: s.w * sc, h: s.h * sc });
  }
}
function drawCardShell(c2d: C2D, rs: Sys, s: Slot, o: Opt): GT006CardBox {
  const { pal, pose, b } = resolveGT006CardSpec(s, o, rs.reducedMotion);
  if (o.state === "selected") {
    drawSelectedAura(c2d, b);
  }
  c2d.save();
  if (rs.softShadowsEnabled && pose.shadowBlur > 0) {
    c2d.shadowColor = alpha(c.surface[900], 0.14);
    c2d.shadowBlur = pose.shadowBlur;
    c2d.shadowOffsetY = 2;
  }
  c2d.fillStyle = pal.base;
  c2d.beginPath();
  c2d.roundRect(b.rx, b.ry + pose.baseLift, b.w, b.h, b.r);
  c2d.fill();
  c2d.restore();
  c2d.fillStyle = pal.fill;
  c2d.strokeStyle = pal.rim;
  c2d.lineWidth = pal.lineWidth;
  c2d.setLineDash(pal.dashed ? RECEIVE_DASH : SOLID_DASH);
  c2d.beginPath();
  c2d.roundRect(b.rx, b.ry, b.w, b.h, b.r);
  c2d.fill();
  c2d.stroke();
  c2d.setLineDash(SOLID_DASH);
  if (pal.innerRim && b.w > 24 && b.h > 24) {
    c2d.strokeStyle = pal.innerRim;
    c2d.lineWidth = 1.6;
    c2d.beginPath();
    c2d.roundRect(b.rx + 4, b.ry + 4, b.w - 8, b.h - 8, b.r - 2);
    c2d.stroke();
  }
  if (b.w >= 44 && b.h >= 40) {
    c2d.fillStyle = alpha(c.montessori.woodBorder, 0.28);
    for (const k of [0.28, 0.5, 0.72]) {
      const hy = b.ry + b.h * k - 2;
      c2d.fillRect(b.rx + 3, hy, 3, 4);
      c2d.fillRect(b.rx + b.w - 6, hy, 3, 4);
    }
  }
  return b;
}

export function drawGT006StepCard(c2d: C2D, rs: Sys, s: Slot, o: Opt): void {
  c2d.save();
  const b = drawCardShell(c2d, rs, s, o);
  drawCardAsset(c2d, b.innerSlot, o.asset, o.id, o.label);
  fillDot(c2d, b.badgeX, b.badgeY, b.badgeR, c.montessori.amberLight);
  c2d.strokeStyle = c.montessori.amberDark;
  c2d.lineWidth = 1.5;
  c2d.stroke();
  applyCanvasFont(
    c2d,
    "badge",
    rs.logicSpace,
    rs.viewport?.scale,
    "heading",
    "bold"
  );
  c2d.fillStyle = c.montessori.amberDark;
  c2d.textAlign = "center";
  c2d.textBaseline = "middle";
  c2d.fillText(String(o.slotOrderNumber), b.badgeX, b.badgeY, b.badgeR * 1.75);
  if (o.state === "correct") {
    const { checkX: cx, checkY: cy, checkR: cr } = b;
    fillDot(c2d, cx, cy, cr, c.semantic.success[500]);
    c2d.strokeStyle = c.surface[0];
    c2d.lineWidth = 2;
    c2d.beginPath();
    c2d.moveTo(cx - cr * 0.42, cy);
    c2d.lineTo(cx - cr * 0.08, cy + cr * 0.36);
    c2d.lineTo(cx + cr * 0.46, cy - cr * 0.34);
    c2d.stroke();
  }
  if (o.state === "wrong") {
    const prog = rs.reducedMotion ? 0.25 : (o.wrongProgress ?? 0.25);
    rs.drawRetryRing(c2d, b.cx, b.cy, b.ringR, prog);
  }
  if (o.label) {
    drawSlotLabel(c2d, o.label, s, rs);
  }
  c2d.restore();
}

export function drawGT006DirectionBanner(
  c2d: C2D,
  sl: Slots,
  st?: ZR,
  won = false
): void {
  const span = computeGT006BannerSpan(sl, st);
  if (!span) {
    return;
  }
  const col = won ? c.semantic.success[500] : c.montessori.amberDark;
  c2d.save();
  c2d.strokeStyle = alpha(col, 0.55);
  c2d.fillStyle = alpha(col, 0.75);
  c2d.lineWidth = 2.2;
  c2d.beginPath();
  c2d.moveTo(span.x1, span.y);
  c2d.lineTo(span.x2 - 6, span.y);
  c2d.stroke();
  c2d.beginPath();
  c2d.moveTo(span.x2, span.y);
  c2d.lineTo(span.x2 - 8, span.y - 4);
  c2d.lineTo(span.x2 - 8, span.y + 4);
  c2d.closePath();
  c2d.fill();
  c2d.restore();
}

export function drawGT006TrackCouplers(c2d: C2D, sl: Slots, won = false): void {
  const fill = won ? c.semantic.success[400] : c.montessori.woodBevel;
  c2d.save();
  c2d.strokeStyle = won ? c.semantic.success[500] : c.montessori.woodBorder;
  c2d.lineWidth = 3;
  for (const seg of computeGT006CouplerSegments(sl)) {
    c2d.beginPath();
    c2d.moveTo(seg.x1, seg.y);
    c2d.lineTo(seg.x2, seg.y);
    c2d.stroke();
    fillDot(c2d, seg.x1, seg.y, 3.2, fill);
    fillDot(c2d, seg.x2, seg.y, 3.2, fill);
  }
  c2d.restore();
}

export function drawGT006SwapPreviewArc(
  c2d: C2D,
  p1: Pt,
  p2: Pt,
  st?: ZR,
  hov = false
): void {
  const arc = computeGT006SwapArc(p1, p2, st);
  if (arc.dist < 8) {
    return;
  }
  const col = hov ? c.cta[500] : c.montessori.amber;
  c2d.save();
  c2d.strokeStyle = alpha(col, 0.88);
  c2d.lineWidth = hov ? 3.8 : 3;
  c2d.lineCap = "round";
  c2d.setLineDash(hov ? SOLID_DASH : PREVIEW_DASH);
  c2d.beginPath();
  c2d.moveTo(arc.p1.x, arc.p1.y);
  c2d.quadraticCurveTo(arc.ctrl.x, arc.ctrl.y, arc.p2.x, arc.p2.y);
  c2d.stroke();
  c2d.setLineDash(SOLID_DASH);
  fillDot(c2d, arc.p1.x, arc.p1.y, 4, col);
  fillDot(c2d, arc.p2.x, arc.p2.y, hov ? 5 : 4, col);
  c2d.restore();
}

export function drawGT006SolutionStrip(
  c2d: C2D,
  steps: Steps,
  sl: Slots,
  st?: ZR
): void {
  const mini = computeGT006SolutionSlots(steps.length, sl, st);
  if (mini.length === 0) {
    return;
  }
  c2d.save();
  for (let i = 0; i < mini.length; i++) {
    const ms = mini[i];
    const stp = steps[i];
    if (!(ms && stp)) {
      continue;
    }
    c2d.fillStyle = c.semantic.success[50];
    c2d.strokeStyle = c.semantic.success[500];
    c2d.lineWidth = 2;
    c2d.beginPath();
    c2d.roundRect(ms.x - ms.w / 2, ms.y - ms.h / 2, ms.w, ms.h, 8);
    c2d.fill();
    c2d.stroke();
    const inner = { ...ms, w: ms.w * 0.78, h: ms.h * 0.78 };
    drawCardAsset(c2d, inner, stp.asset, stp.step_id, stp.label);
  }
  c2d.restore();
}
