import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type GT009AttrPred,
  type GT009CandidateOverlayOptions,
  type GT009ClueCardOptions,
  type GT009NumPred,
  resolveGT009AttrColor,
  resolveGT009AttrIconKind,
  resolveGT009ClueScaleX,
} from "#src/templates/GT-009/layout";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";
import type { SceneBox } from "./types.js";

type C2D = CanvasRenderingContext2D;
type Sys = RenderSystem;
type Fill = string | CanvasGradient;
type RBox = SceneBox & { readonly r: number };
type ClueOpt = GT009ClueCardOptions;
type CandOpt = GT009CandidateOverlayOptions;

const STITCH_DASH: readonly number[] = Object.freeze([5, 4]);
const ELIM_DASH: readonly number[] = Object.freeze([6, 4]);
const SOLID_DASH: readonly number[] = Object.freeze([]);
const c = designTokens.colors;
const m = c.montessori;
const s = c.semantic.success;

function rbox(x: number, y: number, w: number, h: number, r: number): RBox {
  return { x, y, w, h, r };
}

function seg(g: C2D, x1: number, y1: number, x2: number, y2: number): void {
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
}

function dot(g: C2D, x: number, y: number, r: number, f: Fill, sc = ""): void {
  g.fillStyle = f;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  if (sc) {
    g.strokeStyle = sc;
    g.lineWidth = 1.9;
    g.stroke();
  }
}

function fillR(g: C2D, b: RBox, fill: Fill, stroke?: string, lw = 2): void {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(b.x, b.y, b.w, b.h, b.r);
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}

function strokeR(g: C2D, b: RBox, sc: string, lw = 2.4, d = SOLID_DASH): void {
  g.setLineDash(d);
  g.strokeStyle = sc;
  g.lineWidth = lw;
  g.beginPath();
  g.roundRect(b.x, b.y, b.w, b.h, b.r);
  g.stroke();
  g.setLineDash(SOLID_DASH);
}

function drawAura(g: C2D, sl: Slot, r: number): void {
  const safeR = Math.max(8, r);
  const gen = getContextGeneration(g);
  const kind = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;
  const k = Math.round(safeR);
  let gr = getCachedGradient(g, gen, kind, k);
  if (!gr) {
    gr = g.createRadialGradient(0, 0, safeR * 0.25, 0, 0, safeR);
    gr.addColorStop(0, alpha(m.amber, 0.42));
    gr.addColorStop(1, alpha(m.amberLight, 0));
    setCachedGradient(g, gen, kind, k, gr);
  }
  g.save();
  g.translate(sl.x, sl.y);
  dot(g, 0, 0, safeR, gr);
  g.restore();
}

export function drawGT009DetectiveBackdrop(
  g: C2D,
  cb: SceneBox,
  bb: SceneBox
): void {
  if (cb.w > 12 && cb.h > 12) {
    const h = Math.max(8, cb.h - 3);
    const r = Math.max(10, Math.min(18, Math.round(h * 0.18)));
    fillR(g, rbox(cb.x, cb.y + 3, cb.w, h, r), m.woodBorder);
    fillR(g, rbox(cb.x, cb.y, cb.w, h, r), m.plateLight, m.woodBevel, 2.6);
    if (cb.w > 28) {
      dot(g, cb.x + 12, cb.y + 8, 3.2, m.amber);
      dot(g, cb.x + cb.w - 12, cb.y + 8, 3.2, m.amber);
    }
  }
  if (bb.w > 12 && bb.h > 12) {
    const h = Math.max(8, bb.h - 3);
    const r = Math.max(12, Math.min(20, Math.round(h * 0.12)));
    fillR(g, rbox(bb.x, bb.y + 3, bb.w, h, r), m.woodBorder);
    fillR(g, rbox(bb.x, bb.y, bb.w, h, r), c.surface[50], m.woodBevel, 2.8);
  }
}

function badge(g: C2D, x: number, y: number, r: number, ok: boolean): void {
  dot(g, x, y, r, ok ? s[500] : c.cta[500], c.surface[0]);
  g.beginPath();
  if (ok) {
    seg(g, x - r * 0.42, y, x - r * 0.08, y + r * 0.36);
    g.lineTo(x + r * 0.44, y - r * 0.34);
  } else {
    seg(g, x - r * 0.38, y - r * 0.38, x + r * 0.38, y + r * 0.38);
    seg(g, x + r * 0.38, y - r * 0.38, x - r * 0.38, y + r * 0.38);
  }
  g.stroke();
}

