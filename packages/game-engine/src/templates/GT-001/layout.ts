import { type LogicSpace, SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  getCentralTargetCardSlot,
  getWoodenTokenDockRect,
} from "#src/render/index.js";
import type { Particle } from "#src/systems/render-system";

const LEGACY_OPTION_GAP_PX = 24;
const MAX_SINGLE_ROW_SLOT_PX = 104;
const MAX_MULTI_ROW_SLOT_PX = 96;
const MIN_DRAW_DIAMETER_PX = 48;
const MAX_TARGET_CARD_PX = 180;
const MAX_STORYBOOK_W_PX = 348;
const BOOK_SPREAD_ASPECT = 1.82;
const BOOK_SLAB_DEPTH_PX = 4;
const SINGLE_ROW_MIN_CARD_PX = 100;
const MULTI_ROW_MIN_CARD_PX = 56;
const FRAME_MS_60FPS = 16.667;
const PARTICLE_GRAVITY_STEP = 0.05;
const PARTICLE_LIFE_DECAY_STEP = 0.02;

export interface GT001StageLayout {
  readonly cardSlot: Slot;
  readonly bookRect: ZoneRect;
  readonly isSpread: boolean;
  readonly leftPageSlot: Slot;
  readonly rightPageSlot: Slot;
  readonly dockRect: ZoneRect;
  readonly optionSlots: readonly Slot[];
}

function toEvenFloor(value: number, minEven: number): number {
  const floored = Math.floor(value / 2) * 2;
  return Math.max(minEven, floored);
}

function createOptionSlot(
  index: number,
  centerX: number,
  centerY: number,
  drawDiameter: number,
  hitDiameter: number
): Slot {
  return {
    index,
    x: Math.round(centerX),
    y: Math.round(centerY),
    w: drawDiameter,
    h: drawDiameter,
    hitW: hitDiameter,
    hitH: hitDiameter,
    page: 0,
    role: "source",
  };
}

function buildStorybookGeometry(
  centerX: number,
  bookTop: number,
  rawBookHeight: number,
  maxAllowedWidth: number
): Pick<
  GT001StageLayout,
  "cardSlot" | "bookRect" | "isSpread" | "leftPageSlot" | "rightPageSlot"
> {
  const bookH = toEvenFloor(rawBookHeight, 36);
  const cappedMaxW = Math.min(
    MAX_STORYBOOK_W_PX,
    Math.max(bookH, maxAllowedWidth)
  );
  const desiredW = Math.round(bookH * BOOK_SPREAD_ASPECT);
  const bookW = toEvenFloor(
    Math.min(cappedMaxW, Math.max(bookH, desiredW)),
    36
  );
  const bookX = Math.round(centerX - bookW / 2);
  const bookY = Math.round(bookTop);
  const isSpread = bookW >= Math.round(bookH * 1.42) && bookH >= 52;

  const bodyH = Math.max(24, bookH - BOOK_SLAB_DEPTH_PX);
  const padX = Math.max(8, Math.round(bookW * 0.05));
  const padY = Math.max(6, Math.round(bodyH * 0.11));
  const innerH = Math.max(20, bodyH - padY * 2);
  const centerBodyY = Math.round(bookY + bodyH / 2);

  let leftPageSlot: Slot;
  let rightPageSlot: Slot;
  if (isSpread) {
    const spineGap = 12;
    const halfW = Math.max(20, Math.floor((bookW - padX * 2 - spineGap) / 2));
    const pageSize = toEvenFloor(Math.min(innerH, halfW), 20);
    const leftCenterX = Math.round(bookX + padX + halfW / 2);
    const rightCenterX = Math.round(bookX + bookW - padX - halfW / 2);
    leftPageSlot = {
      index: -1,
      x: leftCenterX,
      y: centerBodyY,
      w: pageSize,
      h: pageSize,
      hitW: halfW,
      hitH: innerH,
      page: 0,
      role: "neutral",
    };
    rightPageSlot = {
      index: -2,
      x: rightCenterX,
      y: centerBodyY,
      w: pageSize,
      h: pageSize,
      hitW: halfW,
      hitH: innerH,
      page: 0,
      role: "neutral",
    };
  } else {
    const singleSize = toEvenFloor(Math.min(innerH, bookW - padX * 2), 20);
    const singleSlot: Slot = {
      index: -1,
      x: Math.round(bookX + bookW / 2),
      y: centerBodyY,
      w: singleSize,
      h: singleSize,
      hitW: bookW,
      hitH: bookH,
      page: 0,
      role: "neutral",
    };
    leftPageSlot = singleSlot;
    rightPageSlot = singleSlot;
  }

  const cardSlot: Slot = {
    index: 0,
    x: bookX + bookW / 2,
    y: bookY + bookH / 2,
    w: bookW,
    h: bookH,
    hitW: bookW,
    hitH: bookH,
    page: 0,
    role: "target",
  };

  return {
    cardSlot,
    bookRect: { x: bookX, y: bookY, w: bookW, h: bookH },
    isSpread,
    leftPageSlot,
    rightPageSlot,
  };
}

