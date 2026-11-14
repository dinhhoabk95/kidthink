import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import {
  drawGlyphInSlot,
  drawTextInSlot,
  resolveEmojiGlyph,
} from "./shared-render.js";
import type {
  GT022HintOverlayParams,
  GT022QuestRefItem,
  GT022SceneObjectParams,
  RenderAsset,
  SceneBox,
} from "./types.js";

const cl = designTokens.colors;
const [m, sc, TAU] = [cl.montessori, cl.semantic.success, Math.PI * 2];
const EMOJI_CODE_RE = /^EMJ-[a-z0-9-]+$/i;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type HP = GT022HintOverlayParams;
type OP = GT022SceneObjectParams;
type QI = GT022QuestRefItem;
type SB = SceneBox;
type Pt = readonly [number, number];
type Arc3 = readonly [number, number, number];
type Box4 = readonly [number, number, number, number];
type Colors3 = readonly [string, string, string];
type EmblemTuple = readonly [string, string, number, number, number];
const EMBLEMS: readonly EmblemTuple[] = [
  [m.amber, m.amberDark, 8, 0.48, 0.2],
  [m.coral, m.woodBorder, 10, 0.48, 0.24],
  [m.indigo, cl.brand[600], 6, 0.46, 0.38],
  [m.emeraldBright, m.emerald, 12, 0.46, 0.28],
  [cl.cta[500], m.amberDark, 8, 0.44, 0.36],
];
const RAYS: readonly number[] = [-1, 1];
const LOBES: readonly Arc3[] = [
  [-0.32, 0.06, 0.44],
  [0.32, 0.06, 0.44],
  [0, -0.1, 0.5],
];
function style(ctx: Ctx, fill: string, stroke: string, lw: number): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
}
function clampBox(b: Box4, st?: SB): Box4 {
  if (!st) {
    return b;
  }
  const [x0, y0] = [Math.max(st.x + 1, b[0]), Math.max(st.y + 1, b[1])];
  const x1 = Math.min(st.x + st.w - 1, b[0] + b[2]);
  const y1 = Math.min(st.y + st.h - 1, b[1] + b[3]);
  return [x0, y0, Math.max(2, x1 - x0), Math.max(2, y1 - y0)];
}
function clampArc(cx: number, cy: number, r: number, st?: SB): Arc3 {
  if (!st) {
    return [cx, cy, Math.max(1, r)];
  }
  const sx = Math.max(st.x + 3, Math.min(st.x + st.w - 3, cx));
  const sy = Math.max(st.y + 3, Math.min(st.y + st.h - 3, cy));
  const rx = Math.min(sx - (st.x + 1), st.x + st.w - 1 - sx);
  const ry = Math.min(sy - (st.y + 1), st.y + st.h - 1 - sy);
  return [sx, sy, Math.max(1, Math.min(r, rx, ry))];
}
function rPath(ctx: Ctx, b: Box4, r: number, st?: SB): void {
  const cb = clampBox(b, st);
  const rad = Math.max(2, Math.min(r, cb[2] / 2, cb[3] / 2));
  ctx.beginPath();
  ctx.roundRect(cb[0], cb[1], cb[2], cb[3], rad);
  ctx.fill();
  ctx.stroke();
}
function circ(ctx: Ctx, c: Arc3, stroke = true): void {
  ctx.beginPath();
  ctx.arc(c[0], c[1], c[2], 0, TAU);
  ctx.fill();
  if (stroke) {
    ctx.stroke();
  }
}
function drawPoly(ctx: Ctx, c: Pt, pts: number, r1: number, r2: number): void {
  ctx.beginPath();
  for (let i = 0; i < pts; i++) {
    const a = (i * TAU) / pts - Math.PI / 2;
    const d = i % 2 === 0 ? r1 : r2;
    const [px, py] = [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d];
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
function drawContent(ctx: Ctx, c: Arc3, a: RenderAsset | undefined, i: number) {
  const [x, y, r] = c;
  const [d, role] = [r * 2, "source" as const];
  const box = { index: i, page: 0, role, x, y, w: d, h: d, hitW: d, hitH: d };
  if (a?.kind === "emoji") {
    const res = a.ref.trim() ? resolveEmojiGlyph(a.ref.trim()) : null;
    if (res && !EMOJI_CODE_RE.test(res)) {
      drawGlyphInSlot(ctx, res, box);
      return;
    }
  } else if (a?.kind === "text" && a.text.trim().length > 0) {
    drawTextInSlot(ctx, a.text.trim(), box, cl.brand[600]);
    return;
  }
  const spec = EMBLEMS[Math.abs(i) % EMBLEMS.length];
  if (spec) {
    ctx.save();
    style(ctx, spec[0], spec[1], 2);
    drawPoly(ctx, [x, y], spec[2], r * spec[3], r * spec[4]);
    ctx.restore();
  }
}
function drawCheckBadge(ctx: Ctx, c: Arc3, st?: SB): void {
  const [d, br] = [c[2] * 0.56, Math.max(7, c[2] * 0.28)];
  const bc = clampArc(c[0] + d, c[1] - d, br, st);
  const [bx, by, arm] = [bc[0], bc[1], bc[2] * 0.52];
  ctx.save();
  style(ctx, m.emeraldBright, m.emerald, 1.8);
  circ(ctx, bc, true);
  style(ctx, cl.surface[0], cl.surface[0], 2.2);
  [ctx.lineCap, ctx.lineJoin] = ["round", "round"];
  ctx.beginPath();
  ctx.moveTo(bx - arm * 0.7, by);
  ctx.lineTo(bx - arm * 0.1, by + arm * 0.6);
  ctx.lineTo(bx + arm * 0.75, by - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}
export function drawGT022StageBackdrop(ctx: Ctx, _rs: RS, st?: SB): void {
  if (!st || st.w <= 8 || st.h <= 8) {
    return;
  }
  const { x, y, w, h } = st;
  const rad = Math.min(20, Math.min(w, h) * 0.08);
  const th = Math.max(10, Math.min(24, Math.floor(h * 0.1)));
  ctx.save();
  style(ctx, alpha(m.woodTray, 0.24), alpha(m.woodBorder, 0.55), 2.5);
  rPath(ctx, [x + 2, y + 2, w - 4, h - 4], rad, st);
  const [gf, gs] = [alpha(m.emeraldBright, 0.2), alpha(m.emerald, 0.15)];
  style(ctx, gf, gs, 1.5);
  rPath(ctx, [x + 4, y + h - th - 3, w - 8, th], rad * 0.6, st);
  ctx.restore();
}
type QHArgs = readonly [Ctx, SB | null, readonly QI[], SB?];
export function drawGT022QuestHeader(...a: QHArgs): void {
  const [ctx, sb, items, st] = a;
  if (items.length === 0) {
    return;
  }
  ctx.save();
  if (sb && sb.w > 8 && sb.h > 8) {
    style(ctx, alpha(m.woodTrayHigh, 0.92), m.woodBorder, 2);
    rPath(ctx, [sb.x, sb.y, sb.w, sb.h], 14, st);
  }
  for (const it of items) {
    const r = Math.min(it.slot.w, it.slot.h) * 0.46;
    const c = clampArc(it.slot.x, it.slot.y, r, st);
    const [f, s] = it.isFound
      ? [sc[50], m.emeraldBright]
      : [cl.surface[0], m.amberDark];
    style(ctx, f, s, it.isFound ? 3 : 2.4);
    circ(ctx, c, true);
    drawContent(ctx, c, it.asset, it.index);
    if (it.isFound) {
      drawCheckBadge(ctx, c, st);
    }
  }
  ctx.restore();
}
export function drawGT022HintOverlay(ctx: Ctx, rs: RS, p: HP): void {
  if (p.level === 0) {
    return;
  }
  ctx.save();
  if (p.level === 1 && p.quadrantBox) {
    const q = p.quadrantBox;
    style(ctx, alpha(m.amberLight, 0.24), m.amber, 2.6);
    ctx.setLineDash([8, 6]);
    rPath(ctx, [q.x, q.y, q.w, q.h], 14, p.stageRect);
  } else if (p.targetSlot) {
    const s = p.targetSlot;
    const scR = p.level === 2 ? 0.62 : 0.54;
    const c = clampArc(s.x, s.y, Math.min(s.w, s.h) * scR, p.stageRect);
    const wave = 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(p.timeMs * 0.003));
    const l3Alpha = rs.reducedMotion ? 0.85 : wave;
    ctx.globalAlpha = p.level === 3 ? l3Alpha : 0.9;
    style(ctx, alpha(m.amberGlow, 0.2), m.amber, p.level === 3 ? 3.6 : 2.8);
    if (p.level === 2) {
      ctx.setLineDash([6, 5]);
    }
    circ(ctx, c, true);
  }
  ctx.restore();
}
function drawMysteryCover(ctx: Ctx, rs: RS, p: OP): void {
  const { slot, isHovered, stageRect } = p;
  const r = Math.min(slot.w, slot.h) * 0.46;
  const dy = isHovered ? 1.5 : 0;
  ctx.save();
  const fill = isHovered ? m.amberLight : cl.scene.mist;
  style(ctx, fill, isHovered ? cl.brand[500] : cl.competency.c4, 2.4);
  for (const [ox, oy, lr] of LOBES) {
    const [lx, ly] = [slot.x + ox * r, slot.y + dy + oy * r];
    circ(ctx, clampArc(lx, ly, r * lr, stageRect), true);
  }
  const br = rs.reducedMotion ? 1 : 1 + 0.08 * Math.sin(p.timeMs * 0.004);
  const c = clampArc(slot.x, slot.y + dy, r * 0.34 * br, stageRect);
  style(ctx, m.amber, m.woodBorder, 1.6);
  drawPoly(ctx, [c[0], c[1]], 8, c[2], c[2] * 0.4);
  ctx.restore();
}
function resolveObjColors(p: OP): Colors3 {
  if (p.isFound) {
    return [sc[50], m.emeraldBright, m.emerald];
  }
  if (p.isAutoRevealed || p.wrongProgress !== null) {
    return [m.amberLight, m.amber, m.amberDark];
  }
  if (p.isHovered) {
    return [m.amberLight, cl.brand[500], m.woodBorder];
  }
  return [cl.surface[0], m.woodBorder, m.woodBevel];
}
function computeOffsets(rs: RS, p: OP, win: boolean): Pt {
  if (rs.reducedMotion) {
    return [0, p.isHovered ? 1.5 : 0];
  }
  const wp = p.wrongProgress;
  const dx = wp === null ? 0 : Math.sin(wp * TAU * 2) * 3;
  const el = p.foundElapsedMs;
  const b1 = el !== null && el < 360 ? -Math.sin((el / 360) * Math.PI) * 3 : 0;
  const b2 = win ? -2 : b1;
  return [dx, p.isHovered ? 1.5 : b2];
}
function drawObjFx(ctx: Ctx, rs: RS, p: OP, c: Arc3, win: boolean): void {
  if (rs.softShadowsEnabled && c[2] > 6) {
    style(ctx, cl.surface[0], alpha(cl.surface[0], 0.55), 1.6);
    ctx.beginPath();
    ctx.arc(c[0], c[1], c[2] * 0.78, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  drawContent(ctx, c, p.asset, p.index);
  if (p.isFound) {
    drawCheckBadge(ctx, c, p.stageRect);
  }
  if (win) {
    style(ctx, alpha(m.emeraldBright, 0.14), m.emeraldBright, 2.4);
    circ(ctx, clampArc(c[0], c[1], c[2] * 1.12, p.stageRect), true);
  }
  const el = p.foundElapsedMs;
  if (p.showParticles && !rs.reducedMotion && el !== null && el < 450) {
    ctx.fillStyle = m.amber;
    for (const rx of RAYS) {
      for (const ry of RAYS) {
        const [px, py] = [c[0] + rx * c[2] * 0.72, c[1] + ry * c[2] * 0.72];
        circ(ctx, clampArc(px, py, 2.2, p.stageRect), false);
      }
    }
  }
}
export function drawGT022SceneObject(ctx: Ctx, rs: RS, p: OP): void {
  if (p.isCovered) {
    drawMysteryCover(ctx, rs, p);
    return;
  }
  const we = p.winElapsedMs === null ? -1 : p.winElapsedMs - p.index * 90;
  const win = p.isFound && we >= 0 && we < 600;
  const [dx, dy] = computeOffsets(rs, p, win);
  const r = Math.min(p.slot.w, p.slot.h) * 0.46;
  const c = clampArc(p.slot.x + dx, p.slot.y + dy, r, p.stageRect);
  const [fill, border, slab] = resolveObjColors(p);
  ctx.save();
  ctx.fillStyle = slab;
  const sd = p.isHovered ? 1 : 2.6;
  const sy = Math.min(c[1] + sd, c[1] + Math.max(0, r - c[2]));
  circ(ctx, [c[0], sy, c[2]], false);
  const lw = p.isFound || p.isHovered || p.isAutoRevealed ? 3 : 2.4;
  style(ctx, fill, border, lw);
  if (p.wrongProgress !== null) {
    ctx.setLineDash([5, 4]);
  }
  circ(ctx, c, true);
  ctx.setLineDash([]);
  drawObjFx(ctx, rs, p, c, win);
  if (p.wrongProgress !== null) {
    const rr = Math.max(8, c[2] * 0.78);
    rs.drawRetryRing(ctx, c[0], c[1], rr, p.wrongProgress);
  }
  ctx.restore();
}
