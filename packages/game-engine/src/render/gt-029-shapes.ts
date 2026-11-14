import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import type { SceneBox } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type GT029VisualState =
  | "idle"
  | "hovered"
  | "removed"
  | "correct"
  | "wrong"
  | "locked"
  | "closed";
export interface GT029GroupTrayParams {
  readonly catAnchor: {
    readonly r: number;
    readonly x: number;
    readonly y: number;
  };
  readonly clip: ZoneRect;
  readonly groupBounds: SceneBox | null;
  readonly isWon: boolean;
  readonly removedDockRects: readonly ZoneRect[];
  readonly shadowsOff: boolean;
}
export interface GT029ItemOverlayParams {
  readonly clip: ZoneRect;
  readonly shadowsOff: boolean;
  readonly slot: Slot;
  readonly state: GT029VisualState;
  readonly timeMs: number;
  readonly wrongProgress?: number;
}
export interface GT029OptionOverlayParams extends GT029ItemOverlayParams {
  readonly particlesOff: boolean;
  readonly winElapsedMs?: number;
}
export interface GT029ScaffoldOverlayParams {
  readonly clip: ZoneRect;
  readonly level: 1 | 2 | 3;
  readonly phase: "remove" | "answer";
  readonly primarySlot?: Slot;
  readonly progressBox?: SceneBox;
  readonly targetSlots: readonly Slot[];
  readonly timeMs: number;
}
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type Z = ZoneRect;
type B = SceneBox;
type P3 = readonly [number, number, number];
const MO = designTokens.colors.montessori;
const SURF = designTokens.colors.surface;
const SEM = designTokens.colors.semantic.success;
const TAU = Math.PI * 2;
const D0: number[] = [];
const D1: number[] = [6, 4];
const ANGS = [0.4, 1.45, 2.5, 3.55, 4.6, 5.65] as const;
const cxIn = (x: number, c: Z, p = 2): number =>
  Math.max(c.x + p, Math.min(c.x + c.w - p, x));
const cyIn = (y: number, c: Z, p = 2): number =>
  Math.max(c.y + p, Math.min(c.y + c.h - p, y));
function paint(g: Ctx, fill?: string, stroke?: string, lw = 2): void {
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    [g.strokeStyle, g.lineWidth] = [stroke, lw];
    g.stroke();
  }
}
function dot(g: Ctx, c: Z, p: P3, f?: string, s?: string, w = 2): void {
  const [cx, cy] = [cxIn(p[0], c, 2), cyIn(p[1], c, 2)];
  const rx = Math.min(cx - c.x - 1.5, c.x + c.w - 1.5 - cx);
  const ry = Math.min(cy - c.y - 1.5, c.y + c.h - 1.5 - cy);
  g.beginPath();
  g.arc(cx, cy, Math.max(0.5, Math.min(p[2], rx, ry)), 0, TAU);
  paint(g, f, s, w);
}
function rbox(g: Ctx, c: Z, b: B, r: number, f?: string, s?: string): void {
  const [l, t] = [cxIn(b.x, c, 1.5), cyIn(b.y, c, 1.5)];
  const bw = Math.max(2, cxIn(b.x + b.w, c, 1.5) - l);
  const bh = Math.max(2, cyIn(b.y + b.h, c, 1.5) - t);
  g.beginPath();
  g.roundRect(l, t, bw, bh, Math.min(r, bw / 2, bh / 2));
  paint(g, f, s, 2.2);
}
function safeRing(g: Ctx, rs: RS, c: Z, s: Slot, r: number, wp = 0.5): void {
  const [cx, cy] = [cxIn(s.x, c, 6), cyIn(s.y, c, 6)];
  const dx = Math.min(cx - c.x - 4, c.x + c.w - 4 - cx);
  const dy = Math.min(cy - c.y - 4, c.y + c.h - 4 - cy);
  const p = Math.max(0, Math.min(1, wp));
  rs.drawRetryRing(g, cx, cy, Math.max(4, Math.min(r, dx, dy) * 0.8), p);
}

export function drawGT029GroupTray(
  ctx: Ctx,
  rs: RS,
  p: GT029GroupTrayParams
): void {
  const { clip: c, groupBounds: gb, catAnchor: ca } = p;
  ctx.save();
  for (const d of p.removedDockRects) {
    rbox(ctx, c, d, 12, alpha(MO.plateInner, 0.38), MO.plateInnerEdge);
  }
  dot(ctx, c, [ca.x, ca.y + 2, ca.r * 1.12], MO.plateMid, MO.plateEdge);
  if (gb && gb.w > 8 && gb.h > 8) {
    ctx.save();
    if (!p.shadowsOff && rs.softShadowsEnabled) {
      ctx.shadowColor = alpha(MO.woodBorder, 0.16);
      [ctx.shadowBlur, ctx.shadowOffsetY] = [8, 2];
    }
    rbox(ctx, c, { ...gb, y: gb.y + 2.5 }, 18, MO.woodBevel);
    ctx.restore();
    const bd = p.isWon ? MO.emeraldBright : MO.woodBorder;
    rbox(ctx, c, gb, 18, alpha(MO.woodTray, 0.92), bd);
    const ib = { x: gb.x + 5, y: gb.y + 5, w: gb.w - 10, h: gb.h - 10 };
    rbox(ctx, c, ib, 14, alpha(MO.paper, 0.88), alpha(MO.woodBevel, 0.6));
  }
  ctx.restore();
}

