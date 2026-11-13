import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { balanceScaleGeometry } from "./board-shapes.js";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { slotAtPoint } from "./shared-render-shapes.js";
import { drawCheckMark } from "./slot-decor.js";
import type { ItemVisualState, SceneBox } from "./types.js";

const cl = designTokens.colors;
const m = cl.montessori;
const DASH_INVITE: readonly number[] = [5, 4];
const DASH_WRONG: readonly number[] = [6, 5];
const DASH_HINT: readonly number[] = [7, 5];
const SOLID: readonly number[] = [];
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type Goal = "balance" | "pick_heavier" | "pick_lighter";

export interface GT014ScaleOrnamentOpts {
  readonly box: SceneBox;
  readonly goal: Goal;
  readonly tiltDeg: number;
  readonly isBalanced: boolean;
  readonly isWon: boolean;
}
export interface GT014PanFeedbackOpts {
  readonly pan: SceneBox;
  readonly visualState: ItemVisualState;
  readonly isInteractiveTarget: boolean;
  readonly isHovered: boolean;
  readonly timeMs: number;
  readonly wrongProgress: number | null;
  readonly stageBounds: SceneBox;
}
export interface GT014TrayPedestalOpts {
  readonly visualState: ItemVisualState;
  readonly isHovered: boolean;
  readonly index: number;
  readonly timeMs: number;
  readonly trayBounds: SceneBox;
}
type Orn = GT014ScaleOrnamentOpts;
type PanFb = GT014PanFeedbackOpts;
type Ped = GT014TrayPedestalOpts;

const clp = (v: number, lo: number, hi: number): number =>
  lo <= hi ? Math.min(hi, Math.max(lo, v)) : v;

function clampBox(p: SceneBox, b: SceneBox, dx = 0): SceneBox {
  const x = clp(p.x + dx, b.x + 2, b.x + b.w - p.w - 2);
  const y = clp(p.y, b.y + 2, b.y + b.h - p.h - 2);
  return { x, y, w: p.w, h: p.h };
}

