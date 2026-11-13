import type { Slot } from "#src/layout/types";
import type { ConstraintViolation } from "#src/systems/constraint-system";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { drawSudokuBoardFrame } from "./board-shapes.js";
import { alpha } from "./color-utils.js";
import { drawSlotItem } from "./shared-render.js";
import { boxFromSlots, WALL_LINE_PX } from "./shared-render-shapes.js";
import type { RenderAsset, ItemVisualState as S, SceneBox } from "./types.js";

export const GT015_STEP_POP_MS = 240;
export const GT015_LOCKED_SHAKE_MS = 240;

export function progressWindow(ms: number, s: number | undefined, d: number) {
  const dt = s === undefined ? -1 : ms - s;
  return d > 0 && dt >= 0 && dt < d ? 1 - dt / d : 0;
}

export type GT015RenderSymbol = Record<"symbol_id", string> &
  Record<"asset", RenderAsset>;
type Cell = Record<"row" | "col", number> &
  Record<"value", string | null> &
  Record<"isInitial", boolean>;
type ClkN = "winAtMs" | "hoveredSlotIndex" | "pressedSlotIndex";
type ClkM = "stepPopMap" | "lockedShakeMap";
interface Clk
  extends Record<ClkN | "selectedCellIndex", number | null>,
    Record<ClkM, Map<string, number>> {
  elapsedMs: number;
  pressedUntilMs: number;
  scaffoldHintLevel: 0 | 1 | 2 | 3;
}
export interface GT015RenderContext
  extends Record<"isWon" | "isRoundClosed" | "degraded", boolean> {
  readonly content: {
    readonly grid_size: 2 | 3 | 4;
    readonly regions?: "row_col" | "row_col_box";
    readonly symbols: readonly GT015RenderSymbol[];
  };
  readonly states: ReadonlyMap<string, Cell>;
  readonly violations: readonly ConstraintViolation[];
  readonly solution: ReadonlyMap<number, string> | null;
  readonly slots: readonly Slot[];
  readonly symbols: readonly GT015RenderSymbol[];
  readonly selectedSymbolId: string | null;
  readonly hintIdx: number | null;
  readonly clock: Clk;
  readonly stageBounds: SceneBox;
  readonly trayBounds?: SceneBox;
  readonly wrongFlashAlpha: number;
}

type Ctx = CanvasRenderingContext2D;
type Sys = RenderSystem;
type V = GT015RenderContext;
const C = designTokens.colors;
const M = C.montessori;
const BADGES = [C.brand[500], M.amberDark, M.indigo, M.emerald] as const;
const SIDES = [0, 3, 4, 10] as const;
const PINS = [-0.36, 0.36] as const;
const CLEAR = alpha(C.surface[0], 0);

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const qOf = (i: number) => Math.floor(i / 8) * 2 + Math.floor((i % 4) / 2);
const edgeDist = (b: SceneBox, x: number, y: number) =>
  Math.max(4, Math.min(x - b.x, b.x + b.w - x, y - b.y, b.y + b.h - y) - 4);
export const retryRad = (b: SceneBox, s: Slot) =>
  cl(Math.min(s.hitW, s.hitH) / 2 + 4, 4, edgeDist(b, s.x, s.y));

function pickAsset(v: V, id: string | null): [number, RenderAsset | undefined] {
  const syms = v.content.symbols;
  const idx = syms.findIndex((x) => x.symbol_id === id);
  const [i, a] = [Math.max(0, idx), syms[Math.max(0, idx)]?.asset];
  const t = `${a && "text" in a ? a.text : ""}${a && "path" in a ? a.path : ""}${a && "ref" in a ? a.ref : ""}`;
  return [i, t.trim().length > 0 ? a : undefined];
}

function padBox(ss: readonly Slot[], b: SceneBox, p: number): SceneBox | null {
  const r = boxFromSlots(ss);
  const x0 = r ? cl(r.x - p, b.x + 2, b.x + b.w - 4) : 0;
  const y0 = r ? cl(r.y - p, b.y + 2, b.y + b.h - 4) : 0;
  const x1 = r ? cl(r.x + r.w + p, x0 + 2, b.x + b.w - 2) : 0;
  const y1 = r ? cl(r.y + r.h + p, y0 + 2, b.y + b.h - 2) : 0;
  return r ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

const grpSlots = (cs: readonly Slot[], n: number, kind: string, k: number) =>
  kind === "row"
    ? cs.slice(k * n, (k + 1) * n)
    : cs.filter((_, i) => (kind === "col" ? i % n === k : qOf(i) === k));

const gBox = (cs: readonly Slot[], v: V, k: string, i: number, p: number) =>
  padBox(grpSlots(cs, v.content.grid_size, k, i), v.stageBounds, p);

function circ(ctx: Ctx, x: number, y: number, r: number, fill = true): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx[fill ? "fill" : "stroke"]();
}

function seg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

