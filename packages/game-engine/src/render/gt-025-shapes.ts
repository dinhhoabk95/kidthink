import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import type { SceneBox } from "#src/render/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type GT025VisualState = "idle" | "hovered" | "wrong" | "correct" | "end";

export interface GT025FrameDrawOpts {
  readonly clip: ZoneRect;
  readonly isWon: boolean;
  readonly leftBox: SceneBox;
  readonly rightBox: SceneBox;
  readonly shadowsOff: boolean;
}

export interface GT025ItemEffectOpts {
  readonly clip: ZoneRect;
  readonly forcePlaceholder?: boolean;
  readonly foundElapsedMs?: number;
  readonly isRightSide?: boolean;
  readonly partnerSlot?: Slot;
  readonly particlesOff: boolean;
  readonly slot: Slot;
  readonly state: GT025VisualState;
  readonly timeMs: number;
  readonly wrongProgress?: number;
}

export interface GT025ScaffoldVisual {
  readonly clip: ZoneRect;
  readonly leftRegion?: SceneBox;
  readonly leftSlot: Slot;
  readonly level: 1 | 2 | 3;
  readonly rightRegion?: SceneBox;
  readonly rightSlot: Slot;
  readonly timeMs: number;
}

type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type Z = ZoneRect;
type B = SceneBox;
type FOpts = GT025FrameDrawOpts;
type EOpts = GT025ItemEffectOpts;
type SVis = GT025ScaffoldVisual;
const MO = designTokens.colors.montessori;
const SURF = designTokens.colors.surface;
const SEM = designTokens.colors.semantic.success;
const D0: number[] = [];
const D1: number[] = [8, 6];
const D2: number[] = [6, 5];
const ANGS = [0.45, 2.02, 3.6, 5.18] as const;

export function resolveGT025VisualState(s: boolean[]): GT025VisualState {
  const k: GT025VisualState[] = ["correct", "wrong", "end", "hovered"];
  const idx = s.findIndex(Boolean);
  return (idx >= 0 ? k[idx] : undefined) ?? "idle";
}

function cxIn(x: number, c: Z, p = 1): number {
  return Math.max(c.x + p, Math.min(c.x + c.w - p, x));
}
function cyIn(y: number, c: Z, p = 1): number {
  return Math.max(c.y + p, Math.min(c.y + c.h - p, y));
}

