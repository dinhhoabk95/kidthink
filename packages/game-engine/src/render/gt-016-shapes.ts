import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import type { ClockAngles, ClockTime } from "#src/systems/rotation-system";
import { alpha } from "./color-utils.js";
import { squareBox } from "./shared-render-shapes.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";
import type { SceneBox } from "./types.js";

const cl = designTokens.colors;
const m = cl.montessori;
const warn = cl.semantic.warning;
const TAU = Math.PI * 2;
const SOLID: readonly number[] = [];
const DASH_GHOST: readonly number[] = [5, 4];
const DASH_HINT: readonly number[] = [6, 4];
const PCOLS = [m.amber, m.emerald, warn[400], m.amberBright] as const;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
interface Geom {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}
export interface GT016ClockRenderState {
  readonly stageBox: SceneBox;
  readonly faceBox: SceneBox;
  readonly angles: ClockAngles;
  readonly targetAngles: ClockAngles;
  readonly targetTime: ClockTime;
  readonly hintArc: { readonly d0: number; readonly d1: number } | null;
  readonly minuteStep: 15 | 30 | 60;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly isSetMode: boolean;
  readonly showTargetGhostHands: boolean;
  readonly isWon: boolean;
  readonly wrongClockProgress: number;
  readonly tickPulseProgress: number;
  readonly celebrateProgress: number;
  readonly disableShadows: boolean;
  readonly disableParticles: boolean;
}
export interface GT016ChoiceDecorState {
  readonly isHovered: boolean;
  readonly isHinted: boolean;
  readonly status: "idle" | "correct" | "wrong";
}
type St = GT016ClockRenderState;
type Dec = GT016ChoiceDecorState;

const rad = (deg: number): number => ((deg - 90) * Math.PI) / 180;
const px = (g: Geom, a: number, f: number): number =>
  g.cx + Math.cos(a) * g.r * f;
const py = (g: Geom, a: number, f: number): number =>
  g.cy + Math.sin(a) * g.r * f;
const clp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

