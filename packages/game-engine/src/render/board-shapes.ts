import type { Slot } from "#src/layout/types";
import {
  getBalanceState,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import { designTokens } from "#src/systems/designTokens";
import {
  type CubeCoord,
  projectIsometric,
  type RotationAngle,
  sortCubesForRender,
} from "#src/systems/isometric-system";
import type { MazeCell, MazeGrid } from "#src/systems/maze-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { ClockTime } from "#src/systems/rotation-system";
import { timeToAngles } from "#src/systems/rotation-system";
import { alpha } from "./color-utils.js";
import { drawGoalFlag } from "./craft-shapes.js";
import {
  BOARD_LINE_PX,
  squareBox,
  WALL_LINE_PX,
} from "./shared-render-shapes.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";
import type { SceneBox } from "./types.js";

const DASH_6_5: readonly number[] = Object.freeze([6, 5]);
const DASH_12_8: readonly number[] = Object.freeze([12, 8]);
const DASH_10_8: readonly number[] = Object.freeze([10, 8]);
const DASH_EMPTY: readonly number[] = Object.freeze([]);

export interface MazeCellBox {
  readonly cellW: number;
  readonly cellH: number;
  readonly originX: number;
  readonly originY: number;
}

export function mazeMetrics(grid: MazeGrid, box: SceneBox): MazeCellBox {
  const cellW = box.w / grid.cols;
  const cellH = box.h / grid.rows;
  return { cellW, cellH, originX: box.x, originY: box.y };
}

export function mazeCellCenter(
  cell: MazeCell,
  m: MazeCellBox
): { x: number; y: number } {
  return {
    x: m.originX + (cell.col + 0.5) * m.cellW,
    y: m.originY + (cell.row + 0.5) * m.cellH,
  };
}

export function drawMazeBoard(
  ctx: CanvasRenderingContext2D,
  grid: MazeGrid,
  box: SceneBox,
  path: readonly MazeCell[]
): void {
  const m = mazeMetrics(grid, box);

  ctx.save();
  // Warm wooden board base with rounded corners
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 16);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = BOARD_LINE_PX;
  ctx.stroke();

  // Grid cell subtle lines
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 1.5;
  for (let r = 1; r < grid.rows; r++) {
    const y = m.originY + r * m.cellH;
    ctx.beginPath();
    ctx.moveTo(box.x + 8, y);
    ctx.lineTo(box.x + box.w - 8, y);
    ctx.stroke();
  }
  for (let c = 1; c < grid.cols; c++) {
    const x = m.originX + c * m.cellW;
    ctx.beginPath();
    ctx.moveTo(x, box.y + 8);
    ctx.lineTo(x, box.y + box.h - 8);
    ctx.stroke();
  }

  // Path traced by child (Honey Amber ribbon)
  if (path.length > 1) {
    ctx.strokeStyle = designTokens.colors.montessori.amber;
    ctx.lineWidth = Math.max(8, Math.min(m.cellW, m.cellH) * 0.32);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    path.forEach((cell, i) => {
      const p = mazeCellCenter(cell, m);
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.stroke();
  }

  // Wooden Maze Walls
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = WALL_LINE_PX;
  ctx.lineCap = "round";
  for (const wall of grid.walls) {
    const left = m.originX + wall.col * m.cellW;
    const top = m.originY + wall.row * m.cellH;
    const right = left + m.cellW;
    const bottom = top + m.cellH;
    ctx.beginPath();
    if (wall.side === "n") {
      ctx.moveTo(left, top);
      ctx.lineTo(right, top);
    } else if (wall.side === "s") {
      ctx.moveTo(left, bottom);
      ctx.lineTo(right, bottom);
    } else if (wall.side === "w") {
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
    } else {
      ctx.moveTo(right, top);
      ctx.lineTo(right, bottom);
    }
    ctx.stroke();
  }

  // Start (Honey Amber) and Goal (Meadow Emerald) Sockets
  const start = mazeCellCenter(grid.start, m);
  const goal = mazeCellCenter(grid.goal, m);
  const r = Math.min(m.cellW, m.cellH) * 0.34;

  // Start socket
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Goal socket
  ctx.fillStyle = designTokens.colors.montessori.emeraldBright;
  ctx.strokeStyle = designTokens.colors.montessori.emerald;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Current head indicator when player has stepped beyond start
  const headCell = path.at(-1);
  if (path.length > 1 && headCell) {
    const headPos = mazeCellCenter(headCell, m);
    ctx.fillStyle = designTokens.colors.surface[0];
    ctx.strokeStyle = designTokens.colors.montessori.amberDark;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y, r * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRequiredCells(
  ctx: CanvasRenderingContext2D,
  grid: MazeGrid,
  box: SceneBox,
  cells: readonly MazeCell[]
): void {
  const m = mazeMetrics(grid, box);
  ctx.save();
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = BOARD_LINE_PX;
  ctx.setLineDash(DASH_6_5);
  for (const cell of cells) {
    const p = mazeCellCenter(cell, m);
    const r = Math.min(m.cellW, m.cellH) * 0.34;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Cờ ở đích và dấu chân trên đường (GT-013, `BR-E013-09`, `BR-E013-10`) ─────

/** Số dấu chân mỗi đoạn đường giữa hai ô liền kề. */
export const MAZE_FOOTPRINTS_PER_STEP = 2;

/** Một dấu chân: toạ độ tâm và góc hướng đi (rad). */
export interface MazeFootprint {
  readonly angle: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Dấu chân dọc **đúng đoạn đường đã đi** (`path`): mỗi cặp ô liền kề cho
 * `MAZE_FOOTPRINTS_PER_STEP` dấu, so le trái/phải. Hàm thuần, chỉ đọc nét vẽ
 * của trẻ — không đọc đích hay đường đúng.
 */
export function mazeFootprints(
  grid: MazeGrid,
  box: SceneBox,
  path: readonly MazeCell[]
): MazeFootprint[] {
  const m = mazeMetrics(grid, box);
  const out: MazeFootprint[] = [];
  const side = Math.min(m.cellW, m.cellH) * 0.1;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const cur = path[i];
    if (!(prev && cur)) {
      continue;
    }
    const a = mazeCellCenter(prev, m);
    const b = mazeCellCenter(cur, m);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    for (let k = 0; k < MAZE_FOOTPRINTS_PER_STEP; k++) {
      const t = (k + 1) / (MAZE_FOOTPRINTS_PER_STEP + 1);
      const lateral = (k + i) % 2 === 0 ? side : -side;
      out.push({
        angle,
        x: a.x + (b.x - a.x) * t - Math.sin(angle) * lateral,
        y: a.y + (b.y - a.y) * t + Math.cos(angle) * lateral,
      });
    }
  }
  return out;
}

/** Dấu chân chuột: một đệm và ba ngón nhỏ, xoay theo hướng đi. */
export function drawMazeFootprints(
  ctx: CanvasRenderingContext2D,
  grid: MazeGrid,
  box: SceneBox,
  path: readonly MazeCell[]
): void {
  const m = mazeMetrics(grid, box);
  const r = Math.max(2.5, Math.min(m.cellW, m.cellH) * 0.045);
  ctx.save();
  ctx.fillStyle = alpha(designTokens.colors.montessori.amberDark, 0.55);
  for (const f of mazeFootprints(grid, box, path)) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.3, r, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const dy of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.arc(r * 1.9, dy * r * 0.9, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Lá cờ trên ô đích (`BR-E013-10`). Content không có trường nhân vật hay vật ở
 * đích, nên đích không được là một vật cụ thể: cột cờ gỗ cùng lá cờ. Có
 * `goalGlyph` (`BR-E013-11`) thì cờ to hơn và mang con số đó, khớp đề "về tới lá
 * cờ số N"; con số chỉ là tên của đích, không chỉ đường.
 */
export function drawMazeGoalFlag(
  ctx: CanvasRenderingContext2D,
  grid: MazeGrid,
  box: SceneBox,
  goalGlyph?: string
): void {
  const m = mazeMetrics(grid, box);
  const c = mazeCellCenter(grid.goal, m);
  const cell = Math.min(m.cellW, m.cellH);
  if (goalGlyph) {
    drawGoalFlag(ctx, c.x, c.y, cell * 0.36, goalGlyph);
    return;
  }
  drawGoalFlag(ctx, c.x, c.y, cell * 0.26);
}

// ── Cân thăng bằng (GT-014) ─────────────────────────────────────────

const MAX_TILT_DEG = 14;

/** Đĩa lún tối đa bằng ngần này phần chiều cao đĩa khi vật trên đĩa nặng bằng tổng khối lượng cả bài (`BR-E014-07`). */
export const PAN_SINK_MAX_FRACTION = 0.3;
/** Tốc độ đĩa lún/nảy lại, đơn vị "mức lún đầy" mỗi giây (đầy trong ~0,4 s). */
const PAN_SINK_RATE_PER_S = 2.5;

/** Mức lún đích 0..1 của một đĩa: tỉ lệ với khối lượng **đang nằm trên đĩa đó** so với tổng cả bài. */
export function panSinkTarget(panWeight: number, totalWeight: number): number {
  if (!(panWeight > 0 && totalWeight > 0)) {
    return 0;
  }
  return Math.min(1, panWeight / totalWeight);
}

/** Mức lún tiến dần từ `current` tới `target` theo đồng hồ khung; không vượt quá đích. */
export function approachPanSink(
  current: number,
  target: number,
  deltaMs: number
): number {
  const step = (Math.max(0, deltaMs) / 1000) * PAN_SINK_RATE_PER_S;
  const diff = target - current;
  return Math.abs(diff) <= step ? target : current + Math.sign(diff) * step;
}

/** Đổi mức lún 0..1 ra px theo chiều cao đĩa. */
export function panSinkPx(level: number, panH: number): number {
  return Math.max(0, Math.min(1, level)) * panH * PAN_SINK_MAX_FRACTION;
}

/** Mức lún 0..1 của hai đĩa. */
export interface PanSink {
  readonly left: number;
  readonly right: number;
}

/** Hình học cân ở tư thế cân bằng — hàm thuần để engine đặt vùng chạm hai đĩa. */
export function balanceScaleGeometry(box: SceneBox): {
  readonly pivotX: number;
  readonly pivotY: number;
  readonly beamHalf: number;
  readonly panW: number;
  readonly panH: number;
} {
  return {
    pivotX: box.x + box.w / 2,
    pivotY: box.y + box.h * 0.55,
    beamHalf: box.w * 0.32,
    panW: box.w * 0.26,
    panH: box.h * 0.16,
  };
}

export function drawBalanceScale(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  left: readonly WeightedItem[],
  right: readonly WeightedItem[],
  smoothTiltDeg?: number,
  sink?: PanSink
): { leftPan: SceneBox; rightPan: SceneBox } {
  let tiltDeg = 0;
  if (smoothTiltDeg === undefined) {
    const state = getBalanceState(sumWeights(left), sumWeights(right));
    if (state === "left_heavy") {
      tiltDeg = MAX_TILT_DEG;
    } else if (state === "right_heavy") {
      tiltDeg = -MAX_TILT_DEG;
    }
  } else {
    tiltDeg = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, -smoothTiltDeg));
  }
  const rad = (tiltDeg * Math.PI) / 180;

  const { pivotX, pivotY, beamHalf, panW, panH } = balanceScaleGeometry(box);

  ctx.save();
  // Oak Post & Fulcrum base
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = WALL_LINE_PX + 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(pivotX, box.y + box.h);
  ctx.stroke();

  // Wooden base plate
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(pivotX - 50, box.y + box.h - 8, 100, 16, 8);
  ctx.fill();

  // Tilting Oak Balance Beam
  const dx = Math.cos(rad) * beamHalf;
  const dy = Math.sin(rad) * beamHalf;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  ctx.lineWidth = WALL_LINE_PX;
  ctx.beginPath();
  ctx.moveTo(pivotX - dx, pivotY + dy);
  ctx.lineTo(pivotX + dx, pivotY - dy);
  ctx.stroke();

  // Center Brass Pivot Pin
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const leftSink = panSinkPx(sink?.left ?? 0, panH);
  const rightSink = panSinkPx(sink?.right ?? 0, panH);
  const leftPan: SceneBox = {
    x: pivotX - dx - panW / 2,
    y: pivotY + dy + leftSink,
    w: panW,
    h: panH,
  };
  const rightPan: SceneBox = {
    x: pivotX + dx - panW / 2,
    y: pivotY - dy + rightSink,
    w: panW,
    h: panH,
  };
  // Đĩa lún thì dây treo dài ra từ đầu đòn (`BR-E014-07`).
  ctx.save();
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 1.5;
  for (const [pan, drop] of [
    [leftPan, leftSink],
    [rightPan, rightSink],
  ] as const) {
    if (drop > 0) {
      ctx.beginPath();
      ctx.moveTo(pan.x + pan.w / 2, pan.y - 12 - drop);
      ctx.lineTo(pan.x + pan.w / 2, pan.y - 12);
      ctx.stroke();
    }
  }
  ctx.restore();
  drawPan(ctx, leftPan);
  drawPan(ctx, rightPan);
  return { leftPan, rightPan };
}

function drawPan(ctx: CanvasRenderingContext2D, pan: SceneBox): void {
  ctx.save();
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.14);
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.moveTo(pan.x, pan.y);
  ctx.lineTo(pan.x + pan.w, pan.y);
  ctx.lineTo(pan.x + pan.w * 0.82, pan.y + pan.h);
  ctx.lineTo(pan.x + pan.w * 0.18, pan.y + pan.h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = BOARD_LINE_PX;
  ctx.stroke();

  // Pan suspension cords
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pan.x + pan.w / 2, pan.y - 12);
  ctx.lineTo(pan.x + 8, pan.y);
  ctx.moveTo(pan.x + pan.w / 2, pan.y - 12);
  ctx.lineTo(pan.x + pan.w - 8, pan.y);
  ctx.stroke();

  ctx.restore();
}

// ── Mặt đồng hồ (GT-016) ────────────────────────────────────────────

export function drawClockFace(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  time: ClockTime
): void {
  const face = squareBox(box);
  const cx = face.x + face.w / 2;
  const cy = face.y + face.h / 2;
  const r = face.w / 2;

  ctx.save();
  // Warm wooden frame with ambient shadow
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.18);
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = WALL_LINE_PX;
  ctx.stroke();

  // Inner decorative rim
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  // 12 vạch giờ + số trong phông Fredoka/Quicksand
  ctx.fillStyle = designTokens.colors.surface[900];
  applyCanvasFontAtSize(ctx, Math.floor(r * 0.19), "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let h = 1; h <= 12; h++) {
    const a = ((h * 30 - 90) * Math.PI) / 180;
    ctx.fillText(
      String(h),
      cx + Math.cos(a) * r * 0.76,
      cy + Math.sin(a) * r * 0.76
    );
  }

  const angles = timeToAngles(time);
  // Kim giờ to bản Honey Amber
  drawHand(
    ctx,
    cx,
    cy,
    angles.hourAngleDeg,
    r * 0.5,
    7,
    designTokens.colors.montessori.amberDark
  );
  // Kim phút Meadow Emerald
  drawHand(
    ctx,
    cx,
    cy,
    angles.minuteAngleDeg,
    r * 0.78,
    5,
    designTokens.colors.montessori.emerald
  );

  // Chốt giữa bằng đồng thau Honey Amber
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(6, r * 0.06), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
  width: number,
  color: string = designTokens.colors.surface[800]
): void {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * length, cy + Math.sin(a) * length);
  ctx.stroke();
  ctx.restore();
}

// ── Khối lập phương đẳng cự (GT-017) ────────────────────────────────

/** Nét viền khối (2.5 px) tràn ra ngoài mép hình một nửa bề dày. */
const CUBE_STROKE_PAD_PX = 2;

interface IsometricFit {
  readonly size: number;
  readonly cx: number;
  readonly cy: number;
}

/**
 * Cỡ khối và tâm vẽ sao cho cả mô hình nằm trọn `box`: mỗi khối rộng 2 cạnh,
 * cao từ nửa cạnh trên tâm tới 1,5 cạnh dưới tâm (mặt trái kéo xuống một cạnh).
 */
function fitIsometric(
  box: SceneBox,
  ordered: readonly CubeCoord[],
  baseSize: number
): IsometricFit {
  const unit = ordered.map((cube) => projectIsometric(cube, 0, 0, 1));
  const minX = Math.min(...unit.map((p) => p.screenX)) - 1;
  const maxX = Math.max(...unit.map((p) => p.screenX)) + 1;
  const minY = Math.min(...unit.map((p) => p.screenY)) - 0.5;
  const maxY = Math.max(...unit.map((p) => p.screenY)) + 1.5;
  const size = Math.max(
    1,
    Math.min(
      baseSize,
      (box.w - 2 * CUBE_STROKE_PAD_PX) / (maxX - minX),
      (box.h - 2 * CUBE_STROKE_PAD_PX) / (maxY - minY)
    )
  );
  return {
    size,
    cx: box.x + box.w / 2 - ((minX + maxX) / 2) * size,
    cy: box.y + box.h / 2 - ((minY + maxY) / 2) * size,
  };
}

const sortedCubeCache = new WeakMap<
  readonly CubeCoord[],
  Map<RotationAngle, readonly CubeCoord[]>
>();

function getCachedSortedCubes(
  model: readonly CubeCoord[],
  rotation: RotationAngle
): readonly CubeCoord[] {
  let byRotation = sortedCubeCache.get(model);
  if (!byRotation) {
    byRotation = new Map<RotationAngle, readonly CubeCoord[]>();
    sortedCubeCache.set(model, byRotation);
  }
  let sorted = byRotation.get(rotation);
  if (!sorted) {
    sorted = sortCubesForRender(model, rotation);
    byRotation.set(rotation, sorted);
  }
  return sorted;
}

export function drawIsometricModel(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  model: readonly CubeCoord[],
  rotation: RotationAngle,
  /** Có thì co và căn mô hình vào trọn `box` (`BR-PSZ-01`); không thì giữ bố cục cũ. */
  fit = false
): void {
  if (model.length === 0) {
    return;
  }
  const ordered = getCachedSortedCubes(model, rotation);
  const baseSize = Math.min(box.w, box.h) / 6;
  const fitted = fit ? fitIsometric(box, ordered, baseSize) : undefined;
  const size = fitted?.size ?? baseSize;
  const cx = fitted?.cx ?? box.x + box.w / 2;
  const cy = fitted?.cy ?? box.y + box.h * 0.62;

  ctx.save();
  for (const cube of ordered) {
    const p = projectIsometric(cube, cx, cy, size);
    drawCube(ctx, p.screenX, p.screenY, size);
  }
  ctx.restore();
}

function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number
): void {
  const hw = s;
  const hh = s * 0.5;
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;

  // Mặt trên (sáng nhất)
  ctx.fillStyle = designTokens.colors.montessori.amberLight;
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mặt trái (trung bình)
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x, y + hh + s);
  ctx.lineTo(x - hw, y + s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mặt phải (tối / đổ bóng)
  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.beginPath();
  ctx.moveTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x, y + hh + s);
  ctx.lineTo(x + hw, y + s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ── Trục đối xứng (GT-021) ──────────────────────────────────────────

export function drawMirrorAxis(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  axis: "vertical" | "horizontal",
  box?: SceneBox
): void {
  // Không có hộp thì trục chạy suốt canvas — đường vẽ của engine chưa dời khung.
  const area = box ?? { x: 0, y: 0, w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
  ctx.save();
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = BOARD_LINE_PX + 1;
  ctx.setLineDash(DASH_12_8);
  ctx.beginPath();
  if (axis === "vertical") {
    ctx.moveTo(area.x + area.w / 2, area.y);
    ctx.lineTo(area.x + area.w / 2, area.y + area.h);
  } else {
    ctx.moveTo(area.x, area.y + area.h / 2);
    ctx.lineTo(area.x + area.w, area.y + area.h / 2);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Đường đồ theo mốc (GT-024) ──────────────────────────────────────

export interface TraceWaypointLike {
  readonly x: number;
  readonly y: number;
  readonly order: number;
  readonly label?: string;
}

export function drawWaypointPath(
  ctx: CanvasRenderingContext2D,
  waypoints: readonly TraceWaypointLike[],
  reachedCount: number,
  options: { showGuideLines?: boolean; showNumberedDots?: boolean } = {}
): void {
  const showGuideLines = options.showGuideLines !== false;
  const showNumberedDots = options.showNumberedDots !== false;
  if (waypoints.length === 0) {
    return;
  }
  const ordered = waypoints;
  const waypointFontPx = legibleFontPx(14);
  const waypointR = Math.max(16, Math.ceil(waypointFontPx * 0.75));

  ctx.save();
  // Đường dẫn nét đứt mềm mại
  ctx.lineWidth = WALL_LINE_PX;
  ctx.lineCap = "round";
  // Đường dẫn mờ chỉ vẽ khi `show_guide_lines` bật (`GT-024.md` N1).
  if (showGuideLines) {
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.setLineDash(DASH_10_8);
    ctx.beginPath();
    ordered.forEach((w, i) => {
      if (i === 0) {
        ctx.moveTo(w.x, w.y);
      } else {
        ctx.lineTo(w.x, w.y);
      }
    });
    ctx.stroke();
  }

  // Phần đã đồ xong — Honey Amber / Emerald
  if (reachedCount > 1) {
    ctx.setLineDash(DASH_EMPTY);
    ctx.strokeStyle = designTokens.colors.montessori.amber;
    ctx.beginPath();
    ordered.slice(0, reachedCount).forEach((w, i) => {
      if (i === 0) {
        ctx.moveTo(w.x, w.y);
      } else {
        ctx.lineTo(w.x, w.y);
      }
    });
    ctx.stroke();
  }
  ctx.restore();

  // Waypoint beads. Điểm khép kín trùng toạ độ với điểm đã vẽ trước đó chỉ vẽ một
  // lần (giữ nhãn đầu), tránh nhãn sau đè lên nhãn đầu (`BR-E024-07`).
  ordered.forEach((w, i) => {
    if (ordered.slice(0, i).some((p) => p.x === w.x && p.y === w.y)) {
      return;
    }
    const done = i < reachedCount;
    ctx.save();
    ctx.fillStyle = done
      ? designTokens.colors.montessori.emeraldBright
      : designTokens.colors.surface[0];
    ctx.strokeStyle = done
      ? designTokens.colors.montessori.emerald
      : designTokens.colors.montessori.woodBorder;
    ctx.lineWidth = BOARD_LINE_PX;
    ctx.beginPath();
    ctx.arc(w.x, w.y, waypointR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = done
      ? designTokens.colors.surface[0]
      : designTokens.colors.surface[900];
    // Số thứ tự chỉ hiện khi `show_numbered_dots` bật (`GT-024.md` N1).
    if (showNumberedDots) {
      applyCanvasFontAtSize(ctx, waypointFontPx, "heading", "bold");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(w.label ?? String(i + 1), w.x, w.y);
    }
    ctx.restore();
  });
}

// ── Khung cân mẫu & Bảng lưới Sudoku (GT-014, GT-015) ───────────────

export function drawReferenceScaleCard(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const padX = 10;
  const padY = 6;
  ctx.save();
  ctx.fillStyle = alpha(designTokens.colors.montessori.paper, 0.88);
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(
    box.x - padX,
    box.y - padY,
    box.w + padX * 2,
    box.h + padY * 2,
    14
  );
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawSudokuBoardFrame(
  ctx: CanvasRenderingContext2D,
  cellSlots: readonly Slot[],
  gridSize: 2 | 3 | 4,
  regions: "row_col" | "row_col_box" = "row_col"
): void {
  if (cellSlots.length === 0) {
    return;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const s of cellSlots) {
    const halfW = s.w / 2;
    const halfH = s.h / 2;
    minX = Math.min(minX, s.x - halfW);
    minY = Math.min(minY, s.y - halfH);
    maxX = Math.max(maxX, s.x + halfW);
    maxY = Math.max(maxY, s.y + halfH);
  }
  const pad = 12;
  const bx = minX - pad;
  const by = minY - pad;
  const bw = maxX - minX + pad * 2;
  const bh = maxY - minY + pad * 2;

  ctx.save();
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = alpha(designTokens.colors.montessori.paper, 0.92);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 18);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = BOARD_LINE_PX;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 18);
  ctx.stroke();

  if (regions === "row_col_box" && gridSize === 4) {
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
    ctx.lineWidth = WALL_LINE_PX;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(midX, by + 6);
    ctx.lineTo(midX, by + bh - 6);
    ctx.moveTo(bx + 6, midY);
    ctx.lineTo(bx + bw - 6, midY);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Vật thể đặt theo toạ độ của content (GT-022, GT-023, GT-025) ────