function drawAttr(g: C2D, b: RBox, p: GT009AttrPred): void {
  const cy = b.y + 1;
  const ir = Math.max(6, Math.min(12, Math.min(b.w * 0.22, b.h * 0.3)));
  const lx = b.x - b.w * 0.16;
  const kind = resolveGT009AttrIconKind(p.key, p.attr_value);
  const col = resolveGT009AttrColor(`${p.key}:${p.attr_value}`);
  if (kind === "tree") {
    fillR(g, rbox(lx - ir * 0.2, cy, ir * 0.4, ir * 0.85, 2), m.woodBorder);
    dot(g, lx, cy - ir * 0.2, ir * 0.78, m.emerald);
  } else if (kind === "wave") {
    const wr = ir * 0.36;
    g.strokeStyle = c.brand[500];
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(lx - wr, cy - wr * 0.7, wr, Math.PI, 0);
    g.arc(lx + wr, cy - wr * 0.7, wr, Math.PI, 0, true);
    g.moveTo(lx - wr * 2, cy + wr * 0.7);
    g.arc(lx - wr, cy + wr * 0.7, wr, Math.PI, 0);
    g.arc(lx + wr, cy + wr * 0.7, wr, Math.PI, 0, true);
    g.stroke();
  } else if (kind === "car") {
    fillR(g, rbox(lx - ir * 0.9, cy - ir * 0.4, ir * 1.8, ir * 0.7, 3), col);
    dot(g, lx - ir * 0.48, cy + ir * 0.38, ir * 0.28, c.surface[800]);
    dot(g, lx + ir * 0.48, cy + ir * 0.38, ir * 0.28, c.surface[800]);
  } else if (kind === "triangle") {
    g.fillStyle = col;
    g.beginPath();
    seg(g, lx, cy - ir * 0.85, lx + ir * 0.85, cy + ir * 0.7);
    g.lineTo(lx - ir * 0.85, cy + ir * 0.7);
    g.closePath();
    g.fill();
  } else if (kind === "square") {
    fillR(g, rbox(lx - ir * 0.7, cy - ir * 0.7, ir * 1.4, ir * 1.4, 3), col);
  } else {
    dot(g, lx, cy, ir, col, c.surface[0]);
  }
  const br = Math.max(6, Math.min(10, Math.min(b.w * 0.18, b.h * 0.26)));
  badge(g, b.x + b.w * 0.2, cy, br, p.kind === "has_attribute");
}

function drawNum(g: C2D, rs: Sys, b: RBox, p: GT009NumPred): void {
  const cy = b.y + 1;
  const raw = Math.min(26, Math.round(b.h * 0.44));
  applyCanvasFontAtSize(g, legibleFontPx(raw, rs.viewport?.scale), "sans", 700);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = c.surface[800];
  const ar = Math.max(5, Math.min(9, Math.min(b.w * 0.14, b.h * 0.22)));
  if (p.kind === "between") {
    g.fillText(String(p.min), b.x - b.w * 0.26, cy);
    g.fillText(String(p.max), b.x + b.w * 0.26, cy);
    const ah = ar * 0.42;
    g.strokeStyle = c.brand[600];
    g.lineWidth = 2.2;
    g.beginPath();
    seg(g, b.x - ar, cy, b.x + ar, cy);
    seg(g, b.x - ar + ah, cy - ah, b.x - ar, cy);
    g.lineTo(b.x - ar + ah, cy + ah);
    seg(g, b.x + ar - ah, cy - ah, b.x + ar, cy);
    g.lineTo(b.x + ar - ah, cy + ah);
    g.stroke();
    return;
  }
  const lx = b.x - b.w * 0.2;
  g.fillText(String(p.value), b.x + b.w * 0.15, cy);
  g.lineWidth = 2.4;
  g.lineCap = "round";
  g.beginPath();
  if (p.kind === "greater_than" || p.kind === "less_than") {
    const dir = p.kind === "greater_than" ? -1 : 1;
    g.strokeStyle = dir < 0 ? s[600] : c.brand[600];
    seg(g, lx, cy - dir * ar, lx, cy + dir * ar);
    g.lineTo(lx - ar * 0.6, cy + dir * ar * 0.25);
    seg(g, lx, cy + dir * ar, lx + ar * 0.6, cy + dir * ar * 0.25);
  } else {
    g.strokeStyle = c.cta[600];
    g.arc(lx, cy, ar, 0, Math.PI * 2);
    seg(g, lx - ar * 0.7, cy + ar * 0.7, lx + ar * 0.7, cy - ar * 0.7);
  }
  g.stroke();
}

