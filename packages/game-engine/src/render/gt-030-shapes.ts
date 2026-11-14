import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type GT030VisualState = "idle" | "hovered" | "correct" | "wrong";

export interface GT030WorkbenchParams {
  readonly isStripHovered: boolean;
  readonly isWon: boolean;
  readonly objectSlot: Slot;
  readonly shadowsOff: boolean;
  readonly stage: ZoneRect;
  readonly stripSlot: Slot;
}

export interface GT030PlacedUnitsParams {
  readonly elapsedMs: number;
  readonly isRoundClosed: boolean;
  readonly isWon: boolean;
  readonly lastSnapElapsedMs: number | null;
  readonly placedCount: number;
  readonly stage: ZoneRect;
  readonly stripSlot: Slot;
  readonly unitWidth: number;
}

export interface GT030SourceTrayParams {
  readonly elapsedMs: number;
  readonly isFull: boolean;
  readonly isHovered: boolean;
  readonly sourceSlot: Slot;
  readonly tray: ZoneRect;
  readonly wrongProgress: number | null;
}

export interface GT030OptionCardParams {
  readonly isCorrectOption: boolean;
  readonly isRoundClosed: boolean;
  readonly particlesOff: boolean;
  readonly slot: Slot;
  readonly stage: ZoneRect;
  readonly state: GT030VisualState;
  readonly winElapsedMs: number | null;
  readonly wrongProgress: number | null;
}

export interface GT030ScaffoldVisual {
  readonly candidateOptionSlots: readonly Slot[];
  readonly correctOptionSlot: Slot | null;
  readonly elapsedMs: number;
  readonly level: 1 | 2 | 3;
  readonly nextCellSlot: Slot | null;
  readonly phase: "place" | "select";
  readonly placedCount: number;
  readonly sourceSlot: Slot;
  readonly stage: ZoneRect;
  readonly stripSlot: Slot;
  readonly tray: ZoneRect;
  readonly unitWidth: number;
}

type Ctx = CanvasRenderingContext2D;
type Pt3 = readonly [number, number, number];
type Pt4 = readonly [number, number, number, number];

const MO = designTokens.colors.montessori;
const SURF = designTokens.colors.surface;
const SEM = designTokens.colors.semantic.success;
const D0: readonly number[] = [];
const D4: readonly number[] = [5, 4];
const D6: readonly number[] = [7, 5];
const SPARK_ANGLES = [0.4, 1.97, 3.54, 5.11] as const;

const cxIn = (x: number, c: ZoneRect, p = 2): number =>
  Math.max(c.x + p, Math.min(c.x + c.w - p, x));
const cyIn = (y: number, c: ZoneRect, p = 2): number =>
  Math.max(c.y + p, Math.min(c.y + c.h - p, y));
const box = (x: number, y: number, w: number, h: number): Pt4 => [x, y, w, h];
const sbox = (s: Slot, pad = 0): Pt4 =>
  box(s.x - s.w / 2 - pad, s.y - s.h / 2 - pad, s.w + pad * 2, s.h + pad * 2);

function paint(g: Ctx, f?: string, s?: string, lw = 2): void {
  if (f) {
    g.fillStyle = f;
    g.fill();
  }
  if (s) {
    g.strokeStyle = s;
    g.lineWidth = lw;
    g.stroke();
  }
}

function rbox(g: Ctx, c: ZoneRect, b: Pt4, r: number, f?: string, s?: string) {
  const [l, t] = [cxIn(b[0], c), cyIn(b[1], c)];
  const w = Math.max(2, cxIn(b[0] + b[2], c) - l);
  const h = Math.max(2, cyIn(b[1] + b[3], c) - t);
  g.beginPath();
  g.roundRect(l, t, w, h, Math.min(r, w / 2, h / 2));
  paint(g, f, s, 2.2);
}

function dot(g: Ctx, c: ZoneRect, p: Pt3, f?: string, s?: string): void {
  const [cx, cy] = [cxIn(p[0], c, 3), cyIn(p[1], c, 3)];
  const rx = Math.min(cx - c.x - 2, c.x + c.w - 2 - cx);
  const ry = Math.min(cy - c.y - 2, c.y + c.h - 2 - cy);
  g.beginPath();
  g.arc(cx, cy, Math.max(0.5, Math.min(p[2], rx, ry)), 0, Math.PI * 2);
  paint(g, f, s, 2);
}

function seg(g: Ctx, c: ZoneRect, pts: Pt4): void {
  g.beginPath();
  g.moveTo(cxIn(pts[0], c), cyIn(pts[1], c));
  g.lineTo(cxIn(pts[2], c), cyIn(pts[3], c));
  g.stroke();
}

