import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { type FrogNumberLineSpec, frogLineLayout } from "./number-line.js";
import { applyCanvasFontAtSize, canvasFontPx } from "./type-scale.js";
import type { SceneBox } from "./types.js";

type Ctx = CanvasRenderingContext2D;
export interface GT028PondDecorParams {
  readonly captionRect: ZoneRect;
  readonly clip: ZoneRect;
  readonly dockRect?: SceneBox;
  readonly line: FrogNumberLineSpec;
  readonly wrongProgress: number | null;
}
export interface GT028TotalBadgeParams {
  readonly clip: ZoneRect;
  readonly displayedTotal: number;
  readonly dockRect?: SceneBox;
  readonly isCounting: boolean;
  readonly isWon: boolean;
  readonly scalePulse: number;
  readonly shadowsOff: boolean;
  readonly wrongProgress: number | null;
}
export interface GT028LilypadParams {
  readonly clip: ZoneRect;
  readonly label?: string;
  readonly particlesOff: boolean;
  readonly shadowsOff: boolean;
  readonly slot: Slot;
  readonly state: "idle" | "hovered" | "selected" | "correct" | "wrong";
  readonly step: 2 | 5 | 10;
  readonly tapProgress: number | null;
  readonly timeMs: number;
}
export type GT028LilypadState = GT028LilypadParams["state"];
export interface GT028ScaffoldParams {
  readonly badgeBox: SceneBox;
  readonly captionRect: ZoneRect;
  readonly clip: ZoneRect;
  readonly currentTotal: number;
  readonly level: 1 | 2 | 3;
  readonly selectedCount: number;
  readonly step: 2 | 5 | 10;
  readonly targetSlot: Slot | null;
  readonly targetTotal: number;
  readonly ticks: number;
  readonly timeMs: number;
}
const { montessori: MO, surface: SF, semantic: SEM } = designTokens.colors;
const [D0, D1, D2]: [number[], number[], number[]] = [[], [5, 4], [7, 5]];
const ANGS = [0.3, 1.35, 2.4, 3.45, 4.5, 5.55] as const;
type StyleRow = readonly [string, string, number];
const LILY_STYLE: Readonly<Record<GT028LilypadState, StyleRow>> = {
  correct: [alpha(SEM.success[100], 0.72), MO.emeraldBright, 3],
  selected: [alpha(MO.emeraldLight, 0.55), MO.emerald, 2.8],
  hovered: [alpha(MO.amberLight, 0.58), MO.amberDark, 2.5],
  wrong: [alpha(MO.amberLight, 0.38), MO.amber, 2.5],
  idle: [alpha(MO.emeraldLight, 0.24), alpha(MO.emerald, 0.42), 1.8],
};
const cxIn = (x: number, c: ZoneRect, p = 1): number =>
  Math.max(c.x + p, Math.min(c.x + c.w - p, x));
const cyIn = (y: number, c: ZoneRect, p = 1): number =>
  Math.max(c.y + p, Math.min(c.y + c.h - p, y));