export function drawGeometricFallbackBadge(ctx: Ctx, s: Slot, i: number): void {
  const [k, r] = [Math.abs(i) % 4, Math.max(6, Math.min(s.w, s.h) * 0.26)];
  const n = SIDES[k] ?? 0;
  ctx.save();
  ctx.fillStyle = BADGES[k] ?? C.brand[500];
  [ctx.strokeStyle, ctx.lineWidth] = [C.surface[0], 2];
  ctx.beginPath();
  for (let j = 0; j < n; j++) {
    const sr = k === 3 && j % 2 === 1 ? r * 0.45 : r;
    const a = (j * Math.PI * 2) / n - Math.PI / 2;
    const [px, py] = [s.x + Math.cos(a) * sr, s.y + Math.sin(a) * sr];
    ctx[j === 0 ? "moveTo" : "lineTo"](px, py);
  }
  if (n === 0) {
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  } else {
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function rBox(ctx: Ctx, b: SceneBox | null, f: string, c?: string, d = false) {
  if (b) {
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, Math.max(8, Math.min(b.w, b.h) * 0.14));
    ctx.fillStyle = f;
    ctx.fill();
    if (c) {
      [ctx.strokeStyle, ctx.lineWidth] = [c, 2.5];
      ctx.setLineDash(d ? [6, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function sBox(ctx: Ctx, s: Slot, f: string, c?: string, d = false) {
  const r = Math.min(s.w, s.h) / 2 - 2;
  rBox(ctx, { x: s.x - r, y: s.y - r, w: r * 2, h: r * 2 }, f, c, d);
}

export function drawInvite(ctx: Ctx, s: Slot, sel: boolean) {
  sBox(ctx, s, CLEAR, sel ? M.amberDark : M.amber, !sel);
}

function drawOverlays(ctx: Ctx, rs: Sys, cs: readonly Slot[], v: V): void {
  const [n, h] = [v.content.grid_size, v.hintIdx];
  if (v.clock.scaffoldHintLevel === 2 && h !== null) {
    const [f, c] = [alpha(M.amberLight, 0.38), alpha(M.amber, 0.72)];
    rBox(ctx, gBox(cs, v, "row", Math.floor(h / n), 4), f, c, true);
    rBox(ctx, gBox(cs, v, "col", h % n, 4), f, c, true);
    if (v.content.regions === "row_col_box" && n === 4) {
      rBox(ctx, gBox(cs, v, "box", qOf(h), 4), f, c, true);
    }
  }
  const wave = 0.5 + 0.5 * Math.sin(v.clock.elapsedMs / 180);
  const wv = rs.reducedMotion || v.degraded ? 0.42 : 0.26 + 0.18 * wave;
  const [f, seen] = [alpha(C.retry[200], wv), new Set<string>()];
  for (const x of v.violations) {
    const i0 = x.row * n + x.col;
    const i1 = x.conflictingWith.row * n + x.conflictingWith.col;
    const k = { row: x.row, col: x.col, box: qOf(i0) }[x.kind];
    if (!seen.has(`${x.kind}:${k}`)) {
      seen.add(`${x.kind}:${k}`);
      rBox(ctx, gBox(cs, v, x.kind, k, 5), f, C.retry[500]);
    }
    const [s0, s1] = [cs[i0], cs[i1]];
    if (s0 && s1) {
      [ctx.strokeStyle, ctx.lineWidth] = [alpha(C.retry[600], 0.85), 2.5];
      ctx.setLineDash([5, 4]);
      seg(ctx, s0.x, s0.y, s1.x, s1.y);
      ctx.setLineDash([]);
    }
  }
}

function drawWinRows(ctx: Ctx, rs: Sys, cs: readonly Slot[], v: V): void {
  const [n, sb] = [v.content.grid_size, v.stageBounds];
  const dt = Math.max(0, v.clock.elapsedMs - (v.clock.winAtMs ?? 0));
  for (let r = 0; r < n; r++) {
    const raw = 1 - Math.abs(dt - r * 140) / 360;
    const wv = rs.reducedMotion ? 0.22 : cl(raw, 0, 1) * 0.28;
    if (wv > 0.01) {
      rBox(ctx, gBox(cs, v, "row", r, 4), alpha(M.emeraldLight, wv));
    }
  }
  if (!(rs.reducedMotion || v.degraded)) {
    ctx.fillStyle = alpha(M.amber, cl(1 - dt / 900, 0, 0.85));
    const sy = cl(sb.y + sb.h * 0.5 - dt * 0.03, sb.y + 8, sb.y + sb.h - 8);
    for (const p of PINS) {
      const sx = cl(sb.x + sb.w * (0.5 + p * 0.7), sb.x + 8, sb.x + sb.w - 8);
      circ(ctx, sx, sy, 3.5);
    }
  }
}

export function drawGT015Board(ctx: Ctx, rs: Sys, v: V): void {
  const [n, reg] = [v.content.grid_size, v.content.regions ?? "row_col"];
  const cs = v.slots.slice(0, n * n);
  const out = padBox(cs, v.stageBounds, 11);
  if (!out) {
    return;
  }
  ctx.save();
  if (rs.softShadowsEnabled && !v.degraded) {
    rBox(ctx, padBox(cs, v.stageBounds, 13), alpha(M.woodBorder, 0.2));
  }
  drawSudokuBoardFrame(ctx, cs, n, reg);
  if (reg === "row_col_box" && n === 4) {
    for (let q = 0; q < 4; q++) {
      const col = alpha(q % 3 === 0 ? M.amberGlow : M.plateMid, 0.34);
      rBox(ctx, gBox(cs, v, "box", q, 3), col);
    }
    const [mx, my] = [out.x + out.w / 2, out.y + out.h / 2];
    [ctx.strokeStyle, ctx.lineWidth] = [M.woodBorder, WALL_LINE_PX];
    seg(ctx, mx, out.y + 5, mx, out.y + out.h - 5);
    seg(ctx, out.x + 5, my, out.x + out.w - 5, my);
  }
  drawOverlays(ctx, rs, cs, v);
  if (v.isWon) {
    drawWinRows(ctx, rs, cs, v);
  }
  ctx.restore();
}

export function drawSym(ctx: Ctx, rs: Sys, s: Slot, k: string, v: V, st: S) {
  const [sIdx, va] = pickAsset(v, v.states.get(k)?.value ?? k);
  const sh = k.includes(",") ? "square" : "circle";
  drawSlotItem(ctx, rs, s, { id: k, asset: va, state: st }, sh);
  if (!va) {
    drawGeometricFallbackBadge(ctx, s, sIdx);
  }
}

export function drawGhost(ctx: Ctx, rs: Sys, s: Slot, v: V, i: number) {
  const gId = v.isRoundClosed ? (v.solution?.get(i) ?? null) : null;
  if (gId !== null) {
    ctx.save();
    sBox(ctx, s, CLEAR, M.emerald, true);
    ctx.globalAlpha = 0.48;
    drawSym(ctx, rs, s, gId, v, "idle");
    ctx.restore();
  }
}

export function drawLocked(ctx: Ctx, rs: Sys, s0: Slot, k: string, v: V) {
  const at = v.clock.lockedShakeMap.get(k);
  const shk = progressWindow(v.clock.elapsedMs, at, GT015_LOCKED_SHAKE_MS);
  const dx = shk > 0 && !rs.reducedMotion ? Math.sin(shk * 12.56) * 2.5 : 0;
  const s = dx === 0 ? s0 : { ...s0, x: s0.x + dx };
  sBox(ctx, s, M.plateInner, shk > 0 ? M.amberDark : M.woodBorder);
  drawSym(ctx, rs, s, k, v, "locked");
  const pr = Math.max(2, Math.min(s.w, s.h) * 0.045);
  ctx.fillStyle = shk > 0 ? M.amber : M.woodBorder;
  for (const ox of PINS) {
    for (const oy of PINS) {
      circ(ctx, s.x + ox * s.w, s.y + oy * s.h, pr);
    }
  }
}

export function drawGT015PaletteItem(ctx: Ctx, rs: Sys, v: V, i: number): void {
  const idx = v.content.grid_size ** 2 + i;
  const [s0, sym] = [v.slots[idx], v.symbols[i]];
  if (!(s0 && sym)) {
    return;
  }
  const tb = v.trayBounds ?? v.stageBounds;
  const sel = Number(v.selectedSymbolId === sym.symbol_id);
  const prs = Number(v.clock.pressedSlotIndex === idx);
  const idle = !(rs.reducedMotion || v.degraded || sel || prs);
  const br = idle ? Math.sin(v.clock.elapsedMs / 520 + i * 1.1) * 0.02 : 0;
  const sc = 1 + br - prs * 0.07 + sel * 0.05;
  const [w, h] = [Math.round(s0.w * sc), Math.round(s0.h * sc)];
  const x = cl(s0.x, tb.x + w / 2 + 6, tb.x + tb.w - w / 2 - 6);
  const y0 = s0.y + prs * 2 - sel * 3;
  const y = cl(y0, tb.y + h / 2 + 6, tb.y + tb.h - h / 2 - 14);
  ctx.save();
  if (sel || v.clock.selectedCellIndex !== null) {
    const rr = cl(Math.min(w, h) * 0.52, 4, edgeDist(tb, x, y));
    ctx.strokeStyle = sel ? M.amberDark : alpha(M.amber, 0.75);
    ctx.lineWidth = 2 + sel;
    circ(ctx, x, y, rr, false);
  }
  const hov: S = v.clock.hoveredSlotIndex === idx || prs ? "touching" : "idle";
  const st: S = sel ? "selected" : hov;
  drawSym(ctx, rs, { ...s0, x, y, w, h }, sym.symbol_id, v, st);
  ctx.restore();
}
const s1 = { drawGhost, drawInvite, drawLocked, drawSym, GT015_STEP_POP_MS };
export const S015 = { ...s1, progressWindow, retryRad };
