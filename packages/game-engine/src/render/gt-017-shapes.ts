import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { drawSlotItem } from "./shared-render.js";
import type {
  GT017HeroLayout,
  GT017KnobGeom,
  GT017ModelOverlayParams,
  GT017OptionCardParams,
  GT017QuestionKind,
  GT017TurntableGeom,
  GT017TurntableParams,
  SceneBox,
} from "./types.js";

const cl = designTokens.colors;
const m = cl.montessori;
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type L = GT017HeroLayout;
type TP = GT017TurntableParams;
type MP = GT017ModelOverlayParams;
type CP = GT017OptionCardParams;

function fbox(ctx: Ctx, x: number, y: number, s: number, col: string): void {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, s, s);
  ctx.strokeRect(x, y, s, s);
}
function disc(ctx: Ctx, x: number, y: number, r: number, col: string): void {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}
function seg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
function arcArrow(ctx: Ctx, x: number, y: number, r: number, d: -1 | 1): void {
  const [tx, ty, w] = [x + d * 0.66 * r, y + 0.75 * r, r * 0.55];
  ctx.beginPath();
  ctx.arc(x, y, r, d > 0 ? -2.1 : -1.04, d > 0 ? 0.85 : 2.29, d < 0);
  ctx.moveTo(tx - d * w, ty - w * 0.18);
  ctx.lineTo(tx, ty);
  ctx.lineTo(tx + d * w * 0.22, ty - w);
  ctx.stroke();
}

function drawBadge(ctx: Ctx, b: SceneBox, q: GT017QuestionKind): void {
  const [cx, cy, u] = [b.x + b.w * 0.5, b.y + b.h * 0.5, b.w * 0.18];
  ctx.fillStyle = m.plateLight;
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, Math.max(6, b.w * 0.22));
  ctx.fill();
  ctx.stroke();
  if (q === "count_cubes") {
    fbox(ctx, cx - u * 1.3, cy + u * 0.05, u * 1.05, m.amber);
    fbox(ctx, cx - u * 0.1, cy + u * 0.05, u * 1.05, m.amberDark);
    fbox(ctx, cx - u * 0.7, cy - u * 1.1, u * 1.05, m.amberLight);
    for (const dx of [-u, 0, u]) {
      disc(ctx, cx + dx, b.y + b.h - u * 0.55, 2, cl.brand[500]);
    }
  } else if (q === "top_view") {
    ctx.beginPath();
    ctx.arc(cx, cy - u * 0.45, u * 1.05, 3.6, 5.82);
    ctx.stroke();
    disc(ctx, cx, cy - u * 0.95, 1.7, m.amberDark);
    const g = u * 0.82;
    fbox(ctx, cx - g, cy - g * 0.25, g, m.amberLight);
    fbox(ctx, cx, cy - g * 0.25, g, m.amberLight);
    fbox(ctx, cx - g, cy + g * 0.75, g, m.amberLight);
    fbox(ctx, cx, cy + g * 0.75, g, m.plateMid);
  } else {
    for (const dx of [-u * 1.25, u * 0.2]) {
      fbox(ctx, cx + dx, cy - u * 1.05, u * 0.82, m.amberLight);
      fbox(ctx, cx + dx + u * 0.22, cy - u * 0.8, u * 0.82, m.emeraldLight);
    }
    ctx.strokeStyle = cl.semantic.success[500];
    seg(ctx, cx - u * 0.55, cy + u * 0.75, cx - u * 0.1, cy + u * 1.2);
    seg(ctx, cx - u * 0.1, cy + u * 1.2, cx + u * 0.65, cy + u * 0.35);
  }
}

function drawKnob(ctx: Ctx, k: GT017KnobGeom, d: -1 | 1, act: boolean): void {
  const y = k.cy - (act ? 1.5 : 0);
  disc(ctx, k.cx, k.cy + 1.5, k.r, m.woodBorder);
  disc(ctx, k.cx, y, k.r, act ? m.amberLight : m.plateLight);
  ctx.strokeStyle = act ? cl.brand[500] : m.woodBorder;
  ctx.lineWidth = act ? 2.5 : 2;
  ctx.stroke();
  ctx.strokeStyle = m.amberDark;
  ctx.lineWidth = 2;
  arcArrow(ctx, k.cx, y, k.r * 0.48, d);
}

