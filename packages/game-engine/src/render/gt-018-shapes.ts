import type { StripChip } from "#src/layout/muted-strip";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { drawStripChipCard } from "./montessori-feedback.js";
import { drawGlyphInSlot, drawSlotItem } from "./shared-render.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";
import type { RenderAsset, ItemVisualState as S } from "./types.js";

type Ctx = CanvasRenderingContext2D;
type Sys = RenderSystem;
export type GT018CueItem = Record<"item_id", string> &
  Record<"asset", RenderAsset>;
type GFlag = "isPlaying" | "touching" | "degraded";
type CFlag = "isRoundClosed" | "isSolutionReveal" | "degraded";
type CNum = "index" | "timeMs" | "wrongAlpha";
type GBase = Record<GFlag, boolean> & Record<"timeMs", number>;
type CBase = Record<CFlag, boolean> & Record<CNum, number>;
export interface GT018GramProps extends GBase {
  readonly slot: Slot;
  readonly clampBounds: ZoneRect;
}
export interface GT018CueProps extends Record<"muted", boolean> {
  readonly chips: readonly StripChip[];
  readonly items: readonly GT018CueItem[];
  readonly activeStepIndex: number | null;
}
export interface GT018CardProps extends CBase {
  readonly id: string;
  readonly asset: RenderAsset;
  readonly state: S;
  readonly orderNum?: number;
  readonly winAtMs?: number | null;
  readonly stageBounds: ZoneRect;
}
const C = designTokens.colors;
const M = C.montessori;
const HORN_GRAD = new WeakMap<Ctx, CanvasGradient>();
const BADGES = [C.brand[500], M.amberDark, M.indigo, M.emerald] as const;
const SIDES = [16, 3, 4, 5] as const;
const SX = [-1, -1, 1, 1] as const;
const SY = [-1, 1, -1, 1] as const;
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const edgeDist = (b: ZoneRect, x: number, y: number) =>
  Math.max(4, Math.min(x - b.x, b.x + b.w - x, y - b.y, b.y + b.h - y) - 4);
const hasAsset = (a: RenderAsset) =>
  `${"ref" in a ? a.ref : ""}${"text" in a ? a.text : ""}${"path" in a ? a.path : ""}`.trim()
    .length > 0;
