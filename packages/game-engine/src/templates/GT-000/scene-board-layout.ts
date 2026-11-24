import type { AgeBand } from "#src/contracts/types";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  type BookSpreadLayout,
  computeResponsiveBookSpread,
} from "#src/render/storybook-frame.js";
import {
  type GT000SceneBoard,
  resolveStepSceneBoard,
} from "./scene-board-schema.js";
import { type GT000Step, getStepItemCount } from "./template.js";

const MAX_CHOICE_DIAMETER_PX = 108;
const MIN_DRAW_DIAMETER_PX = 52;
const MAX_CARD_W_PX = 340;
const MAX_CARD_H_PX = 276;

export interface GT000ComputedStepLayout {
  readonly stage: ZoneRect;
  readonly spread: BookSpreadLayout;
  readonly board: GT000SceneBoard;
  readonly hasTwoPages: boolean;
  readonly showcaseZone: ZoneRect | null;
  readonly interactiveZone: ZoneRect;
  readonly slots: readonly Slot[];
}

export function resolveFallbackStageRect(
  logic: LogicSpace,
  stageRect?: ZoneRect
): ZoneRect {
  if (stageRect && stageRect.w > 0 && stageRect.h > 0) {
    return stageRect;
  }
  const marginX = 16;
  const marginY = 16;
  return {
    x: marginX,
    y: marginY,
    w: Math.max(120, logic.w - marginX * 2),
    h: Math.max(120, logic.h - marginY * 2),
  };
}

function fullBookContentZone(spread: BookSpreadLayout): ZoneRect {
  const top = spread.leftOrTopPage.y;
  const bottom = spread.rightOrBottomPage.y + spread.rightOrBottomPage.h;
  return {
    x: spread.innerRect.x + 6,
    y: top,
    w: Math.max(32, spread.innerRect.w - 12),
    h: Math.max(32, bottom - top),
  };
}

function clampCenterToStage(
  cx: number,
  cy: number,
  hitW: number,
  hitH: number,
  stage: ZoneRect
): { readonly x: number; readonly y: number } {
  const minX = stage.x + hitW / 2 + 1;
  const maxX = stage.x + stage.w - hitW / 2 - 1;
  const minY = stage.y + hitH / 2 + 1;
  const maxY = stage.y + stage.h - hitH / 2 - 1;
  return {
    x: Math.round(
      minX <= maxX ? Math.min(maxX, Math.max(minX, cx)) : stage.x + stage.w / 2
    ),
    y: Math.round(
      minY <= maxY ? Math.min(maxY, Math.max(minY, cy)) : stage.y + stage.h / 2
    ),
  };
}

interface ChoiceGridSpec {
  readonly cols: number;
  readonly rows: number;
  readonly hitSize: number;
  readonly colGap: number;
  readonly rowGap: number;
  readonly fitsAtFloor: boolean;
}

