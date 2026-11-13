import type { ZoneRect } from "#src/layout/stage-zones";
import { designTokens } from "#src/systems/designTokens";
import type { MazeCell, MazeSide } from "#src/systems/maze-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT013RenderView } from "#src/templates/GT-013/layout";
import { mazeCellCenter, mazeMetrics } from "./board-shapes.js";
import { alpha } from "./color-utils.js";
import type { SceneBox } from "./types.js";

type Ctx = CanvasRenderingContext2D;
type Sys = RenderSystem;
type View = GT013RenderView;
type Metrics = ReturnType<typeof mazeMetrics>;
type Pt = ReturnType<typeof mazeCellCenter>;
type Wall = View["grid"]["walls"][number];

const Z: Pt = { x: 0, y: 0 };
const STAR_ANGLES: readonly number[] = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]);
const ROT: Record<MazeSide, number> = {
  e: 0,
  s: 1.5708,
  w: Math.PI,
  n: -1.5708,
};
const C = designTokens.colors;
const M = C.montessori;

function clampBox(b: SceneBox, s?: ZoneRect): SceneBox {
  const x = s ? Math.max(s.x + 2, b.x - 4) : b.x - 4;
  const y = s ? Math.max(s.y + 2, b.y - 4) : b.y - 4;
  const r = s ? Math.min(s.x + s.w - 2, b.x + b.w + 4) : b.x + b.w + 4;
  const bt = s ? Math.min(s.y + s.h - 5, b.y + b.h + 4) : b.y + b.h + 4;
  return { x, y, w: Math.max(4, r - x), h: Math.max(4, bt - y) };
}

function clampR(p: Pt, r: number, s?: ZoneRect): number {
  const dx = s ? Math.min(p.x - s.x - 3, s.x + s.w - 3 - p.x) : r;
  const dy = s ? Math.min(p.y - s.y - 3, s.y + s.h - 3 - p.y) : r;
  return Math.max(2, Math.min(r, dx, dy));
}

function tracePoly(ctx: Ctx, cells: readonly MazeCell[], m: Metrics): void {
  ctx.beginPath();
  cells.forEach((cell, i) => {
    const p = mazeCellCenter(cell, m);
    ctx[i === 0 ? "moveTo" : "lineTo"](p.x, p.y);
  });
}

function dot(ctx: Ctx, p: Pt, r: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function sLine(ctx: Ctx, stroke: string, lw: number): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function disc(ctx: Ctx, p: Pt, r: number, f: string, s: string): void {
  dot(ctx, p, r, f);
  sLine(ctx, s, 2.2);
}

function rBox(ctx: Ctx, b: SceneBox, rad: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, rad);
  ctx.fill();
}

function drawTiles(ctx: Ctx, v: View, m: Metrics): void {
  const { rows, cols } = v.grid;
  for (let i = 0; i < rows * cols; i++) {
    const r = Math.floor(i / cols);
    const col = i % cols;
    const p = v.pressedCell?.row === r && v.pressedCell?.col === col;
    const sc = p ? 0.96 : 1;
    const w = Math.max(4, (m.cellW - 4) * sc);
    const h = Math.max(4, (m.cellH - 4) * sc);
    const x = m.originX + col * m.cellW + (m.cellW - w) / 2;
    const y = m.originY + r * m.cellH + (m.cellH - h) / 2 + (p ? 2 : 0);
    const tf = (r + col) % 2 === 0 ? M.plateLight : M.plateMid;
    rBox(ctx, { x, y, w, h }, 8, tf);
    sLine(ctx, p ? M.amberDark : M.plateEdge, p ? 2.2 : 1.2);
    const gy = y + h * (0.28 + (v.decorGrains[i] ?? 0.5) * 0.44);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, gy);
    ctx.lineTo(x + w * 0.8, gy);
    sLine(ctx, alpha(M.plateEdge, 0.45), 1);
  }
}