export function drawGT030Workbench(
  ctx: Ctx,
  rs: RenderSystem,
  p: GT030WorkbenchParams
): void {
  const { stage: c, objectSlot: obj, stripSlot: st } = p;
  const [lx, rx] = [st.x - st.w / 2, st.x + st.w / 2];
  const [ty, by] = [obj.y - obj.h / 2, st.y + st.h / 2];
  const [px, py] = [Math.min(14, st.h * 0.18), Math.min(10, st.h * 0.14)];
  const wb = box(lx - px, ty - py, st.w + px * 2, by - ty + py * 2);
  ctx.save();
  ctx.save();
  if (!p.shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(MO.woodBorder, 0.16);
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }
  rbox(ctx, c, box(wb[0], wb[1] + 2, wb[2], wb[3]), 16, MO.woodBevel);
  ctx.restore();
  const bdr = p.isWon ? MO.emeraldBright : MO.woodBorder;
  rbox(ctx, c, wb, 16, alpha(MO.paper, 0.94), bdr);
  rbox(ctx, c, sbox(obj), 12, SURF[100], SURF[300]);
  const sb = sbox(st);
  const sf = p.isStripHovered ? alpha(MO.amberLight, 0.45) : SURF[50];
  rbox(ctx, c, sb, 12, sf, p.isStripHovered ? MO.amberDark : MO.woodBorder);
  ctx.strokeStyle = alpha(MO.amberDark, 0.65);
  ctx.lineWidth = 2;
  ctx.setLineDash(D4);
  seg(ctx, c, [lx, ty - 3, lx, by + 3]);
  seg(ctx, c, [rx, ty - 3, rx, by + 3]);
  ctx.setLineDash(D0);
  ctx.strokeStyle = MO.amberDark;
  ctx.lineWidth = 3;
  seg(ctx, c, [lx, sb[1] + 3, lx, sb[1] + sb[3] - 3]);
  seg(ctx, c, [rx, sb[1] + 3, rx, sb[1] + sb[3] - 3]);
  ctx.restore();
}

export function drawGT030PlacedUnitsOverlay(
  ctx: Ctx,
  rs: RenderSystem,
  p: GT030PlacedUnitsParams
): void {
  const { stage: c, stripSlot: st, placedCount: n, unitWidth: u } = p;
  if (n <= 0 || u <= 0) {
    return;
  }
  const [left, dt, snap] = [st.x - st.w / 2, u * 0.46, p.lastSnapElapsedMs];
  ctx.save();
  for (let i = 0; i < n; i++) {
    const cx = left + (i + 0.5) * u;
    if (i > 0) {
      const jr = Math.max(2.5, u * 0.08);
      dot(ctx, c, [left + i * u, st.y, jr], MO.amberLight, MO.amberDark);
    }
    const b = box(cx - dt, st.y - dt, dt * 2, dt * 2);
    if (i === n - 1 && snap !== null && snap < 360 && !rs.reducedMotion) {
      const sa = alpha(MO.amberDark, (1 - snap / 360) * 0.8);
      rbox(ctx, c, b, 10, undefined, sa);
    }
    if (p.isWon) {
      const phase = p.elapsedMs / 180 - i * 0.6;
      const wv = rs.reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(phase);
      rbox(ctx, c, b, 10, alpha(SEM[100], 0.24 * wv), MO.emeraldBright);
    } else if (p.isRoundClosed) {
      ctx.setLineDash(D4);
      rbox(ctx, c, b, 9, undefined, MO.amberDark);
      ctx.setLineDash(D0);
    }
  }
  ctx.restore();
}

export function drawGT030SourceTrayEffect(
  ctx: Ctx,
  rs: RenderSystem,
  p: GT030SourceTrayParams
): void {
  const { tray: c, sourceSlot: s } = p;
  const r = Math.min(s.w, s.h) * 0.48;
  ctx.save();
  if (p.wrongProgress !== null) {
    const [rx, ry] = [cxIn(s.x, c, 6), cyIn(s.y, c, 6)];
    rs.drawRetryRing(ctx, rx, ry, Math.max(8, r), p.wrongProgress);
  } else if (p.isHovered && !p.isFull) {
    dot(ctx, c, [s.x, s.y, r + 4], alpha(MO.amberLight, 0.55), MO.amberDark);
  } else if (!p.isFull) {
    const br = rs.reducedMotion ? 0 : Math.sin(p.elapsedMs / 500) * 1.2;
    dot(ctx, c, [s.x, s.y + 1.5, r + 1.5 + br], alpha(MO.woodBevel, 0.25));
  }
  ctx.restore();
}