function drawAura(ctx: Ctx, x: number, y: number, r: number): void {
  const rk = Math.round(r);
  if (rk < 6) {
    return;
  }
  const gen = getContextGeneration(ctx);
  const k = PRIMITIVE_GRADIENTS.TARGET_HOVER_AURA;
  let g = getCachedGradient(ctx, gen, k, rk);
  if (!g) {
    g = ctx.createRadialGradient(0, 0, rk * 0.2, 0, 0, rk);
    g.addColorStop(0, alpha(m.amber, 0.34));
    g.addColorStop(1, alpha(m.amberLight, 0));
    setCachedGradient(ctx, gen, k, rk, g);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rk, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlyph(ctx: Ctx, g: Goal, cx: number, cy: number, r: number): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (g === "balance") {
    ctx.strokeStyle = m.emerald;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.46, cy - r * 0.22);
    ctx.lineTo(cx + r * 0.46, cy - r * 0.22);
    ctx.moveTo(cx - r * 0.46, cy + r * 0.22);
    ctx.lineTo(cx + r * 0.46, cy + r * 0.22);
    ctx.stroke();
    return;
  }
  const d = g === "pick_heavier" ? 1 : -1;
  const y1 = cy + d * r * 0.14;
  ctx.strokeStyle = d > 0 ? m.amberDeep : cl.brand[600];
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - d * r * 0.48);
  ctx.lineTo(cx, y1);
  ctx.moveTo(cx - r * 0.28, y1 - d * r * 0.24);
  ctx.lineTo(cx, y1);
  ctx.lineTo(cx + r * 0.28, y1 - d * r * 0.24);
  ctx.stroke();
  ctx.fillStyle = d > 0 ? m.amberDark : cl.brand[400];
  ctx.beginPath();
  ctx.arc(cx, cy + d * r * 0.42, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGT014ScaleOrnament(ctx: Ctx, _rs: RS, o: Orn): void {
  const { pivotX: px, pivotY: py } = balanceScaleGeometry(o.box);
  const dr = Math.max(11, Math.min(18, o.box.h * 0.085));
  const rad = -Math.PI / 2 + (clp(o.tiltDeg, -14, 14) * Math.PI) / 180;
  ctx.save();
  ctx.fillStyle = alpha(m.plateLight, 0.9);
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(px, py, dr, Math.PI * 1.18, Math.PI * 1.82);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = o.isBalanced ? m.emerald : m.amberDeep;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(px, py - dr * 0.62);
  ctx.lineTo(px, py - dr * 1.05);
  ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(rad) * dr * 0.88, py + Math.sin(rad) * dr * 0.88);
  ctx.stroke();
  const pb = o.box.y + o.box.h - 8;
  const my = py + (pb - py) * 0.48;
  const mr = Math.max(9, Math.min(14, (pb - py) * 0.22));
  ctx.fillStyle = m.plateLight;
  ctx.strokeStyle = o.isWon ? m.emerald : m.amberDark;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(px, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawGlyph(ctx, o.goal, px, my, mr);
  ctx.restore();
}

function strokeBox(
  ctx: Ctx,
  b: SceneBox,
  col: string,
  lw: number,
  d = SOLID,
  pad = 0
): void {
  const s = 1 + pad;
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.setLineDash(d);
  ctx.beginPath();
  ctx.roundRect(b.x + s, b.y + s, b.w - s * 2, b.h - s * 2, 7);
  ctx.stroke();
  ctx.setLineDash(SOLID);
}

const PAN_STROKE: Record<
  string,
  { col: string; lw: number; d: readonly number[]; pad: number }
> = {
  touching: { col: m.amberDark, lw: 2.8, d: SOLID, pad: 2 },
  selected: { col: m.amber, lw: 2.8, d: SOLID, pad: 0 },
  correct: { col: m.emerald, lw: 3.2, d: SOLID, pad: 0 },
  wrong: { col: cl.retry[600], lw: 2.8, d: DASH_WRONG, pad: 0 },
};

const PED_DY: Record<string, number> = { selected: -3.5, touching: 2 };

export function drawGT014PanFeedback(ctx: Ctx, rs: RS, o: PanFb): void {
  const { pan, visualState: st, stageBounds: b, wrongProgress: wp } = o;
  const shake = wp !== null && !rs.reducedMotion ? Math.sin(wp * 12.5) * 4 : 0;
  const box = clampBox(pan, b, st === "wrong" ? shake : 0);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.save();
  if ((o.isHovered || st === "selected") && rs.softShadowsEnabled) {
    drawAura(ctx, cx, cy, Math.min(pan.w, pan.h) * 0.45);
  }
  const preset = PAN_STROKE[st];
  if (preset) {
    strokeBox(ctx, box, preset.col, preset.lw, preset.d, preset.pad);
    if (st === "selected") {
      strokeBox(ctx, box, preset.col, 1.5, SOLID, 4);
    }
  } else if (st === "idle" && o.isInteractiveTarget) {
    const p = rs.reducedMotion ? 0 : 0.08 * Math.sin(o.timeMs / 240);
    strokeBox(ctx, box, alpha(m.amberDark, 0.52 + p), 2, DASH_INVITE);
  }
  if (st === "correct") {
    drawCheckMark(
      ctx,
      slotAtPoint(cx, cy, Math.max(16, Math.min(pan.w, pan.h)))
    );
  }
  ctx.restore();
}

export function drawGT014TrayPedestal(ctx: Ctx, rs: RS, s: Slot, o: Ped): void {
  const { visualState: st, trayBounds: tb } = o;
  const br = Math.max(10, Math.min(s.w, s.h) * 0.44);
  const r0 = Math.min(br, tb.w / 2 - 4, tb.h / 2 - 4);
  if (r0 < 6) {
    return;
  }
  const r = st === "touching" ? r0 * 0.95 : r0;
  const breath = rs.reducedMotion
    ? 0
    : Math.sin(o.timeMs / 280 + o.index) * 1.2;
  const dy = PED_DY[st] ?? breath;
  const cx = clp(s.x, tb.x + r0 + 3, tb.x + tb.w - r0 - 3);
  const cy = clp(s.y + dy, tb.y + r0 + 3, tb.y + tb.h - r0 - 4);
  ctx.save();
  if (o.isHovered && rs.softShadowsEnabled) {
    drawAura(ctx, cx, cy, r0);
  }
  if (st === "idle") {
    ctx.fillStyle = alpha(m.woodBorder, 0.32);
    ctx.beginPath();
    ctx.arc(cx, Math.min(tb.y + tb.h - r - 1, cy + 2.5), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = st === "selected" ? m.amberGlow : m.plateLight;
  ctx.strokeStyle = st === "selected" ? m.amber : m.woodBorder;
  ctx.lineWidth = st === "selected" ? 2.6 : 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (st === "selected") {
    ctx.moveTo(cx + r * 0.82, cy);
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawGT014FallbackWeight(
  ctx: Ctx,
  p: SceneBox,
  b: SceneBox
): void {
  const r = Math.max(5, Math.min(p.w * 0.38, b.w / 4, b.h / 4));
  const x = clp(p.x, b.x + r + 2, b.x + b.w - r - 2);
  const y = clp(p.y, b.y + r + 2, b.y + b.h - r - 2);
  ctx.save();
  ctx.fillStyle = m.amber;
  ctx.strokeStyle = m.amberDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.42, r * 0.34, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - r * 0.72, y - r * 0.35, r * 1.44, r * 1.15, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawGT014HintBoxes(
  ctx: Ctx,
  bs: readonly SceneBox[],
  b: SceneBox,
  p: number
): void {
  const col = alpha(m.amber, 0.78 + p);
  ctx.save();
  for (const box of bs) {
    strokeBox(ctx, clampBox(box, b), col, 3, DASH_HINT);
  }
  ctx.restore();
}

export function drawGT014ClosedReveal(
  ctx: Ctx,
  pan: SceneBox,
  ghost: number,
  b: SceneBox
): void {
  const box = clampBox(pan, b);
  ctx.save();
  strokeBox(ctx, box, m.emeraldBright, 3);
  if (ghost > 0) {
    const d = Math.max(14, Math.min(ghost * 0.8, b.h * 0.24));
    const gBox = { x: box.x + (box.w - d) / 2, y: box.y - d - 2, w: d, h: d };
    strokeBox(ctx, clampBox(gBox, b), m.emerald, 2.5, DASH_HINT);
  }
  ctx.restore();
}