function drawSpinArc(ctx: Ctx, t: GT017TurntableGeom, p: TP): void {
  const d = p.rotateDir === "ccw" ? -1 : 1;
  const [rx, ry] = [t.rx * 0.92, t.ry * 0.92];
  const [a0, a1] = d > 0 ? [0.35, 2.35] : [0.79, 2.79];
  const [tx, ty] = [t.cx - d * 0.7 * rx, t.cy + 0.7 * ry];
  ctx.strokeStyle = alpha(m.amber, p.spinProgress * 0.65);
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(t.cx, t.cy, rx, ry, 0, a0, a1, d < 0);
  ctx.moveTo(tx + d * 6, ty + 2);
  ctx.lineTo(tx, ty);
  ctx.lineTo(tx + d * 2, ty - 6);
  ctx.stroke();
}

export function drawGT017TurntableStage(ctx: Ctx, rs: RS, l: L, p: TP): void {
  const t = l.turntable;
  ctx.save();
  if (rs.softShadowsEnabled && !p.disableShadows) {
    ctx.shadowColor = alpha(m.woodBorder, 0.18);
    ctx.shadowBlur = 8;
  }
  ctx.fillStyle = m.woodBevel;
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = 2.5;
  ell(ctx, t.cx, t.cy + t.rimH, t.rx, t.ry);
  ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = m.plateLight;
  ell(ctx, t.cx, t.cy, t.rx, t.ry);
  ctx.stroke();
  ctx.fillStyle = m.plateMid;
  ctx.strokeStyle = m.plateInnerEdge;
  ctx.lineWidth = 1.5;
  ell(ctx, t.cx, t.cy, t.rx * 0.86, t.ry * 0.86);
  ctx.stroke();
  const ang = (p.visualAngleDeg * Math.PI) / 180;
  ctx.strokeStyle = alpha(m.woodBorder, 0.28);
  for (const base of [0, Math.PI * 0.5]) {
    const dx = Math.cos(ang + base) * t.rx * 0.68;
    const dy = Math.sin(ang + base) * t.ry * 0.68;
    seg(ctx, t.cx - dx, t.cy - dy, t.cx + dx, t.cy + dy);
  }
  ctx.fillStyle = alpha(m.woodBorder, 0.15);
  ell(ctx, t.cx, t.cy - t.ry * 0.08, t.rx * 0.52, t.ry * 0.48);
  const px = t.cx - Math.sin(ang) * t.rx * 0.76;
  disc(ctx, px, t.cy + Math.cos(ang) * t.ry * 0.76, 3.2, m.amber);
  if (p.spinProgress > 0 && !rs.reducedMotion) {
    drawSpinArc(ctx, t, p);
  }
  if (p.allowRotate) {
    const s = p.hoveredSide;
    drawKnob(ctx, t.leftKnob, -1, s === "ccw" || s === "center");
    drawKnob(ctx, t.rightKnob, 1, s === "cw" || s === "center");
  } else {
    for (const a of [0.78, 2.35, 3.92, 5.5]) {
      const rx = t.cx + Math.cos(a) * t.rx * 0.8;
      disc(ctx, rx, t.cy + Math.sin(a) * t.ry * 0.8, 2.5, m.woodBevel);
    }
  }
  drawBadge(ctx, l.badgeBox, p.question);
  ctx.restore();
}

function drawXray(ctx: Ctx, sx: number, sy: number, s: number): void {
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = cl.retry[400];
  ctx.fillStyle = alpha(m.amberGlow, 0.38);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy - s * 0.5);
  ctx.lineTo(sx + s, sy);
  ctx.lineTo(sx + s, sy + s);
  ctx.lineTo(sx, sy + s * 1.5);
  ctx.lineTo(sx - s, sy + s);
  ctx.lineTo(sx - s, sy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawGT017ModelOverlays(ctx: Ctx, rs: RS, l: L, p: MP): void {
  if (p.cubes.length === 0) {
    return;
  }
  const s = p.cubeSize;
  const xray = p.hintLevel >= 2 || p.showXray;
  const step = Math.floor(p.timeMs / 550) % p.cubes.length;
  const dr = Math.max(3.5, s * 0.18);
  ctx.save();
  p.cubes.forEach((c, idx) => {
    if (p.hintLevel >= 1 && c.z === 0) {
      ctx.strokeStyle = cl.retry[500];
      ctx.lineWidth = 2.5;
      seg(ctx, c.sx - s, c.sy + s, c.sx, c.sy + s * 1.5);
      seg(ctx, c.sx, c.sy + s * 1.5, c.sx + s, c.sy + s);
    }
    if (xray && c.hidden) {
      drawXray(ctx, c.sx, c.sy, s);
    }
    if (p.hintLevel === 3 && p.question === "count_cubes") {
      const lit = rs.reducedMotion || idx === step;
      disc(ctx, c.sx, c.sy, dr, lit ? m.emeraldBright : m.plateLight);
      ctx.strokeStyle = m.emerald;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  });
  if (p.question === "top_view" && xray) {
    const tb = l.topViewBox;
    const cell = tb.w / 4;
    ctx.strokeStyle = m.woodBorder;
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const col = (p.topView[r]?.[c] ?? 0) > 0 ? m.amberLight : m.plateLight;
        fbox(ctx, tb.x + c * cell, tb.y + r * cell, cell, col);
      }
    }
  }
  ctx.restore();
}