export function drawGT013BoardUnderlay(ctx: Ctx, rs: Sys, v: View): void {
  const m = mazeMetrics(v.grid, v.box);
  const f = clampBox(v.box, v.stageRect);
  ctx.save();
  if (rs.softShadowsEnabled && !v.degraded.disableShadows) {
    const sh = { x: f.x, y: f.y + 3, w: f.w, h: f.h };
    rBox(ctx, sh, 16, alpha(M.woodBorder, 0.22));
  }
  rBox(ctx, f, 16, M.woodBevel);
  sLine(ctx, M.woodBorder, 3);
  drawTiles(ctx, v, m);

  const sr = Math.min(m.cellW, m.cellH) * 0.34;
  const gp = mazeCellCenter(v.grid.goal, m);
  disc(ctx, mazeCellCenter(v.grid.start, m), sr, M.amberLight, M.amberDark);
  disc(ctx, gp, sr, C.semantic.success[100], M.emerald);

  if (v.isRoundClosed && !v.isWon && v.solutionRoute.length > 1) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.setLineDash([8, 6]);
    tracePoly(ctx, v.solutionRoute, m);
    sLine(ctx, alpha(M.emeraldBright, 0.88), Math.max(6, sr * 0.65));
    ctx.restore();
  }
  if (v.path.length > 1) {
    const rw = Math.max(8, Math.min(m.cellW, m.cellH) * 0.3);
    ctx.lineCap = "round";
    tracePoly(ctx, v.path, m);
    sLine(ctx, v.isWon ? M.emerald : M.amberDark, rw + 3);
    sLine(ctx, v.isWon ? M.emeraldBright : M.amberBright, rw);
  }
  ctx.restore();
}

function drawOneCoin(ctx: Ctx, r: number, vis: boolean, ma: number): void {
  if (!vis && ma > 0) {
    disc(ctx, Z, r + 5, alpha(C.retry[100], 0.2), alpha(C.retry[500], ma));
  }
  ctx.setLineDash(vis ? [] : [6, 5]);
  const cf = vis ? C.semantic.success[100] : M.amberGlow;
  disc(ctx, Z, r, cf, vis ? M.emerald : M.amberDark);
  ctx.setLineDash([]);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const sr = r * (i % 2 === 0 ? 0.68 : 0.32);
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * sr, Math.sin(a) * sr);
  }
  ctx.closePath();
  ctx.fillStyle = vis ? M.emeraldBright : M.amber;
  ctx.fill();
  if (vis) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, 0);
    ctx.lineTo(-r * 0.05, r * 0.22);
    ctx.lineTo(r * 0.3, -r * 0.2);
    sLine(ctx, M.emerald, 2.2);
  }
}

function drawStarCoins(ctx: Ctx, rs: Sys, v: View, m: Metrics): void {
  const minCell = Math.min(m.cellW, m.cellH);
  const breath = rs.reducedMotion ? 0 : Math.sin(v.timeMs / 240) * 0.06;
  const ma = v.missingRequiredAlpha;
  const wave = rs.reducedMotion ? 0 : -Math.abs(Math.sin(v.timeMs / 90)) * 4;
  for (const rc of v.requiredCells) {
    const vis = v.visitedKeys.has(`${rc.row},${rc.col}`);
    const c = mazeCellCenter(rc, m);
    ctx.save();
    ctx.translate(c.x, c.y + (!vis && ma > 0 ? wave * ma : 0));
    drawOneCoin(ctx, minCell * (0.28 + (vis ? 0 : breath)), vis, ma);
    ctx.restore();
  }
}

