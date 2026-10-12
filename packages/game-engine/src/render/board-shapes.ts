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
import {
  BOARD_LINE_PX,
  squareBox,
  WALL_LINE_PX,
} from "./shared-render-shapes.js";
import { legibleFontPx } from "./type-scale.js";
import type { SceneBox } from "./types.js";

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
  ctx.setLineDash([6, 5]);
  for (const cell of cells) {
    const p = mazeCellCenter(cell, m);
    const r = Math.min(m.cellW, m.cellH) * 0.34;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Cân thăng bằng (GT-014) ─────────────────────────────────────────

const MAX_TILT_DEG = 14;

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
  right: readonly WeightedItem[]
): { leftPan: SceneBox; rightPan: SceneBox } {
  const state = getBalanceState(sumWeights(left), sumWeights(right));
  let tiltDeg = 0;
  if (state === "left_heavy") {
    tiltDeg = MAX_TILT_DEG;
  } else if (state === "right_heavy") {
    tiltDeg = -MAX_TILT_DEG;
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

  const leftPan: SceneBox = {
    x: pivotX - dx - panW / 2,
    y: pivotY + dy,
    w: panW,
    h: panH,
  };
  const rightPan: SceneBox = {
    x: pivotX + dx - panW / 2,
    y: pivotY - dy,
    w: panW,
    h: panH,
  };
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
  ctx.font = `bold ${Math.floor(r * 0.19)}px ${designTokens.fonts.heading}`;
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
  const ordered = sortCubesForRender(model, rotation);
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
  ctx.setLineDash([12, 8]);
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
  reachedCount: number
): void {
  if (waypoints.length === 0) {
    return;
  }
  const ordered = waypoints;
  const waypointFontPx = legibleFontPx(14);
  const waypointR = Math.max(16, Math.ceil(waypointFontPx * 0.75));

  ctx.save();
  // Đường dẫn nét đứt mềm mại
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = WALL_LINE_PX;
  ctx.setLineDash([10, 8]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ordered.forEach((w, i) => {
    if (i === 0) {
      ctx.moveTo(w.x, w.y);
    } else {
      ctx.lineTo(w.x, w.y);
    }
  });
  ctx.stroke();

  // Phần đã đồ xong — Honey Amber / Emerald
  if (reachedCount > 1) {
    ctx.setLineDash([]);
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

  // Waypoint beads
  ordered.forEach((w, i) => {
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
    ctx.font = `bold ${waypointFontPx}px ${designTokens.fonts.heading}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), w.x, w.y);
    ctx.restore();
  });
}

// ── Vật thể đặt theo toạ độ của content (GT-022, GT-023, GT-025) ────