export function drawGT030OptionCardOverlay(
  ctx: Ctx,
  rs: RenderSystem,
  p: GT030OptionCardParams
): void {
  const { stage: c, slot: s, state: st } = p;
  const r = Math.min(s.w, s.h) / 2;
  ctx.save();
  if (st === "wrong" && p.wrongProgress !== null) {
    const [rx, ry] = [cxIn(s.x, c, 6), cyIn(s.y, c, 6)];
    rs.drawRetryRing(ctx, rx, ry, Math.max(8, r + 2), p.wrongProgress);
  } else if (st === "hovered") {
    rbox(ctx, c, sbox(s, 2), 14, alpha(MO.amberLight, 0.35), MO.amberDark);
  } else if (st === "correct") {
    const br = Math.max(6, Math.min(10, r * 0.28));
    const [bx, by] = [s.x + s.w * 0.32, s.y - s.h * 0.32];
    const [mx, my] = [bx - br * 0.08, by + br * 0.32];
    dot(ctx, c, [bx, by, br], MO.emeraldBright, MO.emerald);
    ctx.strokeStyle = SURF[0];
    ctx.lineWidth = 2;
    seg(ctx, c, [bx - br * 0.4, by, mx, my]);
    seg(ctx, c, [mx, my, bx + br * 0.42, by - br * 0.3]);
    const wMs = p.winElapsedMs ?? 999;
    if (!(p.particlesOff || rs.reducedMotion) && wMs < 700) {
      const [t, d] = [wMs / 700, r + 3 + (wMs / 700) * 8];
      for (const a of SPARK_ANGLES) {
        const sp: Pt3 = [s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, 2.2];
        dot(ctx, c, sp, alpha(MO.emeraldBright, 1 - t));
      }
    }
  } else if (p.isRoundClosed && p.isCorrectOption) {
    ctx.setLineDash(D6);
    rbox(ctx, c, sbox(s, 3), 14, undefined, MO.emerald);
    ctx.setLineDash(D0);
  }
  ctx.restore();
}

export function drawGT030BrokenFallback(g: Ctx, c: ZoneRect, s: Slot): void {
  g.save();
  rbox(g, c, sbox(s, -2), 10, alpha(MO.amberLight, 0.7), MO.amberDark);
  dot(g, c, [s.x, s.y, 4.5], alpha(MO.amberDark, 0.35), MO.amberDark);
  g.restore();
}

export function drawGT030ScaffoldOverlay(
  ctx: Ctx,
  rs: RenderSystem,
  v: GT030ScaffoldVisual
): void {
  const { stage: c, stripSlot: st, unitWidth: u } = v;
  const k = rs.reducedMotion ? 0.85 : 0.55 + 0.35 * Math.sin(v.elapsedMs / 240);
  const stroke = alpha(MO.amberDark, k);
  ctx.save();
  if (v.phase === "place") {
    const ex = st.x - st.w / 2 + v.placedCount * u;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3.2;
    seg(ctx, c, [ex, st.y - st.h * 0.48, ex, st.y + st.h * 0.48]);
    if (v.level >= 2 && v.nextCellSlot) {
      ctx.setLineDash(D4);
      const nf = alpha(MO.amberLight, 0.35 * k);
      rbox(ctx, c, sbox(v.nextCellSlot, -2), 10, nf, MO.amberDark);
      ctx.setLineDash(D0);
      const sr = Math.min(v.sourceSlot.w, v.sourceSlot.h) * 0.52;
      dot(ctx, v.tray, [v.sourceSlot.x, v.sourceSlot.y, sr], undefined, stroke);
    }
  } else {
    const cw = Math.max(u, v.placedCount * u);
    const cb = box(st.x - st.w / 2, st.y - st.h / 2, cw, st.h);
    ctx.setLineDash(D6);
    rbox(ctx, c, cb, 12, undefined, stroke);
    const cf = alpha(MO.amberLight, 0.24 * k);
    for (const os of v.level === 2 ? v.candidateOptionSlots : []) {
      rbox(ctx, c, sbox(os, 2), 14, cf, MO.amberDark);
    }
    ctx.setLineDash(D0);
    if (v.level === 3 && v.correctOptionSlot) {
      const okFill = alpha(SEM[100], 0.28 * k);
      rbox(ctx, c, sbox(v.correctOptionSlot, 3), 14, okFill, MO.emeraldBright);
    }
  }
  ctx.restore();
}