function paint(ctx: Ctx, fill?: string, stroke?: string, lw = 2): void {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function dot(g: Ctx, c: Z, p: number[], f?: string, s?: string, w = 2): void {
  const cx = cxIn(p[0] ?? 0, c, 2);
  const cy = cyIn(p[1] ?? 0, c, 2);
  const dx = Math.min(cx - c.x - 1, c.x + c.w - 1 - cx);
  const dy = Math.min(cy - c.y - 1, c.y + c.h - 1 - cy);
  g.beginPath();
  g.arc(cx, cy, Math.max(0.5, Math.min(p[2] ?? 1, dx, dy)), 0, Math.PI * 2);
  paint(g, f, s, w);
}

function rbox(g: Ctx, c: Z, b: B, r: number, f?: string, s?: string): void {
  const l = cxIn(b.x, c, 1);
  const t = cyIn(b.y, c, 1);
  const w = Math.max(2, cxIn(b.x + b.w, c, 1) - l);
  const h = Math.max(2, cyIn(b.y + b.h, c, 1) - t);
  g.beginPath();
  g.roundRect(l, t, w, h, Math.min(r, w / 2, h / 2));
  paint(g, f, s, 2);
}

function seg(ctx: Ctx, c: Z, ...p: number[]): void {
  ctx.beginPath();
  ctx.moveTo(cxIn(p[0] ?? 0, c, 2), cyIn(p[1] ?? 0, c, 2));
  ctx.lineTo(cxIn(p[2] ?? 0, c, 2), cyIn(p[3] ?? 0, c, 2));
  ctx.stroke();
}

function drawFrame(ctx: Ctx, rs: RS, b: B, o: FOpts): void {
  const c = o.clip;
  ctx.save();
  ctx.save();
  if (!o.shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(MO.woodBorder, 0.16);
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }
  rbox(ctx, c, { x: b.x, y: b.y + 2, w: b.w, h: b.h }, 16, MO.woodBevel);
  ctx.restore();
  const bd = o.isWon ? MO.emeraldBright : MO.woodBorder;
  rbox(ctx, c, b, 16, alpha(MO.paper, 0.94), bd);
  const i = Math.min(6, Math.max(3, Math.min(b.w, b.h) * 0.04));
  const ib = { x: b.x + i, y: b.y + i, w: b.w - i * 2, h: b.h - i * 2 };
  rbox(ctx, c, ib, 12, alpha(SURF[50], 0.88), alpha(MO.woodBevel, 0.65));
  const po = Math.max(5, i * 1.1);
  for (const px of [b.x + po, b.x + b.w - po]) {
    dot(ctx, c, [px, b.y + po, 2], MO.woodBorder);
    dot(ctx, c, [px, b.y + b.h - po, 2], MO.woodBorder);
  }
  ctx.restore();
}

export function drawGT025ComparisonFrames(ctx: Ctx, rs: RS, o: FOpts): void {
  const { leftBox: lb, rightBox: rb, clip: c } = o;
  drawFrame(ctx, rs, lb, o);
  drawFrame(ctx, rs, rb, o);
  const mx = (lb.x + lb.w + rb.x) / 2;
  const ty = Math.min(lb.y, rb.y) + 6;
  const by = Math.max(lb.y + lb.h, rb.y + rb.h) - 6;
  ctx.save();
  ctx.strokeStyle = alpha(MO.woodBorder, 0.45);
  ctx.lineWidth = 2;
  ctx.setLineDash(D2);
  seg(ctx, c, mx, ty, mx, by);
  ctx.setLineDash(D0);
  const gap = rb.x - (lb.x + lb.w);
  if (gap >= 10) {
    const cy = (ty + by) / 2;
    const lr = Math.min(9, Math.max(5, gap * 0.36));
    ctx.strokeStyle = MO.amberDark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    seg(ctx, c, mx + lr * 0.65, cy + lr * 0.65, mx + lr * 1.35, cy + lr * 1.35);
    dot(ctx, c, [mx, cy, lr], alpha(MO.amberLight, 0.92), MO.amberDark);
  }
  ctx.restore();
}

function drawRipples(ctx: Ctx, rs: RS, o: EOpts, r: number): void {
  const { slot: s, clip: c } = o;
  const p = Math.min(1, Math.max(0, o.wrongProgress ?? 0.5));
  rs.drawRetryRing(ctx, s.x, s.y, r + 2, p);
  for (const wv of [0, 0.35]) {
    const wp = Math.min(1, Math.max(0, (p - wv) / (1 - wv)));
    if (wp > 0) {
      const col = alpha(MO.amberDark, (1 - wp) * 0.65);
      dot(ctx, c, [s.x, s.y, r + 3 + wp * 10], undefined, col);
    }
  }
}

function drawToken(ctx: Ctx, rs: RS, o: EOpts, r: number): void {
  const { slot: s, clip: c, state: st } = o;
  const [bg0, bd0] =
    st === "correct" ? [SEM[100], SEM[600]] : [SURF[0], MO.woodBevel];
  const bg = st === "hovered" ? MO.amberLight : bg0;
  const bd = st === "hovered" ? MO.amberDark : bd0;
  rs.drawClayBody(ctx, s.x, s.y, r, bg, bd, "circle");
  const d = Math.max(6, r * 0.42);
  ctx.beginPath();
  ctx.moveTo(cxIn(s.x, c), cyIn(s.y - d, c));
  ctx.lineTo(cxIn(s.x + d, c), cyIn(s.y, c));
  ctx.lineTo(cxIn(s.x, c), cyIn(s.y + d, c));
  ctx.lineTo(cxIn(s.x - d, c), cyIn(s.y, c));
  ctx.closePath();
  paint(ctx, alpha(MO.amber, 0.78), MO.amberDark, 2);
  dot(ctx, c, [s.x, s.y, Math.max(2, d * 0.32)], SURF[0]);
}

export function drawGT025ItemEffectUnderlay(ctx: Ctx, rs: RS, o: EOpts): void {
  const { slot: s, clip: c, state: st } = o;
  const r = Math.min(s.w, s.h) / 2;
  ctx.save();
  if (st === "idle") {
    const p = rs.reducedMotion ? 0 : Math.sin(o.timeMs / 520 + s.index);
    dot(ctx, c, [s.x, s.y + 1.5, r + 1.5 + p], alpha(MO.woodBevel, 0.22));
  } else if (st === "hovered") {
    const fl = alpha(MO.amberLight, 0.58);
    dot(ctx, c, [s.x, s.y, r + 5], fl, MO.amberDark, 2.5);
  } else if (st === "wrong") {
    drawRipples(ctx, rs, o, r);
  } else {
    const col = st === "correct" ? MO.emeraldBright : MO.amberLight;
    dot(ctx, c, [s.x, s.y, r + 4], alpha(col, st === "correct" ? 0.22 : 0.42));
  }
  if (o.forcePlaceholder) {
    drawToken(ctx, rs, o, r);
  }
  ctx.restore();
}

function canSparkle(rs: RS, o: EOpts): boolean {
  const ok = o.state === "correct" && (o.foundElapsedMs ?? 999) < 650;
  return ok && !o.particlesOff && !rs.reducedMotion;
}

export function drawGT025ItemEffectOverlay(ctx: Ctx, rs: RS, o: EOpts): void {
  const { slot: s, clip: c } = o;
  const r = Math.min(s.w, s.h) / 2;
  ctx.save();
  if (canSparkle(rs, o)) {
    const p = (o.foundElapsedMs ?? 0) / 650;
    const dist = r + 4 + p * 8;
    const col = alpha(MO.emeraldBright, (1 - p) * 0.85);
    for (const a of ANGS) {
      const pt = [s.x + Math.cos(a) * dist, s.y + Math.sin(a) * dist, 2.2];
      dot(ctx, c, pt, undefined, col);
    }
    if (o.partnerSlot && !o.isRightSide) {
      ctx.strokeStyle = alpha(MO.emeraldBright, (1 - p) * 0.45);
      ctx.setLineDash(D2);
      seg(ctx, c, s.x, s.y, o.partnerSlot.x, o.partnerSlot.y);
      ctx.setLineDash(D0);
    }
  } else if (o.state === "end") {
    const ang = (o.timeMs / 450) * Math.PI + (o.isRightSide ? 1.5 : 0);
    const ph = rs.reducedMotion ? 0.85 : 0.45 + 0.45 * Math.sin(ang);
    ctx.setLineDash(D2);
    dot(ctx, c, [s.x, s.y, r + 4], undefined, alpha(MO.amberDark, ph), 2.5);
    ctx.setLineDash(D0);
  }
  ctx.restore();
}

export function drawGT025ScaffoldOverlay(ctx: Ctx, rs: RS, v: SVis): void {
  const { clip: c, leftSlot: ls, rightSlot: rsSlot } = v;
  ctx.save();
  if (v.level === 1 && v.leftRegion && v.rightRegion) {
    ctx.setLineDash(D1);
    for (const box of [v.leftRegion, v.rightRegion]) {
      rbox(ctx, c, box, 14, alpha(MO.amberLight, 0.16), MO.amber);
    }
    ctx.setLineDash(D0);
  } else if (v.level === 2) {
    const rL = Math.min(ls.w, ls.h) * 0.58;
    const rR = Math.min(rsSlot.w, rsSlot.h) * 0.58;
    ctx.setLineDash(D2);
    dot(ctx, c, [ls.x, ls.y, rL], undefined, MO.amberDark, 2.5);
    dot(ctx, c, [rsSlot.x, rsSlot.y, rR], undefined, MO.amberDark, 2.5);
    ctx.strokeStyle = alpha(MO.amber, 0.55);
    seg(ctx, c, ls.x + rL, ls.y, rsSlot.x - rR, rsSlot.y);
    ctx.setLineDash(D0);
  } else if (v.level === 3) {
    const cyc = (v.timeMs % 1600) / 1600;
    for (const i of [0, 1] as const) {
      const s = i === 0 ? ls : rsSlot;
      const ph = cyc + i * 0.5;
      const wv = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(ph * Math.PI * 2));
      const a = rs.reducedMotion ? 0.85 : wv;
      const fl = alpha(MO.amberGlow, a * 0.25);
      const rad = Math.min(s.w, s.h) * 0.6;
      dot(ctx, c, [s.x, s.y, rad], fl, alpha(MO.amberDark, a), 3);
    }
  }
  ctx.restore();
}