export function drawGT029ItemUnderlay(
  ctx: Ctx,
  rs: RS,
  p: GT029ItemOverlayParams
): void {
  const { slot: s, clip: c, state: st } = p;
  const r = Math.min(s.w, s.h) * 0.46;
  ctx.save();
  if (st === "idle") {
    const d = rs.reducedMotion ? 0 : Math.sin(p.timeMs * 0.003 + s.index) * 1.4;
    dot(ctx, c, [s.x, s.y + 1.5, r + d], alpha(MO.woodBevel, 0.24));
  } else if (st === "hovered") {
    if (!p.shadowsOff && rs.softShadowsEnabled) {
      [ctx.shadowColor, ctx.shadowBlur] = [alpha(MO.amberDark, 0.22), 7];
    }
    dot(ctx, c, [s.x, s.y, r + 4], alpha(MO.amberLight, 0.56), MO.amberDark);
  } else if (st === "removed") {
    const f = alpha(MO.woodTrayHigh, 0.72);
    dot(ctx, c, [s.x, s.y + 1, r * 0.92], f, MO.woodBorder);
  } else if (st === "correct") {
    dot(ctx, c, [s.x, s.y, r + 3], alpha(SEM[100], 0.55), MO.emeraldBright);
  } else if (st === "wrong") {
    safeRing(ctx, rs, c, s, r + 2, p.wrongProgress);
    dot(ctx, c, [s.x, s.y, r + 2], alpha(MO.amberLight, 0.42), MO.amber);
  } else if (st === "closed") {
    dot(ctx, c, [s.x, s.y, r + 3], alpha(MO.amberGlow, 0.5), MO.amberDark);
  }
  ctx.restore();
}

export function drawGT029ItemOverlay(
  ctx: Ctx,
  _rs: RS,
  p: GT029ItemOverlayParams
): void {
  const { slot: s, clip: c, state: st } = p;
  const r = Math.min(s.w, s.h) * 0.46;
  ctx.save();
  if (st === "removed") {
    dot(ctx, c, [s.x, s.y, r * 0.88], alpha(MO.woodTray, 0.22));
    const [bx, by] = [cxIn(s.x + r * 0.62, c, 6), cyIn(s.y - r * 0.62, c, 6)];
    const br = Math.max(5, Math.min(8, r * 0.26));
    dot(ctx, c, [bx, by, br], MO.amberLight, MO.amberDark, 1.5);
    ctx.beginPath();
    ctx.arc(bx, by, br * 0.52, -Math.PI * 0.75, Math.PI * 0.55);
    const [ax, ay] = [bx - br * 0.37, by - br * 0.37];
    ctx.moveTo(cxIn(ax + br * 0.28, c), cyIn(ay - br * 0.04, c));
    ctx.lineTo(cxIn(ax, c), cyIn(ay, c));
    ctx.lineTo(cxIn(ax + br * 0.04, c), cyIn(ay + br * 0.28, c));
    paint(ctx, undefined, MO.amberDark, 1.6);
  } else if (st === "closed") {
    ctx.setLineDash(D1);
    dot(ctx, c, [s.x, s.y, r + 3], undefined, MO.amberDark, 2.4);
    ctx.setLineDash(D0);
  }
  ctx.restore();
}

const OPT_COLORS: Record<GT029VisualState, readonly [string, string]> = {
  correct: [SEM[100], SEM[600]],
  hovered: [MO.amberGlow, MO.amberDark],
  closed: [MO.amberGlow, MO.amberDark],
  wrong: [MO.amberLight, MO.amberDark],
  idle: [MO.paper, MO.woodBorder],
  removed: [MO.paper, MO.woodBorder],
  locked: [MO.paper, MO.woodBorder],
};

