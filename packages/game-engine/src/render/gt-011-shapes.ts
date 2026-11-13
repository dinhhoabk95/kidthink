import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { boxFromSlots } from "./shared-render-shapes.js";
import { drawCheckMark } from "./slot-decor.js";
import type { ItemVisualState } from "./types.js";

const cl = designTokens.colors;
const m = cl.montessori;
const DASH_SOCKET: readonly number[] = [7, 5];
const DASH_WRONG: readonly number[] = [6, 4];
const DASH_GUIDE: readonly number[] = [5, 4];
const SOLID_DASH: readonly number[] = [];
const BF = [cl.brand[500], cl.cta[500], m.emerald, m.amber, cl.brand[700]];
const POLY_SIDES: readonly number[] = [0, 3, 0, 4, 5, 0];
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;

export interface GT011InspectRenderState {
  readonly slotIndex: number;
  readonly progress: number;
}
export interface GT011GridContext {
  readonly cellSlots: readonly Slot[];
  readonly rows: number;
  readonly cols: number;
  readonly blankRow: number;
  readonly blankCol: number;
}
export interface GT011BlankSocketState {
  readonly timeMs: number;
  readonly reducedMotion: boolean;
  readonly hasPreview: boolean;
  readonly isSolved: boolean;
}
export interface GT011OverlayState {
  readonly visualState: ItemVisualState;
  readonly isHovered: boolean;
  readonly fallbackBadgeIndex: number | null;
}
type G = GT011GridContext;
type BS = GT011BlankSocketState;
type Ov = GT011OverlayState;
type Insp = GT011InspectRenderState | null;

