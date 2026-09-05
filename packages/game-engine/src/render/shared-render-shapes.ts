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
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import {
  drawSlotItem,
  type RenderAsset,
  resolveEmojiGlyph,
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
  // Warm wooden board base with rounded corners
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
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
  ctx.shadowColor = "rgba(130, 118, 96, 0.14)";
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
  ctx.shadowColor = "rgba(130, 118, 96, 0.18)";
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

export function drawIsometricModel(
  ctx: CanvasRenderingContext2D,
  box: SceneBox,
  model: readonly CubeCoord[],
  rotation: RotationAngle
): void {
  if (model.length === 0) {
    return;
  }
  const ordered = sortCubesForRender(model, rotation);
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
  axis: "vertical" | "horizontal"
): void {
  ctx.save();
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = BOARD_LINE_PX + 1;
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
  const ordered = waypoints;

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
    ctx.arc(w.x, w.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = done
      ? designTokens.colors.surface[0]
      : designTokens.colors.surface[900];
    ctx.font = `bold 14px ${designTokens.fonts.heading}`;
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

// ── Đĩa gỗ tròn & Đĩa đậy nắp Cloche (GT-002, GT-012) ────────────────
export function drawWoodenPlate(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isSelected = false
): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const cx = slot.x;
  const cy = slot.y;

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = isSelected
    ? "rgba(255, 191, 0, 0.45)"
    : "rgba(130, 118, 96, 0.22)";
  ctx.shadowBlur = isSelected ? 18 : 10;
  ctx.shadowOffsetY = isSelected ? 8 : 4;
  ctx.fillStyle = isSelected
    ? designTokens.colors.montessori.amber
    : designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.arc(cx, cy + (isSelected ? -4 : 0), r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Slab
  ctx.save();
  ctx.translate(0, 5);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Plate Rim (Warm Oak Wood)
  const gen = getContextGeneration(ctx);
  let plateGrad = getCachedGradient(
    ctx,
    gen,
    PRIMITIVE_GRADIENTS.PLATE_RIM,
    slot.index
  );
  if (!plateGrad) {
    plateGrad = ctx.createRadialGradient(
      cx - r * 0.3,
      cy - r * 0.3,
      r * 0.1,
      cx,
      cy,
      r
    );
    plateGrad.addColorStop(0, "#fff8ee");
    plateGrad.addColorStop(0.7, "#f5edd8");
    plateGrad.addColorStop(1, "#e6d7b8");
    setCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PLATE_RIM,
      slot.index,
      plateGrad
    );
  }
  ctx.fillStyle = plateGrad;
  ctx.strokeStyle = isSelected
    ? designTokens.colors.montessori.amber
    : designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = isSelected ? 4 : 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Inner Indented Recess
  const innerR = r * 0.75;
  let innerGrad = getCachedGradient(
    ctx,
    gen,
    PRIMITIVE_GRADIENTS.PLATE_INNER,
    slot.index
  );
  if (!innerGrad) {
    innerGrad = ctx.createRadialGradient(cx, cy, innerR * 0.2, cx, cy, innerR);
    innerGrad.addColorStop(0, "#efe5cc");
    innerGrad.addColorStop(1, "#dfd3b4");
    setCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PLATE_INNER,
      slot.index,
      innerGrad
    );
  }
  ctx.fillStyle = innerGrad;
  ctx.strokeStyle = "rgba(130, 118, 96, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Specular highlight curve
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.restore();
}

/** Đĩa nắp bạc Cloche hé mở cho GT-012 */
export function drawClocheScene(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isRevealed: boolean
): void {
  const cx = slot.x;
  const cy = slot.y;
  const r = Math.min(slot.w, slot.h) / 2;

  // Vẽ đĩa gỗ bên dưới
  drawWoodenPlate(ctx, slot, false);

  if (!isRevealed) {
    // Nắp bạc đậy kín
    ctx.save();
    const clocheR = r * 0.78;
    const gen = getContextGeneration(ctx);
    let clocheGrad = getCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PLATE_CLOCHE,
      slot.index
    );
    if (!clocheGrad) {
      clocheGrad = ctx.createRadialGradient(
        cx - clocheR * 0.3,
        cy - clocheR * 0.4,
        clocheR * 0.1,
        cx,
        cy,
        clocheR
      );
      clocheGrad.addColorStop(0, "#ffffff");
      clocheGrad.addColorStop(0.5, "#dcdfe4");
      clocheGrad.addColorStop(1, "#9aa0a6");
      setCachedGradient(
        ctx,
        gen,
        PRIMITIVE_GRADIENTS.PLATE_CLOCHE,
        slot.index,
        clocheGrad
      );
    }
    ctx.fillStyle = clocheGrad;
    ctx.strokeStyle = "#80868b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, clocheR, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tay nắm nắp (Knob)
    ctx.fillStyle = designTokens.colors.montessori.amber;
    ctx.strokeStyle = designTokens.colors.montessori.amberDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - clocheR - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Khung 10 Montessori Ten-Frame (GT-007) ───────────────────────────
export function drawTenFrameBoard(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): readonly Slot[] {
  const slots: Slot[] = [];
  const rows = 2;
  const cols = 5;
  const padX = box.w * 0.06;
  const padY = box.h * 0.12;
  const cellW = (box.w - padX * 2) / cols;
  const cellH = (box.h - padY * 2) / rows;
  const slotR = Math.min(cellW, cellH) * 0.38;

  ctx.save();
  // Khay gỗ sồi bao quanh
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 10 ô lõm tròn
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = box.x + padX + c * cellW + cellW / 2;
      const cy = box.y + padY + r * cellH + cellH / 2;
      const index = r * cols + c;

      // Hốc tròn lõm
      ctx.fillStyle = "#ebd9be";
      ctx.strokeStyle = "rgba(130, 118, 96, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, slotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      slots.push({
        index,
        x: cx,
        y: cy,
        w: slotR * 2,
        h: slotR * 2,
        hitW: slotR * 2,
        hitH: slotR * 2,
        page: 0,
        role: "target",
      });
    }
  }

  // Đường phân cách giữa cột 5
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(box.x + padX, box.y + box.h / 2);
  ctx.lineTo(box.x + box.w - padX, box.y + box.h / 2);
  ctx.stroke();

  ctx.restore();
  return slots;
}