export function drawGT029OptionUnderlay(
  ctx: Ctx,
  rs: RS,
  p: GT029OptionOverlayParams
): void {
  const { slot: s, clip: c, state: st } = p;
  const b: B = { x: s.x - s.w / 2, y: s.y - s.h / 2, w: s.w, h: s.h };
  ctx.save();
  if (st === "locked") {
    ctx.setLineDash(D1);
    rbox(ctx, c, b, 14, alpha(MO.woodTrayHigh, 0.75), MO.woodBorder);
    ctx.setLineDash(D0);
    ctx.restore();
    return;
  }
  if (!p.shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(MO.woodBorder, 0.18);
    const blur = st === "hovered" || st === "correct" ? 8 : 4;
    [ctx.shadowBlur, ctx.shadowOffsetY] = [blur, 2];
  }
  rbox(ctx, c, { ...b, y: b.y + 2.5 }, 14, MO.woodBevel);
  [ctx.shadowBlur, ctx.shadowOffsetY] = [0, 0];
  const [fill, stroke] = OPT_COLORS[st];
  ctx.setLineDash(st === "closed" ? D1 : D0);
  rbox(ctx, c, b, 14, fill, stroke);
  ctx.setLineDash(D0);
  if (st === "wrong") {
    safeRing(ctx, rs, c, s, Math.min(s.w, s.h) * 0.48, p.wrongProgress);
  }
  ctx.restore();
}

export function drawGT029OptionOverlay(
  ctx: Ctx,
  rs: RS,
  p: GT029OptionOverlayParams
): void {
  const { slot: s, clip: c, state: st } = p;
  const r = Math.min(s.w, s.h) * 0.42;
  const [bx, by] = [cxIn(s.x + s.w * 0.32, c, 6), cyIn(s.y - s.h * 0.32, c, 6)];
  const br = Math.max(5, Math.min(8, r * 0.32));
  ctx.save();
  if (st === "locked") {
    dot(ctx, c, [bx, by - br * 0.25, br * 0.45], undefined, MO.woodBorder, 1.5);
    const [lw, lh] = [br * 1.1, br * 0.9];
    const lb = { x: bx - lw / 2, y: by - br * 0.1, w: lw, h: lh };
    rbox(ctx, c, lb, 3, MO.amberLight, MO.woodBorder);
  } else if (st === "correct") {
    dot(ctx, c, [bx, by, br], SEM[500], SURF[0], 1.5);
    ctx.beginPath();
    ctx.moveTo(cxIn(bx - br * 0.4, c), cyIn(by, c));
    ctx.lineTo(cxIn(bx - br * 0.08, c), cyIn(by + br * 0.32, c));
    ctx.lineTo(cxIn(bx + br * 0.42, c), cyIn(by - br * 0.32, c));
    paint(ctx, undefined, SURF[0], 1.8);
    const el = p.winElapsedMs ?? 0;
    if (!(p.particlesOff || rs.reducedMotion) && el >= 0 && el < 700) {
      const [t, dist] = [el / 700, r * (0.85 + (el / 700) * 0.45)];
      for (const a of ANGS) {
        const [px, py] = [s.x + Math.cos(a) * dist, s.y + Math.sin(a) * dist];
        dot(ctx, c, [px, py, 2.2], alpha(MO.amber, 1 - t));
      }
    }
  } else if (st === "closed") {
    dot(ctx, c, [bx, by, br * 0.85], MO.amber, MO.amberDark, 1.5);
  }
  ctx.restore();
}

export function drawGT029ScaffoldOverlay(
  ctx: Ctx,
  rs: RS,
  p: GT029ScaffoldOverlayParams
): void {
  const { clip: c, level, phase, timeMs } = p;
  const wv = rs.reducedMotion ? 0.85 : 0.45 + 0.45 * Math.sin(timeMs * 0.005);
  ctx.save();
  if (level === 1) {
    if (phase === "remove" && p.progressBox) {
      ctx.setLineDash(D1);
      const f = alpha(MO.amberGlow, 0.28);
      rbox(ctx, c, p.progressBox, 12, f, alpha(MO.amberDark, wv));
      ctx.setLineDash(D0);
    }
    p.targetSlots.forEach((s, idx) => {
      const m = 0.4 + 0.5 * Math.sin(timeMs * 0.006 - idx * 0.7);
      const sw = rs.reducedMotion ? 0.8 : m;
      const pt: P3 = [s.x, s.y, Math.min(s.w, s.h) * 0.5];
      dot(ctx, c, pt, alpha(MO.amberGlow, sw * 0.2), alpha(MO.amber, sw));
    });
  } else if (level === 2) {
    ctx.setLineDash(D1);
    for (const s of p.targetSlots) {
      const [bx, by] = [s.x - s.w / 2 - 2, s.y - s.h / 2 - 2];
      const b = { x: bx, y: by, w: s.w + 4, h: s.h + 4 };
      rbox(ctx, c, b, 14, alpha(MO.amberGlow, 0.18), MO.amberDark);
    }
    ctx.setLineDash(D0);
  } else if (level === 3 && p.primarySlot) {
    const s = p.primarySlot;
    const pulse = rs.reducedMotion ? 0 : Math.sin(timeMs * 0.006) * 0.04;
    const rad = Math.min(s.w, s.h) * (0.52 + pulse);
    dot(ctx, c, [s.x, s.y, rad], alpha(MO.amberGlow, 0.26), MO.amberDark, 3);
  }
  ctx.restore();
}