function getHornGrad(ctx: Ctx): CanvasGradient {
  let g = HORN_GRAD.get(ctx);
  if (!g) {
    g = ctx.createRadialGradient(-4, -4, 2, 0, 0, 26);
    g.addColorStop(0, M.amberGlow);
    g.addColorStop(0.65, M.amber);
    g.addColorStop(1, M.amberDark);
    HORN_GRAD.set(ctx, g);
  }
  return g;
}
function rBox(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, Math.max(4, w), Math.max(4, h), Math.max(2, Math.abs(r)));
  c[r < 0 ? "stroke" : "fill"]();
}
function circ(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function corner(c: Ctx, x: number, y: number, dx: number, dy: number): void {
  c.beginPath();
  c.moveTo(x + dx, y + (dy === -7 ? -3 : 0));
  c.lineTo(x, y);
  c.lineTo(x + (dy === -7 ? 5.5 : 0), y + dy);
  c.stroke();
}
function arcS(ctx: Ctx, x: number, y: number, r: number, a: number, b: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, a, b);
  ctx.stroke();
}
function drawFallbackShape(ctx: Ctx, cx: number, cy: number, r: number, i = 0) {
  const [k, n] = [Math.abs(i) % 4, SIDES[Math.abs(i) % 4] ?? 16];
  ctx.save();
  ctx.fillStyle = BADGES[k] ?? C.brand[500];
  [ctx.strokeStyle, ctx.lineWidth] = [C.surface[0], 2];
  ctx.beginPath();
  for (let j = 0; j < n; j++) {
    const a = (j * Math.PI * 2) / n - Math.PI / 2;
    const [px, py] = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    ctx[j === 0 ? "moveTo" : "lineTo"](px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export function drawGT018Gramophone(ctx: Ctx, rs: Sys, p: GT018GramProps) {
  const { slot: s, isPlaying, touching, timeMs, degraded, clampBounds: b } = p;
  const m = Number(!rs.reducedMotion);
  const sz = Math.min(s.w, s.h, b.w - 8, b.h - 8);
  const [slab, dy] = [touching ? 1.5 : 5, touching ? 2.5 : 0];
  const cx = cl(s.x, b.x + sz / 2 + 2, b.x + b.w - sz / 2 - 2);
  const cy = cl(s.y + dy, b.y + sz / 2 + 2, b.y + b.h - sz / 2 - slab - 2);
  const [bw, bh] = [sz * 0.68, sz * 0.28];
  const [bx, by] = [cx - bw / 2, cy + bh / 2];
  ctx.save();
  if (rs.softShadowsEnabled && !degraded) {
    ctx.fillStyle = alpha(M.woodBorder, 0.22);
    rBox(ctx, bx - 2, by + slab, bw + 4, bh, 8);
  }
  ctx.fillStyle = M.woodBorder;
  rBox(ctx, bx, by + slab, bw, bh, 8);
  ctx.fillStyle = touching ? M.amberGlow : M.plateLight;
  [ctx.strokeStyle, ctx.lineWidth] = [M.woodBorder, 2];
  rBox(ctx, bx, by, bw, bh, 8);
  ctx.stroke();
  ctx.fillStyle = C.surface[800];
  rBox(ctx, cx - bw * 0.36, by - 5.5, bw * 0.72, 8, 4);
  const ang = isPlaying && m ? timeMs / 280 : 0;
  [ctx.strokeStyle, ctx.lineWidth] = [M.amberGlow, 1.5];
  corner(ctx, cx, by - 2, Math.cos(ang) * bw * 0.26, Math.sin(ang) * 2.8);
  const [ry, rr] = [by + bh * 0.52, Math.max(4, bh * 0.24)];
  [ctx.strokeStyle, ctx.lineWidth] = [M.amberDark, 2];
  arcS(ctx, cx, ry, rr, -2.35, 1.7);
  corner(ctx, cx - rr * 0.13, ry + rr * 0.99, 3.2, -3.2);
  const [hx, hy, hr] = [cx + sz * 0.08, cy - sz * 0.14, Math.max(8, sz * 0.23)];
  const hs = hr / 24;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(hs, hs);
  ctx.fillStyle = getHornGrad(ctx);
  [ctx.strokeStyle, ctx.lineWidth] = [M.woodBorder, 2 / hs];
  ctx.beginPath();
  ctx.moveTo(-15.6, 20.4);
  ctx.quadraticCurveTo(-8.4, 0, 0, -13.2);
  ctx.arc(3.6, -1.2, 18.7, -1.88, 1.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (isPlaying) {
    const maxR = Math.min(hr * 1.65, edgeDist(b, hx + hr * 0.2, hy));
    for (let w = 0; w < 2; w++) {
      const ph = m ? (timeMs / 900 + w * 0.5) % 1 : 0.35 * (w + 1);
      const rad = cl(hr * (0.78 + ph * 0.75), 4, maxR);
      const col = alpha(M.amberDark, (1 - ph * m) * 0.8);
      [ctx.strokeStyle, ctx.lineWidth] = [col, 2.4];
      arcS(ctx, hx + hr * 0.15, hy, rad, -1.3, 1.3);
    }
    if (!degraded) {
      const dyN = m * ((timeMs / 90) % 5);
      const nx = cl(hx + hr * 0.52, b.x + 6, b.x + b.w - 8);
      const ny = cl(hy - hr * 0.52 - dyN, b.y + 10, b.y + b.h - 6);
      [ctx.fillStyle, ctx.lineWidth] = [M.amberDark, 1.8];
      ctx.strokeStyle = M.amberDark;
      circ(ctx, nx, ny, 2.6);
      corner(ctx, nx + 2.2, ny - 6.5, 3.2, 6.5);
    }
  }
  ctx.restore();
}
export function drawGT018StepBeads(ctx: Ctx, rs: Sys, p: GT018CueProps): void {
  const [first, last] = [p.chips[0], p.chips.at(-1)];
  ctx.save();
  if (first && last) {
    [ctx.strokeStyle, ctx.lineWidth] = [M.woodBorder, 3];
    corner(ctx, first.cx, first.cy, last.cx - first.cx, last.cy - first.cy);
  }
  p.chips.forEach((c, i) => {
    const lit = i === p.activeStepIndex;
    const r = Math.max(8, c.size * (lit && !rs.reducedMotion ? 0.44 : 0.4));
    ctx.fillStyle = lit ? M.amberGlow : M.plateInner;
    [ctx.strokeStyle, ctx.lineWidth] = [lit ? M.amberDark : M.woodBorder, 2];
    circ(ctx, c.cx, c.cy, r);
    ctx.stroke();
    const cnt = Math.min(4, i + 1);
    ctx.fillStyle = lit ? M.amberDark : M.woodBorder;
    for (let k = 0; k < cnt; k++) {
      const ox = cnt === 1 ? 0 : (k / (cnt - 1) - 0.5) * r * 0.9;
      circ(ctx, c.cx + ox, c.cy, Math.max(1.8, r * 0.15));
    }
  });
  ctx.restore();
}
export function drawGT018CueStrip(ctx: Ctx, rs: Sys, p: GT018CueProps): void {
  const { chips, items, muted, activeStepIndex } = p;
  ctx.save();
  chips.forEach((c, i) => {
    const [isMute, idx] = [muted && i === 0, muted ? i - 1 : i];
    const lit = !isMute && activeStepIndex === idx;
    const cy = c.cy - Number(lit && !rs.reducedMotion) * 2;
    drawStripChipCard(ctx, { ...c, cy }, isMute || lit);
    if (lit) {
      const hs = c.size / 2 + 2;
      [ctx.strokeStyle, ctx.lineWidth] = [M.amberDark, 3];
      rBox(ctx, c.cx - hs, cy - hs, hs * 2, hs * 2, -8);
    }
    const [sz, hs] = [c.size * 0.78, c.size];
    const a = { index: i, x: c.cx, y: cy, w: sz, h: sz };
    const slot: Slot = { ...a, hitW: hs, hitH: hs, page: 0, role: "target" };
    if (isMute) {
      drawGlyphInSlot(ctx, "🔇", slot);
      return;
    }
    const item = items[idx];
    if (item && hasAsset(item.asset)) {
      const sp = { id: `strip-${item.item_id}`, asset: item.asset };
      drawSlotItem(ctx, rs, slot, sp);
    } else if (item) {
      drawFallbackShape(ctx, slot.x, slot.y, c.size * 0.28, idx);
    }
  });
  ctx.restore();
}
function drawCardPost(ctx: Ctx, rs: Sys, s: Slot, p: GT018CardProps): void {
  const { state: st, orderNum, wrongAlpha, stageBounds: b } = p;
  if (orderNum !== undefined) {
    const brd = Math.max(11, Math.min(s.w, s.h) * 0.16);
    const [bx, by] = [s.x - s.w / 2 + brd + 4, s.y - s.h / 2 + brd + 4];
    ctx.fillStyle = st === "correct" ? M.emerald : M.amberGlow;
    [ctx.strokeStyle, ctx.lineWidth] = [M.woodBorder, 1.8];
    circ(ctx, bx, by, brd);
    ctx.stroke();
    const px = legibleFontPx(brd * 1.15, rs.viewport?.scale);
    applyCanvasFontAtSize(ctx, px, "bold");
    ctx.fillStyle = C.surface[900];
    [ctx.textAlign, ctx.textBaseline] = ["center", "middle"];
    ctx.fillText(String(orderNum), bx, by);
  }
  if (st === "selected") {
    [ctx.strokeStyle, ctx.lineWidth] = [M.amberDark, 2.6];
    SX.forEach((sx, k) => {
      const [cx, cy] = [s.x + sx * s.w * 0.42, s.y + (SY[k] ?? 1) * s.h * 0.42];
      corner(ctx, cx, cy, -sx * 6, -(SY[k] ?? 1) * 6);
    });
  } else if (st === "correct") {
    if (!(p.degraded || rs.reducedMotion)) {
      SX.forEach((sx, k) => {
        const px = cl(s.x + sx * s.w * 0.46, b.x + 6, b.x + b.w - 6);
        const py = cl(s.y + (SY[k] ?? 1) * s.h * 0.46, b.y + 6, b.y + b.h - 6);
        ctx.fillStyle = k % 2 === 0 ? M.amber : M.emerald;
        circ(ctx, px, py, 3.2);
      });
    }
    const [cx, cy] = [s.x + s.w / 2 - 14, s.y - s.h / 2 + 14];
    ctx.fillStyle = M.emerald;
    circ(ctx, cx, cy, 9);
    [ctx.strokeStyle, ctx.lineWidth] = [C.surface[0], 2.2];
    corner(ctx, cx - 1, cy + 3.5, -3, -7);
  } else if (st === "wrong" && wrongAlpha > 0) {
    const rr = cl(Math.min(s.w, s.h) * 0.48, 4, edgeDist(b, s.x, s.y));
    rs.drawRetryRing(ctx, s.x, s.y, rr, wrongAlpha);
  }
}
export function drawGT018Card(ctx: Ctx, rs: Sys, s0: Slot, p: GT018CardProps) {
  const { state: st, index: idx, timeMs, wrongAlpha, stageBounds: b } = p;
  const m = Number(!rs.reducedMotion);
  const wave = Math.sin(timeMs / 540 + idx * 1.1) * 0.012 * m;
  const br = Number(st === "idle" && !p.degraded) * wave;
  const dt = timeMs - (p.winAtMs ?? -9999);
  const winW = Math.sin((dt / 520) * Math.PI) * 0.06 * m;
  const pop = Number(st === "correct" && dt >= 0 && dt < 520) * winW;
  const [tch, sel] = [Number(st === "touching"), st === "selected"];
  const sc = 1 + br - tch * 0.03 + Number(sel || st === "correct") * 0.04 + pop;
  const [dy, slab] = [tch * 2.5 - Number(sel) * 4, 5 - tch * 3.5];
  const shk = Number(st === "wrong") * m * Math.sin(wrongAlpha * 12.56) * 3.5;
  const [w, h] = [Math.round(s0.w * sc), Math.round(s0.h * sc)];
  const x = cl(s0.x + shk, b.x + w / 2 + 4, b.x + b.w - w / 2 - 4);
  const y = cl(s0.y + dy, b.y + h / 2 + 4, b.y + b.h - h / 2 - slab - 4);
  const rad = Math.max(10, Math.min(w, h) * 0.16);
  const act = sel || st === "wrong";
  const baseCol = act ? M.amberDark : M.woodBorder;
  const col = st === "correct" ? M.emerald : baseCol;
  const scCol = p.isSolutionReveal ? M.emerald : col;
  ctx.save();
  ctx.fillStyle = col;
  rBox(ctx, x - w / 2, y - h / 2 + slab, w, h, rad);
  ctx.fillStyle = act ? M.amberGlow : C.surface[0];
  [ctx.strokeStyle, ctx.lineWidth] = [scCol, 2.4];
  ctx.setLineDash(st === "wrong" || p.isSolutionReveal ? [6, 4] : []);
  rBox(ctx, x - w / 2, y - h / 2, w, h, rad);
  ctx.stroke();
  ctx.setLineDash([]);
  const inner: Slot = { ...s0, x, y, w: w * 0.78, h: h * 0.78 };
  if (hasAsset(p.asset)) {
    drawSlotItem(ctx, rs, inner, { id: p.id, asset: p.asset, state: st });
  } else {
    drawFallbackShape(ctx, x, y, Math.min(w, h) * 0.26, idx);
  }
  drawCardPost(ctx, rs, { ...s0, x, y, w, h }, p);
  ctx.restore();
}
export { drawGT018Card as drawGT018OptionCard };

const s1 = { drawGT018Card, drawGT018CueStrip };
export const S018 = { ...s1, drawGT018Gramophone, drawGT018StepBeads };