function resolveBalancedColumnCount(
  optionCount: number,
  maxColumns: number
): number {
  if (optionCount <= maxColumns) {
    return optionCount;
  }
  if (optionCount === 4 && maxColumns >= 2) {
    return 2;
  }
  if (optionCount > 4 && maxColumns >= 3) {
    return 3;
  }
  return Math.min(optionCount, maxColumns);
}

function resolveVerticalPlacement(
  stageRect: ZoneRect,
  rowCount: number,
  hitDiameter: number,
  gridHeight: number
): { cardSize: number; cardTop: number; gridTop: number } {
  const minCardHeight =
    rowCount === 1 ? SINGLE_ROW_MIN_CARD_PX : MULTI_ROW_MIN_CARD_PX;
  const zoneGap = rowCount === 1 ? 16 : 8;
  if (rowCount === 1 && stageRect.h < hitDiameter) {
    const gridTop = stageRect.y + stageRect.h - hitDiameter;
    const cardSize = Math.max(
      SINGLE_ROW_MIN_CARD_PX,
      Math.max(0, gridTop - stageRect.y - 12)
    );
    return { cardSize, cardTop: stageRect.y + 6, gridTop };
  }
  if (minCardHeight + zoneGap + gridHeight <= stageRect.h) {
    const gridTop = stageRect.y + stageRect.h - gridHeight;
    const availableCardHeight = gridTop - stageRect.y - zoneGap;
    const cardSize = Math.round(
      Math.min(
        MAX_TARGET_CARD_PX,
        stageRect.w - 16,
        Math.max(minCardHeight, availableCardHeight - 8)
      )
    );
    const cardTop =
      stageRect.y +
      Math.max(0, Math.floor((availableCardHeight - cardSize) / 2));
    return { cardSize, cardTop, gridTop };
  }
  const fallbackGridTop = Math.max(
    stageRect.y + 42,
    stageRect.y + stageRect.h - gridHeight
  );
  const fallbackCardSize = Math.max(
    36,
    Math.min(MULTI_ROW_MIN_CARD_PX, fallbackGridTop - stageRect.y - 6)
  );
  return {
    cardSize: fallbackCardSize,
    cardTop: stageRect.y + 4,
    gridTop: fallbackGridTop,
  };
}

function computeLegacyStageLayout(
  logicSpace: LogicSpace,
  count: number,
  touchFloor: number
): GT001StageLayout {
  const safeCount = Math.max(1, count);
  const legacyCard = getCentralTargetCardSlot(logicSpace, undefined);
  const dockRect = getWoodenTokenDockRect(logicSpace, undefined);
  const bookGeom = buildStorybookGeometry(
    legacyCard.x,
    legacyCard.y - legacyCard.h / 2,
    legacyCard.h,
    logicSpace.w - 32
  );
  const rawWidth =
    (dockRect.w - (safeCount - 1) * LEGACY_OPTION_GAP_PX) / safeCount;
  const slotWidth = Math.max(
    touchFloor,
    Math.min(MAX_SINGLE_ROW_SLOT_PX, rawWidth)
  );
  const totalWidth =
    safeCount * slotWidth + (safeCount - 1) * LEGACY_OPTION_GAP_PX;
  const startX = dockRect.x + (dockRect.w - totalWidth) / 2;
  const drawDiameter = Math.round(slotWidth);
  const hitDiameter = Math.max(touchFloor, drawDiameter);
  const centerY = dockRect.y + dockRect.h / 2;
  const optionSlots = Array.from({ length: count }, (_, index) =>
    createOptionSlot(
      index,
      startX + index * (slotWidth + LEGACY_OPTION_GAP_PX) + slotWidth / 2,
      centerY,
      drawDiameter,
      hitDiameter
    )
  );
  return { ...bookGeom, dockRect, optionSlots };
}