// ── Khay thả hình học Montessori (GT-008) ────────────────────────────
export function drawShapeTray(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const padX = 22;
  const padY = 16;
  const trayX = box.x - padX;
  const trayY = box.y - padY;
  const trayW = box.w + padX * 2;
  const trayH = box.h + padY * 2;
  const radius = 24;

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(trayX, trayY, trayW, trayH, radius);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Rim
  ctx.save();
  ctx.translate(0, 4);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(trayX, trayY, trayW, trayH, radius);
  ctx.fill();
  ctx.restore();

  // 3. Main Tray Inset Body
  ctx.fillStyle = designTokens.colors.surface[50];
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(trayX, trayY, trayW, trayH, radius);
  ctx.fill();
  ctx.stroke();

  // 4. Subtle Top Highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(trayX + radius, trayY + 4);
  ctx.lineTo(trayX + trayW - radius, trayY + 4);
  ctx.stroke();

  ctx.restore();
}

// ── Đoàn tàu & Đường ray gỗ (GT-006) ─────────────────────────────────
export function drawTrainRailway(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const y = box.y + box.h * 0.75;
  const left = box.x + 20;
  const right = box.x + box.w - 20;

  ctx.save();
  // Ray gỗ (Thanh tà vẹt)
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(left, y - 8);
  ctx.lineTo(right, y - 8);
  ctx.moveTo(left, y + 8);
  ctx.lineTo(right, y + 8);
  ctx.stroke();

  // Tà vẹt ngang
  ctx.lineWidth = 4;
  for (let x = left; x <= right; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y + 16);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLocomotive(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  // Thân đầu tàu gỗ
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
  ctx.fill();
  ctx.stroke();

  // Ống khói
  ctx.fillStyle = designTokens.colors.montessori.coral;
  ctx.fillRect(x + w * 0.2, y - h * 0.85, w * 0.2, h * 0.4);

  // Khói trắng
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y - h * 0.95, 8, 0, Math.PI * 2);
  ctx.arc(x + w * 0.38, y - h * 1.15, 12, 0, Math.PI * 2);
  ctx.fill();

  // Bánh xe
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.arc(x - w * 0.25, y + h * 0.5, 10, 0, Math.PI * 2);
  ctx.arc(x + w * 0.25, y + h * 0.5, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Bảng phương trình & thay thế biểu tượng (GT-010) ─────────────────
export function drawEquationTray(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  ctx.save();
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.16)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

// ── Bướm đối xứng Montessori (GT-021) ────────────────────────────────
export function drawButterflyWingsBoard(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const w = box.w * 0.85;
  const h = box.h * 0.82;

  ctx.save();
  // Cánh bướm gỗ cắt hình đối xứng
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.18)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  // Cánh trái
  ctx.ellipse(
    cx - w * 0.24,
    cy - h * 0.18,
    w * 0.22,
    h * 0.28,
    -0.2,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    cx - w * 0.22,
    cy + h * 0.22,
    w * 0.18,
    h * 0.22,
    0.3,
    0,
    Math.PI * 2
  );
  // Cánh phải
  ctx.ellipse(
    cx + w * 0.24,
    cy - h * 0.18,
    w * 0.22,
    h * 0.28,
    0.2,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    cx + w * 0.22,
    cy + h * 0.22,
    w * 0.18,
    h * 0.22,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Thân bướm gỗ sồi đậm
  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.beginPath();
  ctx.roundRect(cx - 10, cy - h * 0.45, 20, h * 0.9, 10);
  ctx.fill();

  // Trục gương nét đứt ở giữa
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(cx, box.y + 10);
  ctx.lineTo(cx, box.y + box.h - 10);
  ctx.stroke();

  ctx.restore();
}

// ── Máy hát loa kèn phát âm thanh (GT-018) ───────────────────────────
export function drawGramophone(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isPlaying: boolean
): void {
  const cx = slot.x;
  const cy = slot.y;
  const r = Math.min(slot.w, slot.h) / 2;

  ctx.save();
  // Đế gỗ cổ điển
  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.45, cy + r * 0.1, r * 0.9, r * 0.4, 8);
  ctx.fill();
  ctx.stroke();

  // Loa kèn đồng thau Honey Amber
  const gen = getContextGeneration(ctx);
  let hornGrad = getCachedGradient(
    ctx,
    gen,
    PRIMITIVE_GRADIENTS.PARTY_HORN,
    slot.index
  );
  if (!hornGrad) {
    hornGrad = ctx.createRadialGradient(
      cx + r * 0.2,
      cy - r * 0.3,
      r * 0.1,
      cx,
      cy,
      r * 0.7
    );
    hornGrad.addColorStop(0, "#fff5cc");
    hornGrad.addColorStop(0.5, "#ffbf00");
    hornGrad.addColorStop(1, "#b38600");
    setCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PARTY_HORN,
      slot.index,
      hornGrad
    );
  }
  ctx.fillStyle = hornGrad;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy + r * 0.1);
  ctx.lineTo(cx - r * 0.2, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vành miệng loa
  ctx.beginPath();
  ctx.ellipse(
    cx + r * 0.48,
    cy - r * 0.32,
    r * 0.12,
    r * 0.25,
    0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Nốt nhạc bay ra khi đang phát âm
  if (isPlaying) {
    ctx.font = '22px "Noto Color Emoji", sans-serif';
    ctx.fillText("🎵", cx + r * 0.65, cy - r * 0.6);
    ctx.fillText("🎶", cx + r * 0.8, cy - r * 0.3);
  }
  ctx.restore();
}

// ── Bục nấm / Target Go-NoGo (GT-026) ────────────────────────────────
export function drawPedestalTarget(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  const cx = slot.x;
  const cy = slot.y + slot.h * 0.25;
  const r = slot.w * 0.42;

  ctx.save();
  // Bục gỗ tròn
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.2)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// ── Rổ đựng hoa quả (GT-004) ─────────────────────────────────────────
export function drawBasketSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  label: string,
  rimColor: string
): void {
  const cx = slot.x;
  const cy = slot.y;
  const w = slot.w * 0.9;
  const h = slot.h * 0.75;

  ctx.save();
  // Thân rổ gỗ
  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.18)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#faebd7";
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 16);
  ctx.fill();
  ctx.restore();

  // Viền nơ màu sắc (Đỏ hoặc Vàng)
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 16);
  ctx.stroke();

  // Dải ruy băng nhãn
  ctx.fillStyle = rimColor;
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.35, cy - h * 0.55, w * 0.7, 28, 14);
  ctx.fill();

  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.font = `bold 15px ${designTokens.fonts.heading}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy - h * 0.55 + 14);
  ctx.restore();
}

function drawNestBase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  isHovered: boolean
): void {
  ctx.fillStyle = isHovered
    ? "rgba(255, 191, 0, 0.45)"
    : "rgba(255, 223, 160, 0.35)";
  ctx.beginPath();
  ctx.arc(cx, cy, r * (isHovered ? 1.45 : 1.25), 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = "rgba(130, 118, 96, 0.22)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#f5ede0";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = isHovered
    ? designTokens.colors.montessori.amber
    : designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = isHovered ? 5 : 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ebd9be";
  ctx.beginPath();
  ctx.arc(cx, cy + 4, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(180, 140, 80, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 6, r * 0.55, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawNestPlacedItems(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  placedItems: readonly {
    item_id: string;
    asset: { kind: string; ref?: string; path?: string };
  }[]
): void {
  if (placedItems.length === 0) {
    ctx.font = '36px "Noto Color Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🪹", cx, cy);
    return;
  }

  const count = placedItems.length;
  const spacing = Math.min(36, r * 0.7);
  const startX = cx - ((count - 1) * spacing) / 2;

  for (let i = 0; i < count; i++) {
    const item = placedItems[i];
    if (!item) {
      continue;
    }
    const chickX = startX + i * spacing;
    const chickY = cy - 2;

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(chickX, chickY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '32px "Noto Color Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glyph =
      (item.asset.ref ? resolveEmojiGlyph(item.asset.ref) : "") || "🐥";
    ctx.fillText(glyph, chickX, chickY);
    ctx.restore();
  }
}

function drawNestBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  label: string,
  placedCount: number,
  targetCount: number
): void {
  const pillW = Math.max(120, r * 1.4);
  const pillH = 26;
  const pillY = cy + r - 10;
  const isComplete = placedCount >= targetCount;

  ctx.save();
  ctx.fillStyle = isComplete
    ? designTokens.colors.semantic.success[500]
    : designTokens.colors.surface[0];
  ctx.strokeStyle = isComplete
    ? designTokens.colors.semantic.success[600]
    : designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - pillW / 2, pillY, pillW, pillH, 13);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isComplete ? "#ffffff" : designTokens.colors.surface[800];
  ctx.font = `bold 13px ${designTokens.fonts.heading}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${label} (${placedCount}/${targetCount})`,
    cx,
    pillY + pillH / 2
  );
  ctx.restore();
}

// ── Tổ chim / Chuồng gà (GT-003) ────────────────────────────────────────────────
export function drawNestTarget(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  options?: {
    label?: string;
    placedItems?: readonly {
      item_id: string;
      asset: { kind: string; ref?: string; path?: string };
    }[];
    targetCount?: number;
    isHovered?: boolean;
  }
): void {
  const cx = slot.x;
  const cy = slot.y;
  const r = Math.min(slot.w, slot.h) * 0.44;
  const isHovered = options?.isHovered ?? false;
  const placedItems = options?.placedItems ?? [];
  const targetCount = options?.targetCount ?? 2;
  const label = options?.label ?? "Chuồng gà";

  ctx.save();
  drawNestBase(ctx, cx, cy, r, isHovered);
  drawNestPlacedItems(ctx, cx, cy, r, placedItems);
  drawNestBadge(ctx, cx, cy, r, label, placedItems.length, targetCount);
  ctx.restore();
}