function drawIdleHighlight(ctx: Ctx, s: Slot, hinted: boolean): void {
  const [hw, hh] = [s.w * 0.5, s.h * 0.5];
  const r = Math.min(18, Math.min(s.w, s.h) * 0.22);
  ctx.setLineDash(hinted ? [6, 4] : []);
  ctx.strokeStyle = hinted ? cl.brand[500] : cl.brand[400];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(s.x - hw + 2, s.y - hh + 2, s.w - 4, s.h - 4, r);
  ctx.stroke();
  ctx.setLineDash([]);
  if (hinted) {
    ctx.fillStyle = cl.brand[500];
    ctx.beginPath();
    ctx.moveTo(s.x - 6, s.y - hh + 3);
    ctx.lineTo(s.x + 6, s.y - hh + 3);
    ctx.lineTo(s.x, s.y - hh + 10);
    ctx.fill();
  } else {
    seg(ctx, s.x - hw + r, s.y + hh - 4.5, s.x + hw - r, s.y + hh - 4.5);
  }
}

function star(ctx: Ctx, x: number, y: number, r: number, col: string): void {
  ctx.strokeStyle = col;
  seg(ctx, x - r, y, x + r, y);
  seg(ctx, x, y - r, x, y + r);
}

function drawStatusIcon(ctx: Ctx, s: Slot, p: CP): void {
  const ok = p.state === "correct";
  if (ok && p.showParticles) {
    ctx.lineWidth = 1.8;
    star(ctx, s.x - s.w * 0.29, s.y - s.h * 0.27, 4.2, m.amber);
    star(ctx, s.x + s.w * 0.26, s.y + s.h * 0.26, 3.8, m.emeraldBright);
    star(ctx, s.x - s.w * 0.26, s.y + s.h * 0.25, 3.4, m.amber);
  }
  const [bx, by] = [s.x + s.w * 0.5 - 11, s.y - s.h * 0.5 + 11];
  disc(ctx, bx, by, 7, ok ? cl.semantic.success[500] : cl.retry[500]);
  ctx.strokeStyle = cl.surface[0];
  ctx.lineWidth = 1.8;
  if (ok) {
    seg(ctx, bx - 3, by, bx - 0.5, by + 2.5);
    seg(ctx, bx - 0.5, by + 2.5, bx + 3.5, by - 2.5);
  } else {
    arcArrow(ctx, bx, by, 3.3, 1);
  }
}

export function drawGT017OptionCard(ctx: Ctx, rs: RS, slot: Slot, p: CP): void {
  const w = p.wrongProgress;
  const shk =
    p.state === "wrong" && !rs.reducedMotion
      ? Math.sin(w * 12.56) * 2.5 * (1 - w)
      : 0;
  const s = shk === 0 ? slot : { ...slot, x: slot.x + shk };
  drawSlotItem(ctx, rs, s, { id: p.id, asset: p.asset, state: p.state });
  ctx.save();
  if ((p.isHovered || p.isHinted) && p.state === "idle") {
    drawIdleHighlight(ctx, s, p.isHinted);
  }
  if (p.state === "correct" || p.state === "wrong") {
    drawStatusIcon(ctx, s, p);
  }
  if (p.state === "wrong") {
    rs.drawRetryRing(ctx, s.x, s.y, s.w * 0.42, w);
  }
  ctx.restore();
}
