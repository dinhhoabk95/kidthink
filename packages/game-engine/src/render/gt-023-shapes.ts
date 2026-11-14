import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import {
  drawGlyphInSlot as dG,
  drawTextInSlot as dT,
  resolveEmojiGlyph as rE,
} from "./shared-render.js";
import type * as T from "./types.js";

const C = designTokens.colors;
const [m, sc, TAU] = [C.montessori, C.semantic.success, Math.PI * 2];
const [EMOJI_CODE_RE, LETTER_RE] = [/^EMJ-[a-z0-9-]+$/i, /\p{L}/u];
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type AO = T.GT023AnchorOverlayParams;
type MC = T.GT023ModelCardParams;
type TP = T.GT023TrayPartParams;
type WB = T.GT023WorkbenchParams;
type SB = T.SceneBox;
type Arc3 = readonly [number, number, number];
type Box4 = readonly [number, number, number, number];
const EMBLEMS = [
  [m.amber, m.amberDark, 6, 0.46, 0.46],
  [m.coral, m.woodBorder, 8, 0.48, 0.24],
  [m.indigo, C.brand[600], 8, 0.44, 0.44],
  [m.emeraldBright, m.emerald, 10, 0.46, 0.28],
] as const;
const [SX, SY] = [[-1, 1, -1, 1] as const, [-1, -1, 1, 1] as const];
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function style(ctx: Ctx, fill: string, stroke: string, lw: number): void {
  [ctx.fillStyle, ctx.strokeStyle, ctx.lineWidth] = [fill, stroke, lw];
}
function clampPt(x: number, y: number, st?: SB) {
  return st
    ? [cl(x, st.x + 2, st.x + st.w - 2), cl(y, st.y + 2, st.y + st.h - 2)]
    : [x, y];
}
function clampBox(b: Box4, st?: SB): Box4 {
  const x0 = st ? Math.max(st.x + 1, b[0]) : b[0];
  const y0 = st ? Math.max(st.y + 1, b[1]) : b[1];
  const x1 = st ? Math.min(st.x + st.w - 1, b[0] + b[2]) : b[0] + b[2];
  const y1 = st ? Math.min(st.y + st.h - 1, b[1] + b[3]) : b[1] + b[3];
  return [x0, y0, Math.max(2, x1 - x0), Math.max(2, y1 - y0)];
}
function clampArc(cx: number, cy: number, r: number, st?: SB): Arc3 {
  const [sx = cx, sy = cy] = clampPt(cx, cy, st);
  const rx = st ? Math.min(sx - st.x - 1, st.x + st.w - 1 - sx) : r;
  const ry = st ? Math.min(sy - st.y - 1, st.y + st.h - 1 - sy) : r;
  return [sx, sy, Math.max(1, Math.min(r, rx, ry))];
}
function rPath(ctx: Ctx, b: Box4, r: number, st?: SB, stroke = true, sh = 0) {
  const cb = clampBox(b, st);
  ctx.beginPath();
  const rad = cl(r, 2, Math.min(cb[2], cb[3]) / 2);
  ctx.roundRect(cb[0], cb[1], cb[2], cb[3], rad);
  ctx.save();
  ctx.shadowColor = alpha(m.woodBorder, 0.22);
  [ctx.shadowBlur, ctx.shadowOffsetY] = [sh, sh > 6 ? 4 : sh / 3];
  ctx.fill();
  ctx.restore();
  ctx[stroke ? "stroke" : "fill"]();
}
function circ(ctx: Ctx, c: Arc3, stroke = true): void {
  ctx.beginPath();
  ctx.arc(c[0], c[1], c[2], 0, TAU);
  ctx.fill();
  ctx[stroke ? "stroke" : "fill"]();
}
function assetHash(a: T.RenderAsset | undefined): number {
  const u = a?.kind === "image" ? a.path : undefined;
  const t = a?.kind === "text" ? a.text : undefined;
  const raw = u ?? t ?? (a?.kind === "emoji" ? a.ref : "");
  return [...raw].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 0);
}
type ET = (typeof EMBLEMS)[number];
function drawEmblem(ctx: Ctx, c: Arc3, spec: ET = EMBLEMS[0]): void {
  ctx.save();
  style(ctx, spec[0], spec[1], 2);
  ctx.beginPath();
  for (let i = 0; i < spec[2]; i++) {
    const ang = (i * TAU) / spec[2] - Math.PI / 2;
    const d = c[2] * (i % 2 === 0 ? spec[3] : spec[4]);
    const [px, py] = [c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d];
    ctx[i === 0 ? "moveTo" : "lineTo"](px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawContent(ctx: Ctx, c: Arc3, a: T.RenderAsset | undefined): void {
  const [x, y, r] = c;
  const [d, role] = [r * 2, "source" as const];
  const box = { index: 0, page: 0, role, x, y, w: d, h: d, hitW: d, hitH: d };
  const res = a?.kind === "emoji" && a.ref.trim() ? rE(a.ref.trim()) : null;
  if (res && !EMOJI_CODE_RE.test(res)) {
    dG(ctx, res, box);
    return;
  }
  const txt = a?.kind === "text" ? a.text.trim() : "";
  if (txt.length > 0 && !LETTER_RE.test(txt) && !EMOJI_CODE_RE.test(txt)) {
    dT(ctx, txt, box, C.brand[600]);
    return;
  }
  drawEmblem(ctx, c, EMBLEMS[assetHash(a) % 4]);
}
function drawCheckBadge(ctx: Ctx, c: Arc3, st?: SB): void {
  const [d, br] = [c[2] * 0.56, Math.max(7, c[2] * 0.28)];
  const [bx, by, r] = clampArc(c[0] + d, c[1] - d, br, st);
  const arm = r * 0.52;
  ctx.save();
  style(ctx, m.emeraldBright, m.emerald, 1.8);
  circ(ctx, [bx, by, r], true);
  style(ctx, C.surface[0], C.surface[0], 2.2);
  [ctx.lineCap, ctx.lineJoin] = ["round", "round"];
  ctx.beginPath();
  ctx.moveTo(bx - arm * 0.7, by);
  ctx.lineTo(bx - arm * 0.1, by + arm * 0.6);
  ctx.lineTo(bx + arm * 0.75, by - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}
function drawPegs(ctx: Ctx, b: Box4, fill: string, st?: SB): void {
  const cb = clampBox(b, st);
  style(ctx, fill, alpha(C.surface[0], 0.5), 1.4);
  ctx.beginPath();
  ctx.moveTo(cb[0] + 9, cb[1] + 2.2);
  ctx.lineTo(cb[0] + cb[2] - 9, cb[1] + 2.2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const px = cb[0] + cb[2] * (0.5 + (SX[i] ?? 1) * 0.36);
    const py = cb[1] + cb[3] * (0.5 + (SY[i] ?? 1) * 0.36);
    circ(ctx, clampArc(px, py, 2.2, st), false);
  }
}
export function drawGT023Workbench(ctx: Ctx, rs: RS, p: WB): void {
  const [st, slots, won] = [p.stageRect, p.anchorSlots, p.isWon];
  ctx.save();
  if (st && st.w > 12 && st.h > 12) {
    const rad = Math.min(20, Math.min(st.w, st.h) * 0.08);
    style(ctx, alpha(m.woodTray, 0.22), alpha(m.woodBorder, 0.5), 2.4);
    rPath(ctx, [st.x + 2, st.y + 2, st.w - 4, st.h - 4], rad, st);
  }
  if (slots.length >= 2) {
    const lCol = won ? m.emeraldBright : alpha(m.woodBorder, 0.35);
    style(ctx, C.surface[0], lCol, won ? 3.2 : 2);
    ctx.setLineDash(won ? [] : [6, 5]);
    ctx.beginPath();
    slots.forEach((s, i) => {
      const [px = s.x, py = s.y] = clampPt(s.x, s.y, st);
      ctx[i === 0 ? "moveTo" : "lineTo"](px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (won && slots.length > 0) {
    const [xs, ys] = [slots.map((s) => s.x), slots.map((s) => s.y)];
    const pad = Math.max(...slots.map((s) => Math.max(s.w, s.h))) * 0.62;
    const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
    const [w, h] = [Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0];
    const wEl = p.winElapsedMs ?? 0;
    const a = rs.reducedMotion ? 0.16 : 0.22 + Math.sin(wEl * 0.006) * 0.05;
    style(ctx, alpha(m.emeraldBright, a), m.emeraldBright, 2.8);
    rPath(ctx, [x0, y0, w, h], 16, st);
  }
  ctx.restore();
}
export function drawGT023ModelCard(ctx: Ctx, rs: RS, p: MC): void {
  const { box, isWon: w, isHovered: h, stageRect: st } = p;
  const dy = h ? 1.5 : 0;
  const b: Box4 = [box.x - box.w / 2, box.y - box.h / 2 + dy, box.w, box.h];
  const sh = rs.softShadowsEnabled && p.softShadows !== false ? 6 : 0;
  ctx.save();
  ctx.fillStyle = m.woodBorder;
  rPath(ctx, [b[0], b[1] + (h ? 1 : 2.4), b[2], b[3]], 12, st, false);
  const fh = h ? m.amberLight : m.woodTrayHigh;
  const stk = h ? C.brand[500] : m.woodBorder;
  style(ctx, w ? sc[50] : fh, w ? m.emeraldBright : stk, w || h ? 2.8 : 2.2);
  rPath(ctx, b, 12, st, true, sh);
  const c = clampArc(box.x, box.y + dy, Math.min(box.w, box.h) * 0.38, st);
  drawContent(ctx, c, p.asset);
  style(ctx, m.amberDark, m.woodBorder, 1.4);
  circ(ctx, clampArc(box.x, b[1] + 5, 2.5, st), true);
  if (w) {
    drawCheckBadge(ctx, c, st);
  }
  ctx.restore();
}
function drawEmptyHint(ctx: Ctx, p: AO, c: Arc3, b: Box4): void {
  if (!(p.isSnapPreview || p.hintLevel >= 1)) {
    return;
  }
  style(ctx, alpha(m.amberGlow, 0.24), m.amber, p.isSnapPreview ? 3.2 : 2.6);
  ctx.setLineDash(!p.isSnapPreview && p.hintLevel === 1 ? [7, 5] : []);
  rPath(ctx, b, 14, p.stageRect);
  ctx.setLineDash([]);
  if (p.hintLevel >= 2 && p.expectedAsset) {
    ctx.globalAlpha = 0.65;
    drawContent(ctx, c, p.expectedAsset);
    ctx.globalAlpha = 1;
  }
}
function drawEmptyOverlay(ctx: Ctx, rs: RS, p: AO, c: Arc3, b: Box4): void {
  if (!p.showOutline) {
    style(ctx, m.woodBorder, m.amberDark, 1.5);
    circ(ctx, clampArc(p.slot.x, p.slot.y, 3.5, p.stageRect), true);
  }
  drawEmptyHint(ctx, p, c, b);
  if (p.isAutoSolved && p.expectedAsset) {
    const ap = rs.reducedMotion ? 1 : cl(p.autoSolveProgress, 0, 1);
    const lift = (1 - ap) * 14;
    style(ctx, m.amberLight, m.amber, 2.8);
    rPath(ctx, [b[0], b[1] + lift, b[2], b[3]], 14, p.stageRect);
    const ac = clampArc(c[0], c[1] + lift, c[2], p.stageRect);
    drawContent(ctx, ac, p.expectedAsset);
  }
  if (p.wrongProgress !== null) {
    style(ctx, alpha(m.amberLight, 0.35), m.amber, 2.8);
    ctx.setLineDash([5, 4]);
    rPath(ctx, b, 14, p.stageRect);
    ctx.setLineDash([]);
    const rr = Math.max(8, c[2] * 0.85);
    rs.drawRetryRing(ctx, c[0], c[1], rr, p.wrongProgress);
  }
}
export function drawGT023AnchorOverlay(ctx: Ctx, rs: RS, p: AO): void {
  const { slot: s, wobbleX, stageRect: st } = p;
  const c = clampArc(s.x + wobbleX, s.y, Math.min(s.w, s.h) * 0.44, st);
  const [hw, hh] = [s.w * 0.46, s.h * 0.46];
  const b: Box4 = [c[0] - hw, c[1] - hh, hw * 2, hh * 2];
  ctx.save();
  if (!p.placedAsset) {
    drawEmptyOverlay(ctx, rs, p, c, b);
    ctx.restore();
    return;
  }
  ctx.fillStyle = m.emerald;
  rPath(ctx, [b[0], b[1] + 2.4, b[2], b[3]], 14, st, false);
  const winGlow = p.winElapsedMs !== null;
  const bStroke = winGlow ? alpha(m.emeraldBright, 0.42) : m.emeraldBright;
  style(ctx, sc[50], bStroke, winGlow ? 1.6 : 2.6);
  rPath(ctx, b, 14, st);
  drawPegs(ctx, b, m.emerald, st);
  drawContent(ctx, c, p.placedAsset);
  if (!winGlow) {
    drawCheckBadge(ctx, c, st);
  }
  const el = p.snappedElapsedMs;
  const spOk = p.showParticles && !rs.reducedMotion && el !== null;
  if (spOk && el >= 0 && el < 450) {
    const dist = c[2] * (0.72 + (el / 450) * 0.14);
    ctx.fillStyle = m.amber;
    for (let i = 0; i < 4; i++) {
      const px = c[0] + (SX[i] ?? 1) * dist;
      const py = c[1] + (SY[i] ?? 1) * dist;
      circ(ctx, clampArc(px, py, 2.3, st), false);
    }
  }
  ctx.restore();
}
function resolveTrayStyle(p: TP, rm: boolean) {
  if (p.wrongProgress !== null) {
    return [m.amberLight, m.amber, m.amberDark, 0] as const;
  }
  if (p.isStaged) {
    return [m.amberLight, m.amberDark, m.woodBorder, -3] as const;
  }
  if (p.isHovered || p.isHintL2) {
    const dy = p.isHovered ? 1.5 : 0;
    return [m.amberLight, C.brand[500], m.woodBorder, dy] as const;
  }
  const br = rm ? 0 : Math.sin(p.timeMs * 0.003 + p.index * 1.1) * 1.2;
  return [C.surface[0], m.woodBorder, m.woodBevel, br] as const;
}
export function drawGT023TrayPart(ctx: Ctx, rs: RS, p: TP): void {
  const { slot: s, wrongProgress: wp, trayRect: tr } = p;
  const wOn = wp && !rs.reducedMotion;
  const shX = wOn ? Math.sin(wp * TAU * 2) * 4 * (1 - wp) : 0;
  const [fill, border, slab, dy] = resolveTrayStyle(p, rs.reducedMotion);
  const c = clampArc(s.x + shX, s.y + dy, Math.min(s.w, s.h) * 0.42, tr);
  const [hw, hh] = [s.w * 0.45, s.h * 0.45];
  const b: Box4 = [c[0] - hw, c[1] - hh, hw * 2, hh * 2];
  const shBlur = p.isStaged ? 10 : 6;
  const sh = rs.softShadowsEnabled && p.softShadows !== false ? shBlur : 0;
  ctx.save();
  ctx.fillStyle = slab;
  rPath(ctx, [b[0], b[1] + (p.isHovered ? 1 : 2.8), b[2], b[3]], 14, tr, false);
  style(ctx, fill, border, p.isStaged || p.isHovered ? 3 : 2.4);
  ctx.setLineDash(wp !== null || p.isHintL2 ? [6, 4] : []);
  rPath(ctx, b, 14, tr, true, sh);
  ctx.setLineDash([]);
  drawPegs(ctx, b, p.isStaged ? m.amber : m.woodBorder, tr);
  drawContent(ctx, c, p.asset);
  if (wp !== null) {
    rs.drawRetryRing(ctx, c[0], c[1], Math.max(8, c[2] * 0.85), wp);
  }
  ctx.restore();
}