function disc(ctx: Ctx, x: number, y: number, r: number, col: string): void {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function lineG(ctx: Ctx, g: Geom, a: number, f0: number, f1: number): void {
  ctx.beginPath();
  ctx.moveTo(px(g, a, f0), py(g, a, f0));
  ctx.lineTo(px(g, a, f1), py(g, a, f1));
  ctx.stroke();
}
function setBoldFont(ctx: Ctx, sizePx: number): void {
  ctx.fillStyle = cl.surface[900];
  applyCanvasFontAtSize(ctx, sizePx, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}
function drawRimTicks(ctx: Ctx, g: Geom, step: 15 | 30 | 60): void {
  for (let h = 1; h <= 12; h++) {
    const maj = h % 3 === 0;
    ctx.strokeStyle = maj ? m.amberDark : cl.surface[400];
    ctx.lineWidth = maj ? 2.6 : 1.6;
    lineG(ctx, g, rad(h * 30), maj ? 0.82 : 0.84, 0.89);
  }
  if (step < 60) {
    const stepDeg = step === 15 ? 90 : 180;
    ctx.strokeStyle = m.amber;
    ctx.lineWidth = 2;
    for (let deg = stepDeg; deg < 360; deg += stepDeg) {
      lineG(ctx, g, rad(deg), 0.84, 0.89);
    }
  }
}
function drawHand(
  ctx: Ctx,
  g: Geom,
  deg: number,
  isH: boolean,
  gh?: boolean
): void {
  const f = isH ? 0.48 : 0.76;
  const w = isH ? Math.max(5.5, g.r * 0.062) : Math.max(4, g.r * 0.04);
  const col = isH ? m.amberDark : m.emerald;
  const a = rad(deg);
  ctx.strokeStyle = gh ? alpha(col, 0.42) : col;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.setLineDash(gh ? DASH_GHOST : SOLID);
  lineG(ctx, g, a, 0, f);
  ctx.setLineDash(SOLID);
  if (!gh) {
    const kf = f * (isH ? 0.72 : 0.86);
    const kr = isH ? Math.max(3.2, w * 0.55) : Math.max(4.5, w * 1.25);
    disc(ctx, px(g, a, kf), py(g, a, kf), kr, isH ? cl.surface[0] : col);
    ctx.strokeStyle = isH ? col : cl.surface[0];
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
}
function drawSetHints(ctx: Ctx, g: Geom, st: St): void {
  ctx.save();
  if (st.hintLevel >= 1) {
    const ha = rad(st.targetTime.hour * 30);
    const hCol = alpha(warn[200], 0.65);
    ctx.setLineDash(DASH_GHOST);
    disc(ctx, px(g, ha, 0.72), py(g, ha, 0.72), g.r * 0.13, hCol);
    ctx.strokeStyle = warn[500];
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash(SOLID);
    if (st.targetTime.minute > 0) {
      const ma = rad(st.targetTime.minute * 6);
      const mr = Math.max(4, g.r * 0.04);
      disc(ctx, px(g, ma, 0.85), py(g, ma, 0.85), mr, warn[400]);
    }
  }
  if (st.hintLevel >= 2 || st.showTargetGhostHands) {
    drawHand(ctx, g, st.targetAngles.hourAngleDeg, true, true);
    drawHand(ctx, g, st.targetAngles.minuteAngleDeg, false, true);
  }
  if (st.hintLevel >= 3 && st.hintArc) {
    const { d0, d1 } = st.hintArc;
    const ccw = ((d1 - d0 + 540) % 360) - 180 < 0;
    const a1 = rad(d1);
    const ta = a1 + (ccw ? -Math.PI / 2 : Math.PI / 2);
    const ax = px(g, a1, 0.58);
    const ay = py(g, a1, 0.58);
    ctx.strokeStyle = warn[500];
    ctx.fillStyle = warn[500];
    ctx.lineWidth = 2.2;
    ctx.setLineDash(DASH_HINT);
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.r * 0.58, rad(d0), a1, ccw);
    ctx.stroke();
    ctx.setLineDash(SOLID);
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(ta) * 5, ay + Math.sin(ta) * 5);
    ctx.lineTo(ax - Math.cos(ta - 0.55) * 6, ay - Math.sin(ta - 0.55) * 6);
    ctx.lineTo(ax - Math.cos(ta + 0.55) * 6, ay - Math.sin(ta + 0.55) * 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function drawParticles(ctx: Ctx, b: SceneBox, g: Geom, p: number): void {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + p * 0.5;
    const f = 0.45 + p * 0.42;
    const x = clp(px(g, a, f), b.x + 8, b.x + b.w - 8);
    const y = clp(py(g, a, f), b.y + 8, b.y + b.h - 8);
    const col = alpha(PCOLS[i % 4] ?? m.amber, 1 - p * 0.8);
    disc(ctx, x, y, Math.max(3, 5 * (1 - p * 0.5)), col);
  }
}
export function drawGT016ClockStage(ctx: Ctx, rs: RS, st: St): void {
  const f = squareBox(st.faceBox);
  const g: Geom = { cx: f.x + f.w / 2, cy: f.y + f.h / 2, r: f.w / 2 };
  ctx.save();
  ctx.save();
  if (rs.softShadowsEnabled && !st.disableShadows) {
    ctx.shadowColor = alpha(m.woodBorder, 0.18);
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
  }
  disc(ctx, g.cx, g.cy, g.r, m.woodBorder);
  ctx.restore();
  ctx.strokeStyle = m.amberDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  let rimCol: string = st.isWon ? m.emerald : cl.surface[200];
  if (st.wrongClockProgress > 0) {
    rimCol = warn[400];
  }
  disc(ctx, g.cx, g.cy, g.r * 0.91, cl.surface[0]);
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = st.wrongClockProgress > 0 ? 4 : 2.5;
  ctx.stroke();
  drawRimTicks(ctx, g, st.minuteStep);
  if (st.isSetMode && (st.hintLevel >= 1 || st.showTargetGhostHands)) {
    drawSetHints(ctx, g, st);
  }
  setBoldFont(ctx, legibleFontPx(Math.floor(g.r * 0.18), rs.viewport?.scale));
  for (let h = 1; h <= 12; h++) {
    const a = rad(h * 30);
    ctx.fillText(String(h), px(g, a, 0.72), py(g, a, 0.72));
  }
  drawHand(ctx, g, st.angles.hourAngleDeg, true);
  drawHand(ctx, g, st.angles.minuteAngleDeg, false);
  if (st.tickPulseProgress > 0 && !rs.reducedMotion) {
    ctx.strokeStyle = alpha(m.amber, (1 - st.tickPulseProgress) * 0.65);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.r * (0.1 + 0.12 * st.tickPulseProgress), 0, TAU);
    ctx.stroke();
  }
  disc(ctx, g.cx, g.cy, Math.max(6, g.r * 0.065), m.amber);
  ctx.strokeStyle = m.amberDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (st.celebrateProgress > 0 && !rs.reducedMotion && !st.disableParticles) {
    drawParticles(ctx, st.stageBox, g, st.celebrateProgress);
  }
  ctx.restore();
}
export function drawGT016TargetBadge(
  ctx: Ctx,
  rs: RS,
  b: SceneBox,
  o: { readonly txt: string; readonly wp: number }
): void {
  const dx = o.wp > 0 && !rs.reducedMotion ? Math.sin(o.wp * 12.56) * 2 : 0;
  const x = b.x + dx;
  ctx.save();
  ctx.fillStyle = m.woodBorder;
  ctx.beginPath();
  ctx.roundRect(x, b.y + 3, b.w, b.h, 10);
  ctx.fill();
  ctx.fillStyle = cl.surface[0];
  ctx.strokeStyle = o.wp > 0 ? warn[500] : m.amberDark;
  ctx.lineWidth = o.wp > 0 ? 3.2 : 2;
  ctx.beginPath();
  ctx.roundRect(x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.stroke();
  setBoldFont(ctx, legibleFontPx(Math.floor(b.h * 0.46), rs.viewport?.scale));
  ctx.fillText(o.txt, x + b.w / 2, b.y + b.h / 2);
  ctx.restore();
}
const CHOICE_STROKE: Record<
  Dec["status"],
  { readonly col: string; readonly w: number }
> = {
  correct: { col: m.emerald, w: 3.2 },
  wrong: { col: warn[500], w: 2.8 },
  idle: { col: m.amber, w: 2.8 },
};
function drawStatusGlyph(ctx: Ctx, bx: number, by: number, ok: boolean): void {
  disc(ctx, bx, by, 8, ok ? m.emerald : warn[500]);
  ctx.strokeStyle = cl.surface[0];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 3.5, ok ? by + 0.5 : by);
  if (ok) {
    ctx.lineTo(bx - 1, by + 3);
  }
  ctx.lineTo(bx + 3.5, ok ? by - 2.5 : by);
  ctx.stroke();
}
export function drawGT016ChoiceDecor(ctx: Ctx, s: Slot, st: Dec): void {
  const x0 = s.x - s.w / 2;
  const y0 = s.y - s.h / 2;
  ctx.save();
  if (st.isHovered || st.isHinted || st.status !== "idle") {
    const cfg = CHOICE_STROKE[st.status];
    ctx.strokeStyle = st.status === "idle" && st.isHinted ? warn[500] : cfg.col;
    ctx.lineWidth = st.isHovered ? 3.5 : cfg.w;
    ctx.setLineDash(st.isHinted && st.status === "idle" ? DASH_HINT : SOLID);
    ctx.beginPath();
    ctx.roundRect(x0 + 3, y0 + 3, s.w - 6, s.h - 6, 10);
    ctx.stroke();
    ctx.setLineDash(SOLID);
  }
  if (st.status !== "idle") {
    drawStatusGlyph(ctx, x0 + s.w - 13, y0 + 13, st.status === "correct");
  }
  ctx.restore();
}
