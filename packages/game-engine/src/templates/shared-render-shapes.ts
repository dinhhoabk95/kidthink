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
  rotateModelZ,
  sortCubesForRender,
} from "#src/systems/isometric-system";
import type { MazeCell, MazeGrid } from "#src/systems/maze-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { ClockTime } from "#src/systems/rotation-system";
import { timeToAngles } from "#src/systems/rotation-system";
import {
  drawSlotItem,
  type RenderAsset,
  type SceneBox,
} from "./shared-render.js";

/**
 * Bàn chơi riêng của từng engine — mê cung, cân, đồng hồ, khối lập phương,
 * trục đối xứng, đường đồ.
 *
 * Mỗi hàm nhận một **hộp** (`SceneBox`) đo từ khung logic hoặc từ slot của
 * layout, rồi tự chia ô bên trong. Không hàm nào đọc `960`/`540` trực tiếp:
 * kích thước luôn đi vào qua tham số, nên đổi khung logic là bố cục theo cùng.
 */

const BOARD_LINE_PX = 3;
const WALL_LINE_PX = 6;

/** Hộp con canh giữa trong một hộp cha, chừa lề theo tỉ lệ. */
export function insetBox(box: SceneBox, ratio: number): SceneBox {
  const dx = box.w * ratio;
  const dy = box.h * ratio;
  return { x: box.x + dx, y: box.y + dy, w: box.w - dx * 2, h: box.h - dy * 2 };
}

/** Hộp vuông lớn nhất nằm gọn trong hộp cha, canh giữa. */
export function squareBox(box: SceneBox): SceneBox {
  const side = Math.min(box.w, box.h);
  return {
    x: box.x + (box.w - side) / 2,
    y: box.y + (box.h - side) / 2,
    w: side,
    h: side,
  };
}

/** Hộp bao quanh một nhóm slot — dùng khi engine vẽ bàn chơi lên vùng slot. */
export function boxFromSlots(slots: readonly Slot[]): SceneBox | null {
  if (slots.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const s of slots) {
    minX = Math.min(minX, s.x - s.w / 2);
    minY = Math.min(minY, s.y - s.h / 2);
    maxX = Math.max(maxX, s.x + s.w / 2);
    maxY = Math.max(maxY, s.y + s.h / 2);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ── Mê cung (GT-013) ────────────────────────────────────────────────

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
  // Nền ô
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = BOARD_LINE_PX;
  for (let r = 0; r <= grid.rows; r++) {
    const y = m.originY + r * m.cellH;
    ctx.beginPath();
    ctx.moveTo(box.x, y);
    ctx.lineTo(box.x + box.w, y);
    ctx.stroke();
  }
  for (let c = 0; c <= grid.cols; c++) {
    const x = m.originX + c * m.cellW;
    ctx.beginPath();
    ctx.moveTo(x, box.y);
    ctx.lineTo(x, box.y + box.h);
    ctx.stroke();
  }

  // Đường trẻ đã đi
  if (path.length > 1) {
    ctx.strokeStyle = designTokens.colors.brand[400];
    ctx.lineWidth = Math.max(6, Math.min(m.cellW, m.cellH) * 0.25);
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

  // Tường
  ctx.strokeStyle = designTokens.colors.surface[700];
  ctx.lineWidth = WALL_LINE_PX;
  ctx.lineCap = "square";
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

  // Ô đầu và ô đích
  const start = mazeCellCenter(grid.start, m);
  const goal = mazeCellCenter(grid.goal, m);
  const r = Math.min(m.cellW, m.cellH) * 0.3;
  ctx.fillStyle = designTokens.colors.brand[300];
  ctx.beginPath();
  ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = designTokens.colors.semantic.success[400];
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, r, 0, Math.PI * 2);
  ctx.fill();
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
  ctx.strokeStyle = designTokens.colors.cta[500];
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

  const pivotX = box.x + box.w / 2;
  const pivotY = box.y + box.h * 0.55;
  const beamHalf = box.w * 0.32;
  const panW = box.w * 0.26;
  const panH = box.h * 0.16;

  ctx.save();
  // Trụ
  ctx.strokeStyle = designTokens.colors.surface[600];
  ctx.lineWidth = WALL_LINE_PX;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(pivotX, box.y + box.h);
  ctx.stroke();

  // Đòn cân
  const dx = Math.cos(rad) * beamHalf;
  const dy = Math.sin(rad) * beamHalf;
  ctx.beginPath();
  ctx.moveTo(pivotX - dx, pivotY + dy);
  ctx.lineTo(pivotX + dx, pivotY - dy);
  ctx.stroke();
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
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.strokeStyle = designTokens.colors.surface[500];
  ctx.lineWidth = BOARD_LINE_PX;
  ctx.beginPath();
  ctx.moveTo(pan.x, pan.y);
  ctx.lineTo(pan.x + pan.w, pan.y);
  ctx.lineTo(pan.x + pan.w * 0.82, pan.y + pan.h);
  ctx.lineTo(pan.x + pan.w * 0.18, pan.y + pan.h);
  ctx.closePath();
  ctx.fill();
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
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.strokeStyle = designTokens.colors.surface[700];
  ctx.lineWidth = WALL_LINE_PX;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 12 vạch giờ + số
  ctx.fillStyle = designTokens.colors.surface[700];
  ctx.font = `${Math.floor(r * 0.18)}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let h = 1; h <= 12; h++) {
    const a = ((h * 30 - 90) * Math.PI) / 180;
    ctx.fillText(
      String(h),
      cx + Math.cos(a) * r * 0.8,
      cy + Math.sin(a) * r * 0.8
    );
  }

  const angles = timeToAngles(time);
  drawHand(ctx, cx, cy, angles.hourAngleDeg, r * 0.5, WALL_LINE_PX);
  drawHand(ctx, cx, cy, angles.minuteAngleDeg, r * 0.78, BOARD_LINE_PX + 1);

  ctx.fillStyle = designTokens.colors.cta[500];
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(4, r * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
  width: number
): void {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  ctx.save();
  ctx.strokeStyle = designTokens.colors.surface[800];
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * length, cy + Math.sin(a) * length);
  ctx.stroke();
  ctx.restore();
}

// ── Khối lập phương đẳng cự (GT-017) ────────────────────────────────

export function drawIsometricModel(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  model: readonly CubeCoord[],
  rotation: RotationAngle
): void {
  if (model.length === 0) {
    return;
  }
  const rotated = rotateModelZ(model, rotation);
  const ordered = sortCubesForRender(rotated);
  const size = Math.min(box.w, box.h) / 6;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h * 0.62;

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
  ctx.lineWidth = 2;
  ctx.strokeStyle = designTokens.colors.surface[700];

  // Mặt trên
  ctx.fillStyle = designTokens.colors.brand[200];
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mặt trái
  ctx.fillStyle = designTokens.colors.brand[400];
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x, y + hh + s);
  ctx.lineTo(x - hw, y + s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mặt phải
  ctx.fillStyle = designTokens.colors.brand[600];
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
  axis: "vertical" | "horizontal"
): void {
  ctx.save();
  ctx.strokeStyle = designTokens.colors.cta[400];
  ctx.lineWidth = BOARD_LINE_PX;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  if (axis === "vertical") {
    ctx.moveTo(rs.LOGIC_WIDTH / 2, 0);
    ctx.lineTo(rs.LOGIC_WIDTH / 2, rs.LOGIC_HEIGHT);
  } else {
    ctx.moveTo(0, rs.LOGIC_HEIGHT / 2);
    ctx.lineTo(rs.LOGIC_WIDTH, rs.LOGIC_HEIGHT / 2);
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
  const ordered = [...waypoints].sort((a, b) => a.order - b.order);

  ctx.save();
  // Đường dẫn mờ — nét đứt là lời mời đồ theo
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

  // Phần đã đồ xong — nét liền
  if (reachedCount > 1) {
    ctx.setLineDash([]);
    ctx.strokeStyle = designTokens.colors.brand[500];
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

  ordered.forEach((w, i) => {
    const done = i < reachedCount;
    ctx.save();
    ctx.fillStyle = done
      ? designTokens.colors.semantic.success[400]
      : designTokens.colors.surface[0];
    ctx.strokeStyle = done
      ? designTokens.colors.semantic.success[600]
      : designTokens.colors.surface[500];
    ctx.lineWidth = BOARD_LINE_PX;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = done
      ? designTokens.colors.surface[0]
      : designTokens.colors.surface[700];
    ctx.font = `13px ${designTokens.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), w.x, w.y);
    ctx.restore();
  });
}