function drawHoverAura(ctx: Ctx, x: number, y: number, r: number): void {
  const gen = getContextGeneration(ctx);
  const kind = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;
  const rKey = Math.max(8, Math.round(r));
  let grad = getCachedGradient(ctx, gen, kind, rKey);
  if (!grad) {
    grad = ctx.createRadialGradient(0, 0, rKey * 0.2, 0, 0, rKey);
    grad.addColorStop(0, alpha(m.amber, 0.36));
    grad.addColorStop(1, alpha(m.amberLight, 0));
    setCachedGradient(ctx, gen, kind, rKey, grad);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rKey, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function strokeLine(ctx: Ctx, a: Slot | undefined, b: Slot | undefined): void {
  if (a && b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

export function drawGT011MatrixGridGrooves(ctx: Ctx, rs: RS, g: G): void {
  const cs = g.cellSlots;
  if (cs.length === 0) {
    return;
  }
  ctx.save();
  ctx.lineCap = "round";
  const hiCol = alpha(m.amber, 0.34);
  const loCol = alpha(m.woodBorder, 0.22);
  for (let r = 0; r < g.rows; r++) {
    ctx.strokeStyle = r === g.blankRow ? hiCol : loCol;
    ctx.lineWidth = r === g.blankRow ? 10 : 5;
    strokeLine(ctx, cs[r * g.cols], cs[(r + 1) * g.cols - 1]);
  }
  for (let col = 0; col < g.cols; col++) {
    ctx.strokeStyle = col === g.blankCol ? hiCol : loCol;
    ctx.lineWidth = col === g.blankCol ? 10 : 5;
    strokeLine(ctx, cs[col], cs[(g.rows - 1) * g.cols + col]);
  }
  const bSlot = rs.softShadowsEnabled
    ? cs[g.blankRow * g.cols + g.blankCol]
    : null;
  if (bSlot) {
    drawHoverAura(ctx, bSlot.x, bSlot.y, Math.min(bSlot.w, bSlot.h) * 0.65);
  }
  ctx.restore();
}

export function drawGT011BlankSocket(ctx: Ctx, s: Slot, st: BS): void {
  const filled = st.hasPreview || st.isSolved;
  const p =
    st.reducedMotion || filled ? 1 : 1 + 0.018 * Math.sin(st.timeMs / 240);
  const h = Math.min(s.w, s.h) * 0.46 * p;
  ctx.save();
  ctx.fillStyle = st.isSolved ? cl.semantic.success[50] : m.plateInner;
  ctx.strokeStyle = st.isSolved ? m.emerald : m.amberDark;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(filled ? SOLID_DASH : DASH_SOCKET);
  ctx.beginPath();
  ctx.roundRect(s.x - h, s.y - h, h * 2, h * 2, Math.max(10, h * 0.26));
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash(SOLID_DASH);
  if (!filled) {
    const qR = Math.max(6, h * 0.28);
    ctx.strokeStyle = alpha(m.amberDark, 0.78);
    ctx.lineWidth = Math.max(2.5, qR * 0.32);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(s.x, s.y - qR * 0.4, qR * 0.7, Math.PI * 1.1, Math.PI * 0.25);
    ctx.lineTo(s.x, s.y + qR * 0.4);
    ctx.stroke();
    ctx.fillStyle = alpha(m.amberDark, 0.85);
    ctx.beginPath();
    ctx.arc(s.x, s.y + qR, Math.max(2.2, qR * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBand(ctx: Ctx, s: readonly Slot[], f: string, st: string): void {
  const box = boxFromSlots(s);
  if (box) {
    ctx.fillStyle = f;
    ctx.strokeStyle = st;
    ctx.lineWidth = 3;
    ctx.setLineDash(DASH_GUIDE);
    ctx.beginPath();
    ctx.roundRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12, 14);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawGT011HintAxes(c: Ctx, g: G, lv: number, t: number): void {
  if (lv < 1) {
    return;
  }
  const b = 0.22 + 0.08 * Math.sin(t / 220);
  const f = alpha(m.amberGlow, b);
  c.save();
  const rSlots = g.cellSlots.filter(
    (_, i) => Math.floor(i / g.cols) === g.blankRow
  );
  drawBand(c, rSlots, f, alpha(m.amber, b + 0.45));
  if (lv >= 2) {
    const cSlots = g.cellSlots.filter((_, i) => i % g.cols === g.blankCol);
    drawBand(c, cSlots, f, alpha(m.amberDark, b + 0.5));
  }
  c.setLineDash(SOLID_DASH);
  c.restore();
}

export function drawGT011WaveAndInspect(
  ctx: Ctx,
  g: G,
  wave: number | null,
  insp: Insp
): void {
  const { cellSlots: cs, rows, cols, blankRow: br, blankCol: bc } = g;
  ctx.save();
  const sp = insp ? cs[insp.slotIndex] : undefined;
  if (insp && sp) {
    const r = Math.floor(insp.slotIndex / cols);
    const col = insp.slotIndex % cols;
    const fade = Math.max(0, 1 - insp.progress);
    ctx.strokeStyle = alpha(cl.brand[400], 0.45 * fade);
    ctx.lineWidth = 3;
    ctx.setLineDash(DASH_GUIDE);
    strokeLine(ctx, cs[r * cols], cs[r * cols + cols - 1]);
    strokeLine(ctx, cs[col], cs[(rows - 1) * cols + col]);
    ctx.setLineDash(SOLID_DASH);
    const rad = Math.min(sp.w, sp.h) * 0.48;
    ctx.strokeStyle = alpha(cl.brand[500], 0.82 * fade);
    ctx.beginPath();
    ctx.roundRect(sp.x - rad, sp.y - rad, rad * 2, rad * 2, 12);
    ctx.stroke();
  }
  if (wave !== null) {
    const isRow = wave <= 0.5;
    const t = isRow ? wave * 2 : (wave - 0.5) * 2;
    const box = boxFromSlots(
      cs.filter((_, i) =>
        isRow ? Math.floor(i / cols) === br : i % cols === bc
      )
    );
    if (box) {
      ctx.strokeStyle = alpha(m.emeraldBright, 0.78 * (1 - t * 0.4));
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10, 14);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFallbackBadge(ctx: Ctx, s: Slot, r: number, idx: number): void {
  const k = Math.abs(idx) % 6;
  const n = POLY_SIDES[k] ?? 0;
  ctx.fillStyle = BF[k] ?? m.woodBorder;
  ctx.strokeStyle = cl.brand[800];
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (k === 0) {
    ctx.arc(s.x, s.y, r * 0.5, 0, Math.PI * 2);
  } else if (n > 0) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
      ctx.lineTo(s.x + Math.cos(a) * r * 0.54, s.y + Math.sin(a) * r * 0.54);
    }
    ctx.closePath();
  } else if (k === 2) {
    ctx.rect(s.x - r * 0.45, s.y - r * 0.45, r * 0.9, r * 0.9);
  } else {
    const w = r * 0.28;
    const l = r * 0.92;
    ctx.rect(s.x - w / 2, s.y - l / 2, w, l);
    ctx.rect(s.x - l / 2, s.y - w / 2, l, w);
  }
  ctx.fill();
  ctx.stroke();
}

function ring(ctx: Ctx, s: Slot, r: number, col: string, w: number): void {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawGT011SlotOverlay(ctx: Ctx, s: Slot, ov: Ov): void {
  const st = ov.visualState;
  const r = Math.min(s.w, s.h) * 0.44;
  ctx.save();
  if (ov.fallbackBadgeIndex !== null) {
    drawFallbackBadge(ctx, s, r, ov.fallbackBadgeIndex);
  }
  if (ov.isHovered && st === "idle") {
    drawHoverAura(ctx, s.x, s.y, r * 1.15);
  }
  if (st === "idle") {
    ctx.strokeStyle = alpha(cl.surface[0], 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 0.88, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (st === "selected") {
    ctx.strokeStyle = m.amber;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 2, 0, Math.PI * 2);
    ctx.moveTo(s.x + r - 3, s.y);
    ctx.arc(s.x, s.y, r - 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (st === "touching") {
    ring(ctx, s, r * 0.96, m.amberDark, 3.4);
  } else if (st === "correct") {
    ring(ctx, s, r + 2, m.emerald, 3.2);
    drawCheckMark(ctx, s);
  } else if (st === "wrong") {
    ctx.setLineDash(DASH_WRONG);
    ring(ctx, s, r + 2, cl.retry[600], 2.8);
    ctx.setLineDash(SOLID_DASH);
    ctx.fillStyle = cl.retry[500];
    ctx.beginPath();
    ctx.arc(s.x, s.y - r - 4, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