function drawSealed(g: C2D, sl: Slot, o: ClueOpt): void {
  const act = o.isHinted || o.isViolatedSpotlight;
  const dy = o.isHovered ? -1.5 : 0;
  const w = Math.max(24, sl.w - 4);
  const h = Math.max(20, sl.h - 4);
  const rad = Math.max(8, Math.round(Math.min(w, h) * 0.2));
  fillR(g, rbox(sl.x - w / 2, sl.y + dy - h / 2 + 3, w, h, rad), m.woodBorder);
  const fill = o.isHovered || act ? m.amberGlow : m.amberLight;
  const tb = rbox(sl.x - w / 2, sl.y + dy - h / 2, w, h, rad);
  fillR(g, tb, fill, act ? c.cta[500] : m.amber, act ? 3.2 : 2.4);
  const mr = Math.max(5, Math.min(10, Math.min(w, h) * 0.2));
  const cy = sl.y + dy;
  dot(g, sl.x, cy, mr, m.paper, c.brand[600]);
  g.beginPath();
  seg(g, sl.x + mr * 0.7, cy + mr * 0.7, sl.x + mr * 1.45, cy + mr * 1.45);
  g.stroke();
}

export function drawGT009ClueCard(g: C2D, rs: Sys, sl: Slot, o: ClueOpt): void {
  g.save();
  if (o.isHinted || o.isViolatedSpotlight) {
    drawAura(g, sl, Math.min(sl.hitW, sl.hitH) / 2 - 2);
  }
  if (!o.revealed) {
    drawSealed(g, sl, o);
    g.restore();
    return;
  }
  const scX = resolveGT009ClueScaleX(o.revealElapsedMs, rs.reducedMotion);
  const w = Math.max(8, (sl.w - 4) * scX);
  const h = Math.max(20, sl.h - 4);
  const rad = Math.max(8, Math.round(Math.min(sl.w, h) * 0.2));
  const v = o.isViolatedSpotlight;
  const bb = rbox(sl.x - w / 2, sl.y - h / 2 + 2.5, w, h, rad);
  fillR(g, bb, v ? c.cta[600] : s[600]);
  const tb = rbox(sl.x - w / 2, sl.y - h / 2, w, h, rad);
  fillR(g, tb, m.paper, v ? c.cta[500] : m.emerald, v ? 3.5 : 3);
  dot(g, sl.x, sl.y - h / 2 + 4.5, 2.6, m.emeraldBright);
  if (scX > 0.38) {
    const cb = rbox(sl.x, sl.y, w, h, rad);
    const p = o.clue.predicate;
    if (p.kind === "has_attribute" || p.kind === "not_attribute") {
      drawAttr(g, cb, p);
    } else {
      drawNum(g, rs, cb, p);
    }
  }
  g.restore();
}

export function drawGT009CandidateOverlay(g: C2D, rs: Sys, o: CandOpt): void {
  const { slot: sl, drawSlot: ds } = o;
  const r = Math.min(ds.w, ds.h) / 2;
  const box = rbox(ds.x - r, ds.y - r, r * 2, r * 2, Math.max(8, r * 0.28));
  g.save();
  if (o.isHovered || o.isHinted) {
    drawAura(g, sl, Math.min(sl.hitW, sl.hitH) / 2 - 2);
  }
  if (o.state === "correct") {
    strokeR(g, box, m.emerald, 3.5);
    const br = Math.max(6, Math.min(9, r * 0.24));
    badge(g, box.x + box.w - br - 2, box.y + br + 2, br, true);
  } else if (o.eliminated) {
    fillR(g, box, alpha(m.paper, 0.44));
    strokeR(g, box, m.woodBorder, 2.2, ELIM_DASH);
    const d = r * 0.56;
    g.lineCap = "round";
    g.strokeStyle = c.cta[600];
    g.lineWidth = 4.2;
    g.beginPath();
    seg(g, ds.x - d, ds.y - d, ds.x + d, ds.y + d);
    seg(g, ds.x + d, ds.y - d, ds.x - d, ds.y + d);
    g.stroke();
    dot(g, ds.x, ds.y, 4, c.cta[500]);
  } else if (o.isTouching) {
    strokeR(g, box, m.amber, 3.2);
  } else if (o.isHintDimmed) {
    strokeR(g, box, m.amber, 2.4, STITCH_DASH);
  }
  if (o.state === "wrong" && o.wrongProgress !== null) {
    rs.drawRetryRing(g, ds.x, ds.y, Math.max(10, r - 2), o.wrongProgress);
  }
  g.restore();
}