function box(x: number, y: number, w: number, h: number): SceneBox {
  return { x, y, w, h };
}
function paint(g: Ctx, f = "", s = "", lw = 2): void {
  [g.fillStyle, g.strokeStyle, g.lineWidth] = [f, s, lw];
  if (f) {
    g.fill();
  }
  if (s) {
    g.stroke();
  }
}
function dot(g: Ctx, c: ZoneRect, p: number[], f?: string, s?: string): void {
  const [cx, cy] = [cxIn(p[0] ?? 0, c, 2), cyIn(p[1] ?? 0, c, 2)];
  const dx = Math.min(cx - c.x - 1, c.x + c.w - 1 - cx);
  const dy = Math.min(cy - c.y - 1, c.y + c.h - 1 - cy);
  g.beginPath();
  g.arc(cx, cy, Math.max(0.5, Math.min(p[2] ?? 1, dx, dy)), 0, Math.PI * 2);
  paint(g, f, s, p[3] ?? 2);
}
function rbox(g: Ctx, c: ZoneRect, b: SceneBox, f?: string, s?: string): void {
  const [l, t] = [cxIn(b.x, c, 1), cyIn(b.y, c, 1)];
  const bw = Math.max(2, cxIn(b.x + b.w, c, 1) - l);
  const bh = Math.max(2, cyIn(b.y + b.h, c, 1) - t);
  g.beginPath();
  g.roundRect(l, t, bw, bh, Math.min(10, bw / 2, bh / 2));
  paint(g, f, s, 2.2);
}
function seg(g: Ctx, c: ZoneRect, p: number[]): void {
  g.beginPath();
  g.moveTo(cxIn(p[0] ?? 0, c, 2), cyIn(p[1] ?? 0, c, 2));
  g.lineTo(cxIn(p[2] ?? 0, c, 2), cyIn(p[3] ?? 0, c, 2));
  g.stroke();
}
function setBadgeFont(g: Ctx, rs: RenderSystem, col: string): number {
  const fontPx = canvasFontPx(rs.logicSpace, "badge", rs.viewport?.scale);
  applyCanvasFontAtSize(g, fontPx, "sans", "bold");
  [g.textAlign, g.textBaseline, g.fillStyle] = ["center", "middle", col];
  return fontPx;
}
function tickX(rect: ZoneRect, ticks: number, idx: number): number {
  const l = frogLineLayout(rect, Math.max(1, ticks));
  return l.tickXs[Math.max(0, idx)] ?? l.overflowX;
}
export function computeGT028TotalBadgeBox(
  stage: ZoneRect,
  dock?: SceneBox,
  w = 52,
  h = 36
): SceneBox {
  if (!dock || dock.x - stage.x >= w + 10) {
    const x = dock ? dock.x - w - 8 : stage.x + 12;
    return box(x, dock ? dock.y + 8 : stage.y + 48, w, h);
  }
  const cx = stage.x + (stage.w - w) / 2;
  if (dock.y - (stage.y + 44) >= h + 4) {
    return box(cx, dock.y - h - 3, w, h);
  }
  const below = stage.y + stage.h - (dock.y + dock.h) >= h + 4;
  const y = below ? dock.y + dock.h + 3 : Math.max(stage.y + 45, dock.y - 2);
  return box(below ? cx : dock.x + (dock.w - w) / 2, y, w, h);
}
export function drawGT028PondTrackDecor(
  g: Ctx,
  rs: RenderSystem,
  p: GT028PondDecorParams
): void {
  const { clip: c, captionRect: cap, dockRect: d, wrongProgress: wp } = p;
  const { ticks: tk, fromTick: f0, toTick: f1, hopElapsedMs: hm } = p.line;
  g.save();
  if (wp !== null && d) {
    const ib = box(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
    const col = alpha(MO.amberDark, (1 - wp) * 0.85);
    rbox(g, c, ib, alpha(MO.amberLight, (1 - wp) * 0.18), col);
  }
  const pad = box(cap.x + 2, cap.y + 2, cap.w - 4, cap.h - 4);
  rbox(g, c, pad, alpha(MO.emeraldLight, 0.2), alpha(MO.emerald, 0.3));
  if (f0 !== f1 && hm < 520) {
    const l = frogLineLayout(cap, Math.max(1, tk));
    const [x0, x1] = [tickX(cap, tk, f0), tickX(cap, tk, f1)];
    const [mx, my] = [(x0 + x1) / 2, l.lineY - 12];
    [g.strokeStyle, g.lineWidth] = [alpha(MO.amberDark, 0.65), 2];
    g.setLineDash(D1);
    seg(g, c, [x0, l.lineY - 2, mx, my]);
    seg(g, c, [mx, my, x1, l.lineY - 2]);
    g.setLineDash(D0);
    const prog = rs.reducedMotion ? 0.5 : Math.min(1, hm / 520);
    const col = alpha(MO.emerald, (1 - prog * 0.7) * 0.75);
    dot(g, c, [x1, l.lineY, 4 + prog * 7, 1.8], "", col);
  }
  g.restore();
}
function badgeCol(p: GT028TotalBadgeParams): readonly [string, string] {
  const sc = SEM.success[100];
  if (p.isWon || p.wrongProgress !== null) {
    return p.isWon ? [sc, MO.emerald] : [MO.amberLight, MO.amberDark];
  }
  return p.isCounting ? [SF[50], MO.emerald] : [MO.paper, MO.woodBorder];
}
export function drawGT028RunningTotalBadge(
  g: Ctx,
  rs: RenderSystem,
  p: GT028TotalBadgeParams
): SceneBox {
  const { clip: c, dockRect: dk, wrongProgress: wp } = p;
  g.save();
  const textCol = p.isWon ? SEM.success[700] : SF[900];
  const fontPx = setBadgeFont(g, rs, textCol);
  const bw = Math.max(52, Math.round(fontPx * 2.2));
  const bh = Math.max(36, Math.round(fontPx * 1.45));
  const base = computeGT028TotalBadgeBox(c, dk, bw, bh);
  const shk = wp && !rs.reducedMotion ? Math.sin(wp * 12.56) * 4 * (1 - wp) : 0;
  const d = rs.reducedMotion ? 0 : p.scalePulse * 2;
  const b = box(base.x + shk - d, base.y - d, base.w + d * 2, base.h + d * 2);
  if (!p.shadowsOff && rs.softShadowsEnabled) {
    rbox(g, c, box(b.x, b.y + 2, b.w, b.h), MO.woodBevel);
  }
  const [bg, bd] = badgeCol(p);
  rbox(g, c, b, bg, bd);
  g.fillStyle = textCol;
  const [tx, ty] = [cxIn(b.x + b.w / 2, c), cyIn(b.y + b.h / 2, c)];
  g.fillText(String(p.displayedTotal), tx, ty);
  g.restore();
  return base;
}
function lilyDr(rs: RenderSystem, p: GT028LilypadParams): number {
  if (p.state === "hovered") {
    return rs.reducedMotion ? 1 : 3;
  }
  const wave = Math.sin(p.timeMs / 540 + p.slot.index);
  return p.state === "idle" && !rs.reducedMotion ? wave : 0;
}
export function drawGT028LilypadSlotBase(
  g: Ctx,
  rs: RenderSystem,
  p: GT028LilypadParams
): void {
  const { clip: c, slot: s, state: st, tapProgress: tapP } = p;
  const r = Math.min(s.w, s.h) / 2 + lilyDr(rs, p);
  g.save();
  if (!p.shadowsOff && rs.softShadowsEnabled) {
    dot(g, c, [s.x, s.y + 2, r], alpha(MO.woodBorder, 0.2));
  }
  const [fl, bd, lw] = LILY_STYLE[st];
  g.setLineDash(st === "hovered" ? D1 : D0);
  dot(g, c, [s.x, s.y, r, lw], fl, bd);
  g.setLineDash(D0);
  [g.strokeStyle, g.lineWidth] = [bd, 1.5];
  seg(g, c, [s.x, s.y, s.x + r * 0.68, s.y - r * 0.42]);
  if (tapP !== null && tapP < 1) {
    const col = alpha(MO.emerald, (1 - tapP) * 0.7);
    dot(g, c, [s.x, s.y, r + 3 + tapP * 9, 2], "", col);
  }
  if (st === "correct" && !rs.reducedMotion && !p.particlesOff) {
    const d = r + 5;
    for (const a of ANGS) {
      dot(g, c, [s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, 2], MO.amber);
    }
  }
  g.restore();
}
export function drawGT028BrokenAssetFallback(
  g: Ctx,
  rs: RenderSystem,
  p: GT028LilypadParams
): void {
  const { clip: c, slot: s, step, label } = p;
  const r = Math.min(s.w, s.h) * 0.38;
  g.save();
  dot(g, c, [s.x, s.y, r, 2], MO.paper, MO.woodBorder);
  const [cols, rows] = [step === 2 ? 2 : 5, step === 10 ? 2 : 1];
  const pr = Math.max(2, Math.min(4.5, r / (cols + 1)));
  for (let i = 0; i < step; i++) {
    const px = s.x + ((i % cols) - (cols - 1) / 2) * pr * 2.4;
    const py = s.y + (Math.floor(i / cols) - (rows - 1) / 2) * pr * 2.6;
    dot(g, c, [px, py - (label ? 4 : 0), pr, 1], MO.amber, MO.amberDark);
  }
  if (label) {
    setBadgeFont(g, rs, SF[900]);
    g.fillText(label, cxIn(s.x, c), cyIn(s.y + r * 0.58, c));
  }
  g.restore();
}
function scaffoldL2(g: Ctx, rs: RenderSystem, v: GT028ScaffoldParams): void {
  const { clip: c, captionRect: cap, badgeBox: bb, selectedCount: cur } = v;
  const l = frogLineLayout(cap, Math.max(1, v.ticks));
  const nxt = v.currentTotal > v.targetTotal ? Math.max(0, cur - 1) : cur + 1;
  const [x0, x1] = [tickX(cap, v.ticks, cur), tickX(cap, v.ticks, nxt)];
  [g.strokeStyle, g.lineWidth] = [MO.amberDark, 2.5];
  g.setLineDash(D2);
  seg(g, c, [x0, l.lineY - 6, (x0 + x1) / 2, l.lineY - 15]);
  seg(g, c, [(x0 + x1) / 2, l.lineY - 15, x1, l.lineY - 6]);
  g.setLineDash(D0);
  dot(g, c, [x1, l.lineY, 6, 2], alpha(MO.amberGlow, 0.5), MO.amberDark);
  if (v.currentTotal < v.targetTotal) {
    const lim = Math.min(v.currentTotal + v.step, v.targetTotal - v.step);
    const n = Math.max(0, Math.floor(lim / v.step));
    const nums = Array.from({ length: n }, (_, i) => (i + 1) * v.step);
    const seq = nums.length > 0 ? `${nums.join(" · ")} · ?` : "?";
    const left = bb.x - c.x < (c.w - bb.w) * 0.35;
    const sx = cxIn(left ? bb.x + bb.w / 2 : bb.x + bb.w + 42, c, 36);
    const sy = cyIn(left ? bb.y + bb.h + 15 : bb.y + bb.h / 2, c, 14);
    setBadgeFont(g, rs, alpha(MO.amberDark, 0.72));
    g.fillText(seq, sx, sy);
  }
}
export function drawGT028ScaffoldOverlay(
  g: Ctx,
  rs: RenderSystem,
  v: GT028ScaffoldParams
): void {
  const { clip: c, captionRect: cap, badgeBox: bb } = v;
  const l = frogLineLayout(cap, Math.max(1, v.ticks));
  const a = rs.reducedMotion ? 0.85 : 0.45 + 0.45 * Math.sin(v.timeMs * 0.005);
  g.save();
  if (v.level === 1) {
    const stroke = alpha(MO.amberDark, a);
    g.setLineDash(D1);
    dot(g, c, [l.badgeX, cap.y + cap.h / 2, 18, 2.5], "", stroke);
    rbox(g, c, bb, alpha(MO.amberLight, a * 0.28), stroke);
    g.setLineDash(D0);
  } else if (v.level === 2) {
    scaffoldL2(g, rs, v);
  } else if (v.targetSlot) {
    const { x, y, w, h } = v.targetSlot;
    const [fl, st] = [alpha(MO.amberGlow, a * 0.25), alpha(MO.amberDark, a)];
    dot(g, c, [x, y, Math.min(w, h) * 0.56, 3], fl, st);
  } else if (v.currentTotal === v.targetTotal) {
    const bar = box(c.x + c.w * 0.3, c.y + c.h - 14, c.w * 0.4, 10);
    rbox(g, c, bar, alpha(MO.amberGlow, a * 0.4), MO.amberDark);
  }
  g.restore();
}