function drawNeighborCues(ctx: Ctx, v: View, m: Metrics): void {
  const minCell = Math.min(m.cellW, m.cellH);
  const cueColor = alpha(M.woodBorder, 0.28);
  for (const nb of v.openNeighbors) {
    const p = mazeCellCenter(nb.cell, m);
    if (v.inputMode !== "arrows") {
      if (!nb.isBacktrack) {
        dot(ctx, p, Math.max(3, minCell * 0.07), cueColor);
      }
      continue;
    }
    const br = minCell * 0.18;
    const bf = nb.isBacktrack ? M.plateEdge : M.amberLight;
    disc(ctx, p, br, bf, M.woodBorder);
    const a = ROT[nb.side];
    const ca = Math.cos(a) * br;
    const sa = Math.sin(a) * br;
    ctx.fillStyle = M.amberDark;
    ctx.beginPath();
    ctx.moveTo(p.x + ca * 0.55, p.y + sa * 0.55);
    ctx.lineTo(p.x - ca * 0.35 + sa * 0.45, p.y - sa * 0.35 - ca * 0.45);
    ctx.lineTo(p.x - ca * 0.35 - sa * 0.45, p.y - sa * 0.35 + ca * 0.45);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWall(ctx: Ctx, m: Metrics, w: Wall, lw: number, sh = 0): void {
  const l = m.originX + w.col * m.cellW;
  const t = m.originY + w.row * m.cellH;
  const r = l + m.cellW;
  const b = t + m.cellH;
  const h = w.side === "n" || w.side === "s";
  const dx = h ? 0 : sh;
  const dy = h ? sh : 0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo((w.side === "e" ? r : l) + dx, (w.side === "s" ? b : t) + dy);
  ctx.lineTo((w.side === "w" ? l : r) + dx, (w.side === "n" ? t : b) + dy);
  sLine(ctx, sh === 0 ? M.woodBorder : C.retry[500], lw);
  sLine(ctx, sh === 0 ? M.woodBevel : M.amberLight, Math.max(1.5, lw * 0.38));
}

export function drawGT013WaypointsAndWalls(ctx: Ctx, rs: Sys, v: View): void {
  const m = mazeMetrics(v.grid, v.box);
  const minCell = Math.min(m.cellW, m.cellH);
  ctx.save();
  drawStarCoins(ctx, rs, v, m);
  if (!(v.isWon || v.isRoundClosed)) {
    drawNeighborCues(ctx, v, m);
  }
  const fh = v.hintCells[0];
  if (v.activeHintLevel === 1 && fh) {
    const fp = mazeCellCenter(fh, m);
    rs.drawScaffoldingHighlight(ctx, fp.x, fp.y, minCell * 0.3, v.timeMs / 600);
  } else if (v.activeHintLevel > 1 && v.hintCells.length > 0) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    tracePoly(ctx, [v.head, ...v.hintCells], m);
    rs.strokeHintPath(ctx, 3.5);
    ctx.restore();
  }
  const wt = Math.max(5, minCell * 0.11);
  for (const w of v.grid.walls) {
    drawWall(ctx, m, w, wt);
  }
  if (v.blockedProgress > 0 && v.blockedWall) {
    const bp = v.blockedProgress;
    const sh = rs.reducedMotion ? 0.01 : Math.sin(bp * Math.PI * 5) * bp * 3.5;
    drawWall(ctx, m, v.blockedWall, wt + 1.5, sh || 0.01);
  }
  ctx.restore();
}

function drawMousePuck(ctx: Ctx, hp: Pt, r: number, v: View): void {
  for (const dir of [-1, 1] as const) {
    const ep = { x: hp.x + dir * r * 0.68, y: hp.y - r * 0.62 };
    disc(ctx, ep, r * 0.42, M.woodBevel, M.woodBorder);
  }
  const hit = v.blockedProgress > 0;
  let pf: string = hit ? M.amberLight : C.surface[0];
  let ps: string = hit ? C.retry[600] : M.amberDark;
  if (v.isWon) {
    pf = C.semantic.success[100];
    ps = M.emerald;
  }
  disc(ctx, hp, r, pf, ps);
  const er = Math.max(1.5, r * 0.11);
  dot(ctx, { x: hp.x - r * 0.3, y: hp.y - r * 0.08 }, er, C.surface[800]);
  dot(ctx, { x: hp.x + r * 0.3, y: hp.y - r * 0.08 }, er, C.surface[800]);
  dot(ctx, { x: hp.x, y: hp.y + r * 0.18 }, Math.max(1.8, r * 0.13), M.coral);
}

export function drawGT013HeadAndFeedback(ctx: Ctx, rs: Sys, v: View): void {
  const m = mazeMetrics(v.grid, v.box);
  const hp = mazeCellCenter(v.head, m);
  const baseR = Math.min(m.cellW, m.cellH) * 0.25;
  const busy =
    v.stepPopProgress || v.blockedProgress || v.isWon || v.isRoundClosed;
  const idle = v.path.length === 1 && !busy && !rs.reducedMotion;
  const breath = idle ? Math.sin(v.timeMs / 280) * 0.04 : 0;
  const wave = Math.sin(v.stepPopProgress * Math.PI) * 0.14 + breath;
  const sc = v.blockedProgress > 0 ? 0.92 : 1 + wave;
  const r = clampR(hp, baseR * (rs.reducedMotion ? 1 : sc), v.stageRect);

  ctx.save();
  if (v.winProgress > 0 && !rs.reducedMotion && !v.degraded.disableParticles) {
    const sr = clampR(hp, baseR * (1.25 + v.winProgress * 0.45), v.stageRect);
    for (const k of STAR_ANGLES) {
      const a = (k * Math.PI) / 4 + v.winProgress * 1.2;
      const sp = { x: hp.x + Math.cos(a) * sr, y: hp.y + Math.sin(a) * sr };
      dot(ctx, sp, 2.5, M.amberBright);
    }
  }
  drawMousePuck(ctx, hp, r, v);
  const bc = v.blockedCell;
  if (bc && v.blockedProgress > 0) {
    const { rows, cols } = v.grid;
    const inB = bc.row >= 0 && bc.row < rows && bc.col >= 0 && bc.col < cols;
    const rp = inB ? mazeCellCenter(bc, m) : hp;
    const rr = clampR(rp, baseR * 1.52, v.stageRect);
    rs.drawRetryRing(ctx, rp.x, rp.y, rr, 1 - v.blockedProgress);
  }
  ctx.restore();
}