export function computeGT001StageLayout(
  logicSpace: LogicSpace,
  stageRect: ZoneRect | undefined,
  count: number,
  touchFloor: number
): GT001StageLayout {
  if (!stageRect) {
    return computeLegacyStageLayout(logicSpace, count, touchFloor);
  }
  const safeCount = Math.max(1, count);
  const maxColumns = Math.max(
    1,
    Math.floor((stageRect.w - 16 + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX))
  );
  const columnCount = resolveBalancedColumnCount(safeCount, maxColumns);
  const rowCount = Math.ceil(safeCount / Math.max(1, columnCount));
  let columnGap = rowCount === 1 && safeCount <= 3 ? 20 : SLOT_GAP_PX;
  const rowGap = rowCount === 1 ? 0 : SLOT_GAP_PX;
  const horizontalPadding = rowCount === 1 ? 24 : 16;
  const maxHitByWidth = Math.floor(
    (stageRect.w - horizontalPadding - (columnCount - 1) * columnGap) /
      columnCount
  );
  const maxHitByHeight =
    rowCount === 1
      ? MAX_SINGLE_ROW_SLOT_PX
      : Math.min(
          MAX_MULTI_ROW_SLOT_PX,
          Math.floor((stageRect.h * 0.62 - (rowCount - 1) * rowGap) / rowCount)
        );
  const maxAllowedDiameter =
    rowCount === 1 ? MAX_SINGLE_ROW_SLOT_PX : MAX_MULTI_ROW_SLOT_PX;
  const hitDiameter = Math.max(
    touchFloor,
    Math.min(maxAllowedDiameter, maxHitByWidth, maxHitByHeight)
  );
  if (
    columnCount > 1 &&
    columnCount * hitDiameter + (columnCount - 1) * columnGap > stageRect.w
  ) {
    columnGap = Math.max(
      SLOT_GAP_PX,
      Math.floor((stageRect.w - columnCount * hitDiameter) / (columnCount - 1))
    );
  }
  const drawDiameter = Math.max(
    MIN_DRAW_DIAMETER_PX,
    hitDiameter - (rowCount >= 2 ? 8 : 4)
  );
  const gridHeight = rowCount * hitDiameter + (rowCount - 1) * rowGap;
  const { cardSize, cardTop, gridTop } = resolveVerticalPlacement(
    stageRect,
    rowCount,
    hitDiameter,
    gridHeight
  );
  const bookGeom = buildStorybookGeometry(
    stageRect.x + stageRect.w / 2,
    cardTop,
    cardSize,
    Math.max(48, stageRect.w - 16)
  );
  const optionSlots = Array.from({ length: count }, (_, index) => {
    const rowIndex = Math.floor(index / columnCount);
    const columnIndex = index % columnCount;
    const itemsInRow = Math.min(columnCount, count - rowIndex * columnCount);
    const rowWidth = itemsInRow * hitDiameter + (itemsInRow - 1) * columnGap;
    const rowStartX = stageRect.x + (stageRect.w - rowWidth) / 2;
    return createOptionSlot(
      index,
      rowStartX + columnIndex * (hitDiameter + columnGap) + hitDiameter / 2,
      gridTop + rowIndex * (hitDiameter + rowGap) + hitDiameter / 2,
      drawDiameter,
      hitDiameter
    );
  });
  const gridSpanWidth =
    columnCount * hitDiameter + (columnCount - 1) * columnGap;
  const dockWidth = Math.min(
    stageRect.w,
    Math.max(Math.round(stageRect.w * 0.9), gridSpanWidth)
  );
  const dockTop = Math.max(stageRect.y, gridTop);
  const dockBottom = Math.min(stageRect.y + stageRect.h, gridTop + gridHeight);
  return {
    ...bookGeom,
    dockRect: {
      x: Math.round(stageRect.x + (stageRect.w - dockWidth) / 2),
      y: Math.round(dockTop),
      w: Math.round(dockWidth),
      h: Math.max(24, Math.round(dockBottom - dockTop)),
    },
    optionSlots,
  };
}

export function stepParticlesByDelta(
  particles: readonly Particle[],
  deltaMs: number
): Particle[] {
  if (particles.length === 0 || deltaMs <= 0) {
    return [...particles];
  }
  const stepRatio = deltaMs / FRAME_MS_60FPS;
  const updatedParticles: Particle[] = [];
  for (const particle of particles) {
    const nextLife = particle.life - PARTICLE_LIFE_DECAY_STEP * stepRatio;
    if (nextLife > 0) {
      updatedParticles.push({
        ...particle,
        x: particle.x + particle.vx * stepRatio,
        y: particle.y + particle.vy * stepRatio,
        vy: particle.vy + PARTICLE_GRAVITY_STEP * stepRatio,
        life: nextLife,
      });
    }
  }
  return updatedParticles;
}