function pickChoiceGrid(
  zone: ZoneRect,
  count: number,
  touchFloor: number
): ChoiceGridSpec {
  const safeCount = Math.max(1, count);
  const candidates: number[] = [];
  if (safeCount === 4) {
    candidates.push(2, 4, 1);
  } else if (safeCount === 3) {
    candidates.push(3, 2, 1);
  } else if (safeCount === 2) {
    candidates.push(2, 1);
  } else {
    candidates.push(safeCount);
  }

  for (const cols of candidates) {
    const rows = Math.ceil(safeCount / cols);
    const reqW = cols * touchFloor + (cols - 1) * SLOT_GAP_PX;
    const reqH = rows * touchFloor + (rows - 1) * SLOT_GAP_PX;
    if (reqW <= zone.w && reqH <= zone.h) {
      const maxByW = Math.floor((zone.w - (cols - 1) * SLOT_GAP_PX) / cols);
      const maxByH = Math.floor((zone.h - (rows - 1) * SLOT_GAP_PX) / rows);
      const hitSize = Math.max(
        touchFloor,
        Math.min(MAX_CHOICE_DIAMETER_PX, maxByW, maxByH)
      );
      const extraColSpace = zone.w - cols * hitSize;
      const colGap =
        cols > 1
          ? Math.min(
              32,
              Math.max(SLOT_GAP_PX, Math.floor(extraColSpace / cols))
            )
          : 0;
      const rowGap = rows > 1 ? SLOT_GAP_PX : 0;
      return { cols, rows, hitSize, colGap, rowGap, fitsAtFloor: true };
    }
  }

  const fallbackCols = zone.w >= zone.h ? safeCount : Math.min(2, safeCount);
  const fallbackRows = Math.ceil(safeCount / fallbackCols);
  return {
    cols: fallbackCols,
    rows: fallbackRows,
    hitSize: touchFloor,
    colGap: fallbackCols > 1 ? SLOT_GAP_PX : 0,
    rowGap: fallbackRows > 1 ? SLOT_GAP_PX : 0,
    fitsAtFloor: false,
  };
}

function buildChoiceSlotsInZone(
  zone: ZoneRect,
  stage: ZoneRect,
  count: number,
  grid: ChoiceGridSpec
): Slot[] {
  const { cols, rows, hitSize, colGap, rowGap } = grid;
  const drawSize = Math.max(
    MIN_DRAW_DIAMETER_PX,
    Math.min(hitSize - 6, MAX_CHOICE_DIAMETER_PX - 4)
  );
  const totalH = rows * hitSize + (rows - 1) * rowGap;
  const startY = zone.y + (zone.h - totalH) / 2;
  const slots: Slot[] = [];

  for (let i = 0; i < count; i++) {
    const rIdx = Math.floor(i / cols);
    const cIdx = i % cols;
    const inRow = Math.min(cols, count - rIdx * cols);
    const rowW = inRow * hitSize + (inRow - 1) * colGap;
    const startX = zone.x + (zone.w - rowW) / 2;
    const rawCx = startX + cIdx * (hitSize + colGap) + hitSize / 2;
    const rawCy = startY + rIdx * (hitSize + rowGap) + hitSize / 2;
    const clamped = clampCenterToStage(rawCx, rawCy, hitSize, hitSize, stage);
    slots.push({
      index: i,
      x: clamped.x,
      y: clamped.y,
      w: drawSize,
      h: drawSize,
      hitW: hitSize,
      hitH: hitSize,
      page: 0,
      role: "source",
    });
  }
  return slots;
}

function buildSingleCardSlot(
  zone: ZoneRect,
  stage: ZoneRect,
  touchFloor: number
): Slot {
  const pad = 16;
  const maxW = Math.max(
    touchFloor,
    Math.min(MAX_CARD_W_PX, zone.w - pad, stage.w - 8)
  );
  const maxH = Math.max(
    touchFloor,
    Math.min(MAX_CARD_H_PX, zone.h - pad, stage.h - 8)
  );
  const w = Math.round(maxW);
  const h = Math.round(maxH);
  const hitW = Math.max(touchFloor, w);
  const hitH = Math.max(touchFloor, h);
  const clamped = clampCenterToStage(
    zone.x + zone.w / 2,
    zone.y + zone.h / 2,
    hitW,
    hitH,
    stage
  );
  return {
    index: 0,
    x: clamped.x,
    y: clamped.y,
    w,
    h,
    hitW,
    hitH,
    page: 0,
    role: "neutral",
  };
}

/**
 * Tính trọn bộ hình học Sách Giấy Dó + `slots` của một bước `GT-000`.
 * Thuần 100%, được cache vào `GT000StepCacheSnapshot` lúc mở bước / đổi kích thước
 * để `render()` 0 cấp phát mảng/object mỗi khung (`BR-ENG-15`).
 */
