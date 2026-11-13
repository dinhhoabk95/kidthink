import { CARD_FLIP_MS, cardFlipPose } from "#src/render/flashcard";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import {
  drawGlyphInSlot,
  drawTextInSlot,
  resolveEmojiGlyph,
} from "./shared-render.js";
import type { GT020CardRenderParams, SceneBox } from "./types.js";

const cl = designTokens.colors;
const m = cl.montessori;
const sc = cl.semantic.success;
const TAU = Math.PI * 2;
const EMOJI_CODE_RE = /^EMJ-[a-z0-9-]+$/i;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type CP = GT020CardRenderParams;
type Pt = readonly [number, number];
type Box4 = readonly [number, number, number, number];
type EmblemTuple = readonly [string, string, number, number, number, boolean];
const EMBLEMS: readonly EmblemTuple[] = [
  [m.amber, m.amberDark, 8, 0.54, 0.2, false],
  [m.coral, m.woodBorder, 10, 0.54, 0.24, false],
  [m.indigo, cl.brand[600], 4, 0.52, 0.42, false],
  [m.emeraldBright, m.emerald, 12, 0.52, 0.3, true],
  [cl.cta[500], m.amberDark, 16, 0.48, 0.48, true],
  [cl.brand[400], cl.brand[600], 6, 0.5, 0.5, false],
];
const CORNERS: readonly Pt[] = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];
function seg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
function rPath(ctx: Ctx, b: Box4, r: number): void {
  ctx.beginPath();
  ctx.roundRect(b[0], b[1], b[2], b[3], r);
}
function circ(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
export function drawGT020BoardMat(
  ctx: Ctx,
  rs: RS,
  rect: SceneBox | undefined,
  peek: boolean
): void {
  if (!rect || rect.w <= 0 || rect.h <= 0) {
    return;
  }
  const { x, y, w, h } = rect;
  const rad = Math.min(22, Math.min(w, h) * 0.12);
  const p = Math.min(4, Math.floor(Math.min(w, h) * 0.04));
  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(m.woodBorder, 0.16);
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillStyle = m.woodTray;
  rPath(ctx, [x, y, w, h], rad);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = peek ? m.amber : m.woodBorder;
  ctx.lineWidth = peek ? 3.5 : 3;
  rPath(ctx, [x + 1.5, y + 1.5, w - 3, h - 3], rad);
  ctx.stroke();
  if (w > p * 4 && h > p * 4) {
    ctx.strokeStyle = peek ? alpha(m.amberGlow, 0.75) : m.woodBevel;
    ctx.lineWidth = 1.5;
    rPath(ctx, [x + p, y + p, w - p * 2, h - p * 2], Math.max(8, rad - p));
    ctx.stroke();
  }
  ctx.restore();
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
}
function drawEmblem(ctx: Ctx, c: Pt, r: number, idx: number): void {
  const spec = EMBLEMS[Math.abs(idx) % EMBLEMS.length];
  if (!spec) {
    return;
  }
  const [fill, stroke, pts, rOut, rIn, dot] = spec;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.2;
  drawPoly(ctx, c, pts, r * rOut, r * rIn);
  ctx.fill();
  ctx.stroke();
  if (dot) {
    ctx.fillStyle = cl.surface[0];
    circ(ctx, c[0], c[1], r * 0.18);
  }
  ctx.restore();
}
function drawFrontContent(ctx: Ctx, cy: number, p: CP): void {
  const { x: cx, w, h, hitW, hitH } = p.slot;
  const role = "target" as const;
  const box = { index: 0, page: 0, role, x: cx, y: cy, w, h, hitW, hitH };
  if (p.asset.kind === "emoji") {
    const raw = p.asset.ref.trim();
    const resolved = raw ? resolveEmojiGlyph(raw) : null;
    if (resolved && !EMOJI_CODE_RE.test(resolved)) {
      drawGlyphInSlot(ctx, resolved, box);
      return;
    }
  } else if (p.asset.kind === "text") {
    const txt = p.asset.text.trim();
    if (txt.length > 0) {
      drawTextInSlot(ctx, txt, box, cl.brand[600]);
      return;
    }
  }
  drawEmblem(ctx, [cx, cy], Math.min(w, h) * 0.5, p.pairIndex);
}
function drawBackCarving(ctx: Ctx, cy: number, p: CP): void {
  const { x: cx, w, h } = p.slot;
  const [inW, inH] = [Math.max(12, w - 12), Math.max(12, h - 12)];
  const r = Math.min(inW, inH) * 0.5;
  ctx.save();
  ctx.strokeStyle = p.isHovered ? cl.brand[400] : alpha(m.woodBorder, 0.55);
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  rPath(ctx, [cx - inW / 2, cy - inH / 2, inW, inH], Math.max(6, r * 0.24));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = p.isHovered ? m.amber : alpha(m.amberLight, 0.85);
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = 1.8;
  drawPoly(ctx, [cx, cy], 8, r * 0.44, r * 0.16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawMatchedDecor(ctx: Ctx, rs: RS, cy: number, p: CP): void {
  const { x: cx, w, h } = p.slot;
  const r = Math.min(w, h) * 0.5;
  const br = Math.max(8, r * 0.24);
  const [bx, by] = [cx + w / 2 - br - 3, cy - h / 2 + br + 3];
  ctx.save();
  ctx.fillStyle = m.emeraldBright;
  ctx.strokeStyle = m.emerald;
  ctx.lineWidth = 1.8;
  circ(ctx, bx, by, br);
  ctx.stroke();
  ctx.strokeStyle = cl.surface[0];
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(bx - br * 0.42, by);
  ctx.lineTo(bx - br * 0.08, by + br * 0.36);
  ctx.lineTo(bx + br * 0.46, by - br * 0.34);
  ctx.stroke();
  const el = p.matchElapsedMs;
  if (p.showParticles && !rs.reducedMotion && el !== null && el < 500) {
    const d = r * 0.65;
    ctx.globalAlpha = 1 - el / 500;
    ctx.strokeStyle = m.amber;
    ctx.lineWidth = 1.8;
    for (const [dx, dy] of CORNERS.slice(0, 3)) {
      const [sx, sy] = [cx + dx * d, cy + dy * d];
      seg(ctx, sx - 3.2, sy, sx + 3.2, sy);
      seg(ctx, sx, sy - 3.2, sx, sy + 3.2);
    }
  }
  ctx.restore();
}
function drawCues(ctx: Ctx, rs: RS, cy: number, f: boolean, p: CP): void {
  const { x: cx, w, h } = p.slot;
  if (f && p.mode === "face_up") {
    ctx.fillStyle = cl.brand[500];
    for (const [dx, dy] of CORNERS) {
      circ(ctx, cx + dx * (w / 2 - 7), cy + dy * (h / 2 - 7), 2.2);
    }
  }
  if (p.mode === "mismatch_open") {
    const barW = Math.max(12, w - 16);
    const left = Math.max(0.08, Math.min(1, 1 - p.mismatchRatio));
    const curW = barW * (rs.reducedMotion ? 1 : left);
    ctx.fillStyle = alpha(m.amber, 0.85);
    rPath(ctx, [cx - barW / 2, cy + h / 2 - 6, curW, 3.5], 2);
    ctx.fill();
  }
  if (p.hintLevel >= 1) {
    const rad = Math.max(8, Math.min(w, h) * 0.18);
    ctx.strokeStyle = m.amber;
    ctx.lineWidth = p.hintLevel >= 2 ? 3.5 : 2.8;
    ctx.setLineDash([6, 4]);
    rPath(ctx, [cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h - 4], rad);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
type CardColors = readonly [string, string, string, number];
function resolveCardColors(f: boolean, p: CP): CardColors {
  if (!f) {
    const fill = p.isHovered ? m.amberLight : m.woodTrayHigh;
    const border = p.isHovered ? cl.brand[500] : m.woodBorder;
    return [fill, border, m.woodBorder, p.isHovered ? 1.5 : 3.5];
  }
  if (p.mode === "matched") {
    return [sc[50], m.emeraldBright, m.emerald, 2];
  }
  if (p.mode === "mismatch_open" || p.mode === "auto_reveal") {
    return [m.amberLight, m.amber, m.amberDark, 3];
  }
  return [cl.surface[0], cl.brand[500], cl.brand[600], 3.5];
}
function computeYOff(rs: RS, f: boolean, p: CP): number {
  if (rs.reducedMotion) {
    return 0;
  }
  if (f) {
    return p.mode === "face_up" ? -1.5 : 0;
  }
  return p.isHovered ? 1 : Math.sin(p.timeMs * 0.0035 + p.pairIndex);
}
function renderBody(ctx: Ctx, rs: RS, cy: number, f: boolean, p: CP): void {
  const { x: cx, w, h } = p.slot;
  const rad = Math.max(8, Math.min(w, h) * 0.18);
  const [fill, border, slab, slabH] = resolveCardColors(f, p);
  ctx.fillStyle = slab;
  rPath(ctx, [cx - w / 2, cy - h / 2 + slabH, w, h], rad);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.strokeStyle = border;
  ctx.lineWidth = f || p.isHovered ? 3.2 : 2.6;
  rPath(ctx, [cx - w / 2, cy - h / 2, w, h], rad);
  ctx.fill();
  ctx.stroke();
  if (f) {
    drawFrontContent(ctx, cy, p);
    if (p.mode === "matched") {
      drawMatchedDecor(ctx, rs, cy, p);
    }
    return;
  }
  drawBackCarving(ctx, cy, p);
  if (p.hintLevel === 3) {
    const wave = 0.24 + 0.2 * (0.5 + 0.5 * Math.sin(p.timeMs * 0.0025));
    ctx.globalAlpha = rs.reducedMotion ? 0.42 : wave;
    drawEmblem(ctx, [cx, cy], Math.min(w, h) * 0.42, p.pairIndex);
  }
}
export function drawGT020Card(ctx: Ctx, rs: RS, p: CP): void {
  const { x: cx, y: baseCy } = p.slot;
  const isFlipping = p.flipElapsedMs >= 0 && p.flipElapsedMs < CARD_FLIP_MS;
  const pose = cardFlipPose(p.flipElapsedMs, rs.reducedMotion);
  const flippedFace = pose.showsNewFace ? p.isFaceUp : !p.isFaceUp;
  const f = isFlipping ? flippedFace : p.isFaceUp;
  const cy = baseCy + computeYOff(rs, f, p);
  if (isFlipping) {
    ctx.save();
    ctx.translate(cx, baseCy);
    ctx.scale(pose.scaleX, 1);
    ctx.translate(-cx, -baseCy);
  }
  ctx.save();
  if (!f && p.isDimmedByMismatch) {
    ctx.globalAlpha = 0.86;
  }
  renderBody(ctx, rs, cy, f, p);
  drawCues(ctx, rs, cy, f, p);
  ctx.restore();
  if (isFlipping) {
    ctx.restore();
  }
}