// ── Vật thể đặt theo toạ độ của content (GT-022, GT-023, GT-025) ────

/**
 * Toạ độ trong `content_pack` là **dữ liệu**, không phải hằng số trong mã:
 * hợp đồng khai `x`/`y` trong khoảng khung logic. Hàm này ánh xạ chúng vào một
 * hộp con để cảnh chia đôi (GT-025) hay thu nhỏ vẫn giữ đúng bố cục tương đối.
 */
export interface PositionedObject {
  readonly id: string;
  readonly asset?: RenderAsset | null;
  readonly x?: number;
  readonly y?: number;
}

const SCENE_ITEM_PX = 72;

export function slotAtPoint(x: number, y: number, size = SCENE_ITEM_PX): Slot {
  return {
    index: 0,
    x,
    y,
    w: size,
    h: size,
    hitW: size,
    hitH: size,
    page: 0,
    role: "target",
  };
}

export function drawSceneObjectAt(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: SceneBox,
  obj: PositionedObject,
  fallback: Slot | undefined,
  opts: { found?: boolean } = {}
): void {
  const slot =
    obj.x === undefined || obj.y === undefined
      ? fallback
      : slotAtPoint(
          box.x + (obj.x / rs.LOGIC_WIDTH) * box.w,
          box.y + (obj.y / rs.LOGIC_HEIGHT) * box.h
        );
  if (!slot) {
    return;
  }
  drawSlotItem(ctx, rs, slot, {
    id: obj.id,
    asset: obj.asset,
    state: opts.found ? "correct" : "idle",
  });
}

/** Vật đang nằm trên một đĩa cân — cỡ nhỏ, xếp đều theo bề ngang đĩa. */
export function drawPanItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  pan: SceneBox,
  items: readonly PositionedObject[]
): void {
  if (items.length === 0) {
    return;
  }
  const size = Math.min(pan.w / items.length, pan.h) * 0.9;
  const startX = pan.x + (pan.w - size * items.length) / 2 + size / 2;
  items.forEach((item, i) => {
    const slot = slotAtPoint(startX + i * size, pan.y - size / 2, size);
    drawSlotItem(ctx, rs, slot, { id: item.id, asset: item.asset });
  });
}