export function computeGT000StepLayout(
  step: GT000Step | undefined,
  ageBand: AgeBand,
  logic: LogicSpace,
  cssPerLogic: number,
  stageRect?: ZoneRect
): GT000ComputedStepLayout {
  const stage = resolveFallbackStageRect(logic, stageRect);
  const board = resolveStepSceneBoard(step);
  const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);

  if (!step) {
    const spread = computeResponsiveBookSpread(stage, 0.5);
    const full = fullBookContentZone(spread);
    return {
      stage,
      spread,
      board,
      hasTwoPages: false,
      showcaseZone: null,
      interactiveZone: full,
      slots: [],
    };
  }

  const itemCount = getStepItemCount(step);
  const isCardStep = step.action === "present" || step.action === "echo";

  if (board.mode === "single_card") {
    const spread = computeResponsiveBookSpread(stage, 0.5);
    const full = fullBookContentZone(spread);
    if (isCardStep) {
      return {
        stage,
        spread,
        board,
        hasTwoPages: false,
        showcaseZone: null,
        interactiveZone: full,
        slots: [buildSingleCardSlot(full, stage, touchFloor)],
      };
    }
    const grid = pickChoiceGrid(full, itemCount, touchFloor);
    return {
      stage,
      spread,
      board,
      hasTwoPages: false,
      showcaseZone: null,
      interactiveZone: full,
      slots: buildChoiceSlotsInZone(full, stage, itemCount, grid),
    };
  }

  // 8 chế độ Sách 2 Trang (Trang Trái/Trên = Giáo cụ trực quan, Trang Phải/Dưới = Thẻ mục tiêu / Lựa chọn)
  const shareGuess = isCardStep ? 0.48 : 0.58;
  let spread = computeResponsiveBookSpread(stage, shareGuess);

  if (isCardStep) {
    // Nếu trang phải/dưới quá hẹp cho sàn chạm ở màn hình siêu nhỏ, nới lên tối đa 0.65
    if (
      spread.rightOrBottomPage.w < touchFloor + 8 ||
      spread.rightOrBottomPage.h < touchFloor + 8
    ) {
      spread = computeResponsiveBookSpread(stage, 0.65);
    }
    const canFitSplit =
      spread.rightOrBottomPage.w >= touchFloor &&
      spread.rightOrBottomPage.h >= touchFloor;
    const interactiveZone = canFitSplit
      ? spread.rightOrBottomPage
      : fullBookContentZone(spread);
    return {
      stage,
      spread,
      board,
      hasTwoPages: canFitSplit,
      showcaseZone: canFitSplit ? spread.leftOrTopPage : null,
      interactiveZone,
      slots: [buildSingleCardSlot(interactiveZone, stage, touchFloor)],
    };
  }

  let grid = pickChoiceGrid(spread.rightOrBottomPage, itemCount, touchFloor);
  if (!grid.fitsAtFloor) {
    spread = computeResponsiveBookSpread(stage, 0.68);
    grid = pickChoiceGrid(spread.rightOrBottomPage, itemCount, touchFloor);
  }
  if (!grid.fitsAtFloor) {
    // Khung siêu hẹp cực đoan: gom showcase lên dải nhỏ hoặc nhường toàn trang để giữ cứng sàn chạm BR-PSZ-04
    const full = fullBookContentZone(spread);
    const fullGrid = pickChoiceGrid(full, itemCount, touchFloor);
    return {
      stage,
      spread,
      board,
      hasTwoPages: false,
      showcaseZone: null,
      interactiveZone: full,
      slots: buildChoiceSlotsInZone(full, stage, itemCount, fullGrid),
    };
  }

  return {
    stage,
    spread,
    board,
    hasTwoPages: true,
    showcaseZone: spread.leftOrTopPage,
    interactiveZone: spread.rightOrBottomPage,
    slots: buildChoiceSlotsInZone(
      spread.rightOrBottomPage,
      stage,
      itemCount,
      grid
    ),
  };
}
