/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: geometry calculations */

import {
  DEFAULT_LOGIC_SPACE,
  getTouchFloor,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "./constants.js";
import type { LayoutInput, Slot } from "./types.js";

/** Hằng của `clue-board` (GT-009) — xem computeClueBoardLayout. */
const CLUE_BOARD_MAX_CLUES = 3;
const CLUE_BOARD_STRIP_RATIO = 0.28;
const CLUE_BOARD_MAX_CLUE_W = 260;
const CLUE_BOARD_MAX_CLUE_H = 96;
const CLUE_BOARD_MAX_COLS = 5;
const CLUE_BOARD_MAX_CARD = 120;

/** Cạnh ô của `matrix-slot-grid` trước khi bị sàn chạm đẩy lên. */
const MATRIX_SLOT_CELL_PX = 80;

/** Cạnh ô của `matrix-3x3`; khay chọn nằm **dưới** ma trận, không nằm bên phải. */
const MATRIX_3X3_CELL_PX = 96;

/**
 * Tính toán bố cục dạng lưới (grid / grid-2x4 / card-flip-grid / flex-wrap).
 * Tự động phân trang khi số ô vượt quá sức chứa mà không được thu nhỏ dưới sàn chạm (BR-LAY-04).
 */
export function computeGridLayout(
  input: LayoutInput,
  options?: {
    fixedCols?: number;
    maxCols?: number;
    fixedRows?: number;
    aspectRatio?: number;
  }
): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand } = input;
  if (slotCount <= 0) {
    return [];
  }

  const touchFloor = getTouchFloor(ageBand);
  const minW = touchFloor;
  const minH = touchFloor;

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  // Tính số cột và hàng tối đa có thể vừa trên 1 trang với kích thước sàn chạm
  let maxCapRows = 4;
  if (ageBand === "3-4") {
    maxCapRows = 2;
  } else if (ageBand === "4-5") {
    maxCapRows = 3;
  }

  const maxPossibleCols = Math.max(
    1,
    Math.min(
      ageBand === "3-4" ? 3 : 4,
      Math.floor((availW + SLOT_GAP_PX) / (minW + SLOT_GAP_PX))
    )
  );
  const maxPossibleRows = Math.max(
    1,
    Math.min(
      maxCapRows,
      Math.floor((availH + SLOT_GAP_PX) / (minH + SLOT_GAP_PX))
    )
  );

  let targetCols = options?.fixedCols;
  if (!targetCols) {
    if (options?.maxCols) {
      targetCols = Math.min(options.maxCols, slotCount, maxPossibleCols);
    } else if (slotCount <= 3) {
      targetCols = slotCount;
    } else if (slotCount === 4) {
      targetCols = 2;
    } else if (slotCount <= 6) {
      targetCols = 3;
    } else if (slotCount <= 8) {
      targetCols = 4;
    } else {
      targetCols = Math.min(4, maxPossibleCols);
    }
  }
  targetCols = Math.max(1, Math.min(targetCols, maxPossibleCols));

  const targetRows = options?.fixedRows
    ? Math.min(options.fixedRows, maxPossibleRows)
    : Math.max(1, Math.min(maxPossibleRows, Math.ceil(slotCount / targetCols)));

  const itemsPerPage = targetCols * targetRows;
  const slotW = Math.max(
    minW,
    Math.min(120, (availW - (targetCols - 1) * SLOT_GAP_PX) / targetCols)
  );
  const slotH = Math.max(
    minH,
    Math.min(120, (availH - (targetRows - 1) * SLOT_GAP_PX) / targetRows)
  );

  const slots: Slot[] = [];

  for (let i = 0; i < slotCount; i++) {
    const page = Math.floor(i / itemsPerPage);
    const indexInPage = i % itemsPerPage;
    const itemsInThisPage = Math.min(
      itemsPerPage,
      slotCount - page * itemsPerPage
    );

    // Tính số hàng và cột thực tế của trang này để căn giữa
    const pageRows = Math.ceil(itemsInThisPage / targetCols);
    const row = Math.floor(indexInPage / targetCols);
    const col = indexInPage % targetCols;

    const itemsInThisRow = Math.min(
      targetCols,
      itemsInThisPage - row * targetCols
    );

    const totalGridW =
      itemsInThisRow * slotW + (itemsInThisRow - 1) * SLOT_GAP_PX;
    const totalGridH = pageRows * slotH + (pageRows - 1) * SLOT_GAP_PX;

    const startX = SAFE_MARGIN_PX + (availW - totalGridW) / 2;
    const startY = SAFE_MARGIN_PX + (availH - totalGridH) / 2;

    const centerX = startX + col * (slotW + SLOT_GAP_PX) + slotW / 2;
    const centerY = startY + row * (slotH + SLOT_GAP_PX) + slotH / 2;

    slots.push({
      index: i,
      x: Math.round(centerX),
      y: Math.round(centerY),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(touchFloor, Math.round(slotW)),
      hitH: Math.max(touchFloor, Math.round(slotH)),
      page,
      role: "neutral",
    });
  }

  return slots;
}

/**
 * Bố cục 1 hàng ngang duy nhất (horizontal-row)
 */
export function computeHorizontalRowLayout(input: LayoutInput): Slot[] {
  return computeGridLayout(input, { fixedRows: 1 });
}

/**
 * Bố cục phân chia 2 vùng (bipartite): Nguồn và Đích.
 * - vertical: Vùng nguồn ở trên, vùng đích ở dưới (top-source-bottom-target)
 * - horizontal: Vùng nguồn bên trái, vùng đích bên phải (left-source-right-target / two-column-matching / split-columns)
 */
export function computeBipartiteLayout(
  input: LayoutInput,
  options: {
    orientation: "vertical" | "horizontal";
    isTwoColumn?: boolean;
  }
): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawTargetCount } = input;
  const targetCount = rawTargetCount ?? slotCount;
  const touchFloor = getTouchFloor(ageBand);

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const slots: Slot[] = [];

  if (options.orientation === "vertical") {
    // Nguồn ở trên, Đích ở dưới
    const zoneH = (availH - SLOT_GAP_PX) / 2;
    const topStartY = SAFE_MARGIN_PX;
    const botStartY = SAFE_MARGIN_PX + zoneH + SLOT_GAP_PX;

    // Nguồn slots
    const sourceCols = Math.max(1, slotCount);
    const sourceSlotW = Math.max(
      touchFloor,
      Math.min(120, (availW - (sourceCols - 1) * SLOT_GAP_PX) / sourceCols)
    );
    const sourceSlotH = Math.max(touchFloor, Math.min(100, zoneH));
    const totalSourceW =
      sourceCols * sourceSlotW + (sourceCols - 1) * SLOT_GAP_PX;
    const sourceStartX = SAFE_MARGIN_PX + (availW - totalSourceW) / 2;

    for (let i = 0; i < slotCount; i++) {
      const cx =
        sourceStartX + i * (sourceSlotW + SLOT_GAP_PX) + sourceSlotW / 2;
      const cy = topStartY + zoneH / 2;
      slots.push({
        index: i,
        x: Math.round(cx),
        y: Math.round(cy),
        w: Math.round(sourceSlotW),
        h: Math.round(sourceSlotH),
        hitW: Math.max(touchFloor, Math.round(sourceSlotW)),
        hitH: Math.max(touchFloor, Math.round(sourceSlotH)),
        page: 0,
        role: "source",
      });
    }

    // Đích slots
    const targetCols = Math.max(1, targetCount);
    const targetSlotW = Math.max(
      touchFloor,
      Math.min(120, (availW - (targetCols - 1) * SLOT_GAP_PX) / targetCols)
    );
    const targetSlotH = Math.max(touchFloor, Math.min(100, zoneH));
    const totalTargetW =
      targetCols * targetSlotW + (targetCols - 1) * SLOT_GAP_PX;
    const targetStartX = SAFE_MARGIN_PX + (availW - totalTargetW) / 2;

    for (let j = 0; j < targetCount; j++) {
      const cx =
        targetStartX + j * (targetSlotW + SLOT_GAP_PX) + targetSlotW / 2;
      const cy = botStartY + zoneH / 2;
      slots.push({
        index: slotCount + j,
        x: Math.round(cx),
        y: Math.round(cy),
        w: Math.round(targetSlotW),
        h: Math.round(targetSlotH),
        hitW: Math.max(touchFloor, Math.round(targetSlotW)),
        hitH: Math.max(touchFloor, Math.round(targetSlotH)),
        page: 0,
        role: "target",
      });
    }
  } else {
    // Nguồn bên trái, Đích bên phải
    const zoneW = (availW - SLOT_GAP_PX) / 2;
    const leftStartX = SAFE_MARGIN_PX;
    const rightStartX = SAFE_MARGIN_PX + zoneW + SLOT_GAP_PX;

    // Cột nguồn (trái)
    const sourceRows = Math.max(1, slotCount);
    const sourceSlotW = Math.max(touchFloor, Math.min(120, zoneW));
    const sourceSlotH = Math.max(
      touchFloor,
      Math.min(90, (availH - (sourceRows - 1) * SLOT_GAP_PX) / sourceRows)
    );
    const totalSourceH =
      sourceRows * sourceSlotH + (sourceRows - 1) * SLOT_GAP_PX;
    const sourceStartY = SAFE_MARGIN_PX + (availH - totalSourceH) / 2;

    for (let i = 0; i < slotCount; i++) {
      const cx = leftStartX + zoneW / 2;
      const cy =
        sourceStartY + i * (sourceSlotH + SLOT_GAP_PX) + sourceSlotH / 2;
      slots.push({
        index: i,
        x: Math.round(cx),
        y: Math.round(cy),
        w: Math.round(sourceSlotW),
        h: Math.round(sourceSlotH),
        hitW: Math.max(touchFloor, Math.round(sourceSlotW)),
        hitH: Math.max(touchFloor, Math.round(sourceSlotH)),
        page: 0,
        role: "source",
      });
    }

    // Cột đích (phải)
    const targetRows = Math.max(1, targetCount);
    const targetSlotW = Math.max(touchFloor, Math.min(120, zoneW));
    const targetSlotH = Math.max(
      touchFloor,
      Math.min(90, (availH - (targetRows - 1) * SLOT_GAP_PX) / targetRows)
    );
    const totalTargetH =
      targetRows * targetSlotH + (targetRows - 1) * SLOT_GAP_PX;
    const targetStartY = SAFE_MARGIN_PX + (availH - totalTargetH) / 2;

    for (let j = 0; j < targetCount; j++) {
      const cx = rightStartX + zoneW / 2;
      const cy =
        targetStartY + j * (targetSlotH + SLOT_GAP_PX) + targetSlotH / 2;
      slots.push({
        index: slotCount + j,
        x: Math.round(cx),
        y: Math.round(cy),
        w: Math.round(targetSlotW),
        h: Math.round(targetSlotH),
        hitW: Math.max(touchFloor, Math.round(targetSlotW)),
        hitH: Math.max(touchFloor, Math.round(targetSlotH)),
        page: 0,
        role: "target",
      });
    }
  }

  return slots;
}

/**
 * Bố cục phân loại vào nhiều rổ ở dưới (multi-bucket-bottom)
 */
export function computeMultiBucketLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawBucketCount } = input;
  const bucketCount = rawBucketCount ?? 2;
  const touchFloor = getTouchFloor(ageBand);

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const slots: Slot[] = [];

  // Vùng trên: Vật phẩm nguồn (sources)
  const topZoneH = availH * 0.45;
  const botZoneH = availH * 0.5;

  const sourceCols = Math.max(1, slotCount);
  const sourceSlotW = Math.max(
    touchFloor,
    Math.min(100, (availW - (sourceCols - 1) * SLOT_GAP_PX) / sourceCols)
  );
  const sourceSlotH = Math.max(touchFloor, Math.min(100, topZoneH));
  const totalSourceW =
    sourceCols * sourceSlotW + (sourceCols - 1) * SLOT_GAP_PX;
  const sourceStartX = SAFE_MARGIN_PX + (availW - totalSourceW) / 2;

  for (let i = 0; i < slotCount; i++) {
    const cx = sourceStartX + i * (sourceSlotW + SLOT_GAP_PX) + sourceSlotW / 2;
    const cy = SAFE_MARGIN_PX + topZoneH / 2;
    slots.push({
      index: i,
      x: Math.round(cx),
      y: Math.round(cy),
      w: Math.round(sourceSlotW),
      h: Math.round(sourceSlotH),
      hitW: Math.max(touchFloor, Math.round(sourceSlotW)),
      hitH: Math.max(touchFloor, Math.round(sourceSlotH)),
      page: 0,
      role: "source",
    });
  }

  // Vùng dưới: Rổ đựng mục tiêu (targets)
  const bCols = Math.max(1, bucketCount);
  const bucketW = Math.max(
    touchFloor,
    Math.min(180, (availW - (bCols - 1) * SLOT_GAP_PX) / bCols)
  );
  const bucketH = Math.max(touchFloor, Math.min(140, botZoneH));
  const totalBucketW = bCols * bucketW + (bCols - 1) * SLOT_GAP_PX;
  const bucketStartX = SAFE_MARGIN_PX + (availW - totalBucketW) / 2;
  const bucketStartY =
    SAFE_MARGIN_PX + topZoneH + (availH - topZoneH - bucketH) / 2;

  for (let b = 0; b < bucketCount; b++) {
    const cx = bucketStartX + b * (bucketW + SLOT_GAP_PX) + bucketW / 2;
    const cy = bucketStartY + bucketH / 2;
    slots.push({
      index: slotCount + b,
      x: Math.round(cx),
      y: Math.round(cy),
      w: Math.round(bucketW),
      h: Math.round(bucketH),
      hitW: Math.max(touchFloor, Math.round(bucketW)),
      hitH: Math.max(touchFloor, Math.round(bucketH)),
      page: 0,
      role: "target",
    });
  }

  return slots;
}

/**
 * Bố cục đường ray hoặc bậc thang theo trình tự (horizontal-track / step-ladder)
 */
export function computeTrackLayout(
  input: LayoutInput,
  options?: { isLadder?: boolean }
): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand } = input;
  if (slotCount <= 0) {
    return [];
  }

  const touchFloor = getTouchFloor(ageBand);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const slotW = Math.max(
    touchFloor,
    Math.min(110, (availW - (slotCount - 1) * SLOT_GAP_PX) / slotCount)
  );
  const slotH = Math.max(touchFloor, Math.min(110, slotW));

  const totalW = slotCount * slotW + (slotCount - 1) * SLOT_GAP_PX;
  const startX = SAFE_MARGIN_PX + (availW - totalW) / 2;

  const slots: Slot[] = [];

  if (options?.isLadder) {
    // Dạng bậc thang (step-ladder): leo dần từ dưới lên trên
    const stepH = (availH - slotH) / Math.max(1, slotCount - 1);
    for (let i = 0; i < slotCount; i++) {
      const cx = startX + i * (slotW + SLOT_GAP_PX) + slotW / 2;
      const cy = LOGIC_HEIGHT - SAFE_MARGIN_PX - slotH / 2 - i * stepH;
      slots.push({
        index: i,
        x: Math.round(cx),
        y: Math.round(cy),
        w: Math.round(slotW),
        h: Math.round(slotH),
        hitW: Math.max(touchFloor, Math.round(slotW)),
        hitH: Math.max(touchFloor, Math.round(slotH)),
        page: 0,
        role: "target",
      });
    }
  } else {
    // Dạng đường ray ngang (horizontal-track)
    const centerY = LOGIC_HEIGHT / 2;
    for (let i = 0; i < slotCount; i++) {
      const cx = startX + i * (slotW + SLOT_GAP_PX) + slotW / 2;
      slots.push({
        index: i,
        x: Math.round(cx),
        y: Math.round(centerY),
        w: Math.round(slotW),
        h: Math.round(slotH),
        hitW: Math.max(touchFloor, Math.round(slotW)),
        hitH: Math.max(touchFloor, Math.round(slotH)),
        page: 0,
        role: "target",
      });
    }
  }

  return slots;
}

/**
 * Bố cục sơ đồ tách gộp hình cây (number-bond-tree).
 * - 1 ô gốc (Whole) ở trên trung tâm
 * - 2 hoặc 3 ô nhánh (Parts) ở hàng giữa
 * - Các vật phẩm kéo/chọn (Sources) ở hàng dưới
 */
export function computeNumberBondTreeLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawBranchCount } = input;
  const branchCount = rawBranchCount ?? 2;
  const touchFloor = getTouchFloor(ageBand);

  const slotW = Math.max(touchFloor, 80);
  const slotH = Math.max(touchFloor, 80);
  const slots: Slot[] = [];

  // Slot 0: Whole (Ô tổng) ở đỉnh
  const wholeX = LOGIC_WIDTH / 2;
  const wholeY = SAFE_MARGIN_PX + slotH / 2 + 10;
  slots.push({
    index: 0,
    x: Math.round(wholeX),
    y: Math.round(wholeY),
    w: Math.round(slotW),
    h: Math.round(slotH),
    hitW: Math.max(touchFloor, Math.round(slotW)),
    hitH: Math.max(touchFloor, Math.round(slotH)),
    page: 0,
    role: "target",
  });

  // Slots 1..branchCount: Parts (Các ô nhánh)
  const partSpacing = slotW + Math.max(SLOT_GAP_PX, 40);
  const totalPartsW = (branchCount - 1) * partSpacing;
  const partsStartX = wholeX - totalPartsW / 2;
  const partsY = wholeY + slotH + Math.max(SLOT_GAP_PX, 30);

  for (let b = 0; b < branchCount; b++) {
    const px = partsStartX + b * partSpacing;
    slots.push({
      index: 1 + b,
      x: Math.round(px),
      y: Math.round(partsY),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(touchFloor, Math.round(slotW)),
      hitH: Math.max(touchFloor, Math.round(slotH)),
      page: 0,
      role: "target",
    });
  }

  // Source draggable slots ở hàng dưới
  if (slotCount > 0) {
    const sourceSpacing = slotW + SLOT_GAP_PX;
    const totalSourceW = (slotCount - 1) * sourceSpacing;
    const sourceStartX = LOGIC_WIDTH / 2 - totalSourceW / 2;
    const sourceY = LOGIC_HEIGHT - SAFE_MARGIN_PX - slotH / 2 - 10;

    for (let s = 0; s < slotCount; s++) {
      const sx = sourceStartX + s * sourceSpacing;
      slots.push({
        index: 1 + branchCount + s,
        x: Math.round(sx),
        y: Math.round(sourceY),
        w: Math.round(slotW),
        h: Math.round(slotH),
        hitW: Math.max(touchFloor, Math.round(slotW)),
        hitH: Math.max(touchFloor, Math.round(slotH)),
        page: 0,
        role: "source",
      });
    }
  }

  return slots;
}

/**
 * Bố cục khung 10 ô tách gộp (ten-frame-split).
 * - Bảng 2 hàng x 5 cột (10 ô) ở giữa
 * - Nguồn vật phẩm ở hàng dưới
 */
export function computeTenFrameSplitLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand } = input;
  const touchFloor = getTouchFloor(ageBand);

  const slotW = Math.max(touchFloor, 70);
  const slotH = Math.max(touchFloor, 70);
  const slots: Slot[] = [];

  // 10 ô target (2 hàng x 5 cột)
  const cols = 5;
  const rows = 2;
  const gridW = cols * slotW + (cols - 1) * SLOT_GAP_PX;
  const gridStartX = (LOGIC_WIDTH - gridW) / 2;
  const gridStartY = SAFE_MARGIN_PX + 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cx = gridStartX + c * (slotW + SLOT_GAP_PX) + slotW / 2;
      const cy = gridStartY + r * (slotH + SLOT_GAP_PX) + slotH / 2;
      slots.push({
        index: idx,
        x: Math.round(cx),
        y: Math.round(cy),
        w: Math.round(slotW),
        h: Math.round(slotH),
        hitW: Math.max(touchFloor, Math.round(slotW)),
        hitH: Math.max(touchFloor, Math.round(slotH)),
        page: 0,
        role: "target",
      });
    }
  }

  // Source slots ở đáy
  if (slotCount > 0) {
    const sourceW = slotCount * slotW + (slotCount - 1) * SLOT_GAP_PX;
    const sourceStartX = (LOGIC_WIDTH - sourceW) / 2;
    const sourceY = LOGIC_HEIGHT - SAFE_MARGIN_PX - slotH / 2 - 10;

    for (let i = 0; i < slotCount; i++) {
      const cx = sourceStartX + i * (slotW + SLOT_GAP_PX) + slotW / 2;
      slots.push({
        index: 10 + i,
        x: Math.round(cx),
        y: Math.round(sourceY),
        w: Math.round(slotW),
        h: Math.round(slotH),
        hitW: Math.max(touchFloor, Math.round(slotW)),
        hitH: Math.max(touchFloor, Math.round(slotH)),
        page: 0,
        role: "source",
      });
    }
  }

  return slots;
}

/**
 * Bố cục khay ô chứa kéo thả ngang (horizontal-slot-track).
 * - Hàng ô đích (target slots) ở giữa
 * - Hàng vật phẩm kéo thả (source items) ở phía dưới
 */
export function computeHorizontalSlotTrackLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawTargetCount } = input;
  const targetCount = rawTargetCount ?? slotCount;
  const touchFloor = getTouchFloor(ageBand);

  const slotW = Math.max(touchFloor, 80);
  const slotH = Math.max(touchFloor, 80);
  const slots: Slot[] = [];

  // Hàng target slots
  const targetTotalW = targetCount * slotW + (targetCount - 1) * SLOT_GAP_PX;
  const targetStartX = (LOGIC_WIDTH - targetTotalW) / 2;
  const targetY = LOGIC_HEIGHT * 0.35;

  for (let t = 0; t < targetCount; t++) {
    const cx = targetStartX + t * (slotW + SLOT_GAP_PX) + slotW / 2;
    slots.push({
      index: t,
      x: Math.round(cx),
      y: Math.round(targetY),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(touchFloor, Math.round(slotW)),
      hitH: Math.max(touchFloor, Math.round(slotH)),
      page: 0,
      role: "target",
    });
  }

  // Hàng source items
  const sourceTotalW = slotCount * slotW + (slotCount - 1) * SLOT_GAP_PX;
  const sourceStartX = (LOGIC_WIDTH - sourceTotalW) / 2;
  const sourceY = LOGIC_HEIGHT * 0.72;

  for (let s = 0; s < slotCount; s++) {
    const cx = sourceStartX + s * (slotW + SLOT_GAP_PX) + slotW / 2;
    slots.push({
      index: targetCount + s,
      x: Math.round(cx),
      y: Math.round(sourceY),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(touchFloor, Math.round(slotW)),
      hitH: Math.max(touchFloor, Math.round(slotH)),
      page: 0,
      role: "source",
    });
  }

  return slots;
}

/**
 * Bố cục ma trận ô chứa logic (matrix-slot-grid).
 * - Khung lưới 2x2 hoặc 3x3 ở bên trái / giữa
 * - Các thẻ lựa chọn ở bên phải
 */
export function computeMatrixSlotGridLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawGridSize } = input;
  const gridSize = rawGridSize === 9 ? 3 : 2; // 2x2 hoặc 3x3
  const touchFloor = getTouchFloor(ageBand);
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const cell = Math.max(touchFloor, MATRIX_SLOT_CELL_PX);
  const slots: Slot[] = [];

  // Khung ma trận bên trái
  const matrixTotalW = gridSize * cell + (gridSize - 1) * SLOT_GAP_PX;
  const matrixTotalH = gridSize * cell + (gridSize - 1) * SLOT_GAP_PX;
  const matrixStartX = SAFE_MARGIN_PX;
  const matrixStartY =
    SAFE_MARGIN_PX + Math.max(0, (availH - matrixTotalH) / 2);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      slots.push({
        index: r * gridSize + c,
        x: Math.round(matrixStartX + c * (cell + SLOT_GAP_PX) + cell / 2),
        y: Math.round(matrixStartY + r * (cell + SLOT_GAP_PX) + cell / 2),
        w: Math.round(cell),
        h: Math.round(cell),
        hitW: Math.max(touchFloor, Math.round(cell)),
        hitH: Math.max(touchFloor, Math.round(cell)),
        page: 0,
        role: "target",
      });
    }
  }

  // Khay lựa chọn bên phải — **xuống hàng** khi một cột không chứa hết.
  // Một cột duy nhất tràn đáy từ 6 lựa chọn trở lên, và `GT-008` khai tới 9.
  const trayStartX = matrixStartX + matrixTotalW + 2 * SLOT_GAP_PX;
  const trayW = LOGIC_WIDTH - SAFE_MARGIN_PX - trayStartX;
  const trayCols = Math.max(
    1,
    Math.min(
      slotCount,
      Math.floor((trayW + SLOT_GAP_PX) / (cell + SLOT_GAP_PX))
    )
  );
  const trayRows = Math.max(1, Math.ceil(slotCount / trayCols));
  const trayTotalH = trayRows * cell + (trayRows - 1) * SLOT_GAP_PX;
  const trayStartY = SAFE_MARGIN_PX + Math.max(0, (availH - trayTotalH) / 2);

  for (let o = 0; o < slotCount; o++) {
    const row = Math.floor(o / trayCols);
    const col = o % trayCols;
    const inRow = Math.min(trayCols, slotCount - row * trayCols);
    const rowW = inRow * cell + (inRow - 1) * SLOT_GAP_PX;
    const rowStartX = trayStartX + Math.max(0, (trayW - rowW) / 2);
    slots.push({
      index: gridSize * gridSize + o,
      x: Math.round(rowStartX + col * (cell + SLOT_GAP_PX) + cell / 2),
      y: Math.round(trayStartY + row * (cell + SLOT_GAP_PX) + cell / 2),
      w: Math.round(cell),
      h: Math.round(cell),
      hitW: Math.max(touchFloor, Math.round(cell)),
      hitH: Math.max(touchFloor, Math.round(cell)),
      page: 0,
      role: "source",
    });
  }

  return slots;
}

/**
 * Bố cục bảng loại trừ theo manh mối (clue-board) — `GT-009`.
 *
 * Dải manh mối một hàng ở trên, bảng ứng viên ở dưới. Ứng viên **xuống hàng**
 * thay vì co lại: `computeBipartiteLayout` dọc đặt cả hai vùng trên một hàng, và
 * ở 10 ứng viên band 4-5 nó tràn ra 28..932 trong khi vùng an toàn là 32..928.
 * Đó là lý do hàng registry không đủ và `clue-board` cần hàm riêng.
 *
 * `slotCount` là số ứng viên; `targetCount` là số manh mối (1–3).
 */
export function computeClueBoardLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawClueCount } = input;
  const clueCount = Math.max(
    1,
    Math.min(CLUE_BOARD_MAX_CLUES, rawClueCount ?? 1)
  );
  const touchFloor = getTouchFloor(ageBand);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const clueZoneH = Math.max(
    touchFloor,
    Math.round(availH * CLUE_BOARD_STRIP_RATIO)
  );
  const boardZoneH = availH - clueZoneH - SLOT_GAP_PX;

  const slots: Slot[] = [
    ...computeClueStrip({ clueCount, touchFloor, availW, clueZoneH }),
  ];
  slots.push(
    ...computeCandidateBoard({
      slotCount,
      clueCount,
      touchFloor,
      availW,
      boardZoneH,
      boardStartY: SAFE_MARGIN_PX + clueZoneH + SLOT_GAP_PX,
    })
  );
  return slots;
}

function computeClueStrip(args: {
  clueCount: number;
  touchFloor: number;
  availW: number;
  clueZoneH: number;
}): Slot[] {
  const { clueCount, touchFloor, availW, clueZoneH } = args;
  const clueW = Math.max(
    touchFloor,
    Math.min(
      CLUE_BOARD_MAX_CLUE_W,
      (availW - (clueCount - 1) * SLOT_GAP_PX) / clueCount
    )
  );
  const clueH = Math.max(
    touchFloor,
    Math.min(CLUE_BOARD_MAX_CLUE_H, clueZoneH)
  );
  const totalW = clueCount * clueW + (clueCount - 1) * SLOT_GAP_PX;
  const startX = SAFE_MARGIN_PX + (availW - totalW) / 2;
  const centerY = SAFE_MARGIN_PX + clueZoneH / 2;

  const slots: Slot[] = [];
  for (let i = 0; i < clueCount; i++) {
    slots.push({
      index: i,
      x: Math.round(startX + i * (clueW + SLOT_GAP_PX) + clueW / 2),
      y: Math.round(centerY),
      w: Math.round(clueW),
      h: Math.round(clueH),
      hitW: Math.max(touchFloor, Math.round(clueW)),
      hitH: Math.max(touchFloor, Math.round(clueH)),
      page: 0,
      role: "source",
    });
  }
  return slots;
}

function computeCandidateBoard(args: {
  slotCount: number;
  clueCount: number;
  touchFloor: number;
  availW: number;
  boardZoneH: number;
  boardStartY: number;
}): Slot[] {
  const { slotCount, clueCount, touchFloor, availW, boardZoneH, boardStartY } =
    args;
  const maxColsByTouch = Math.max(
    1,
    Math.floor((availW + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX))
  );
  const cols = Math.max(
    1,
    Math.min(
      CLUE_BOARD_MAX_COLS,
      maxColsByTouch,
      slotCount <= CLUE_BOARD_MAX_COLS ? slotCount : Math.ceil(slotCount / 2)
    )
  );
  const rows = Math.max(1, Math.ceil(slotCount / cols));

  const cardW = Math.max(
    touchFloor,
    Math.min(CLUE_BOARD_MAX_CARD, (availW - (cols - 1) * SLOT_GAP_PX) / cols)
  );
  const cardH = Math.max(
    touchFloor,
    Math.min(
      CLUE_BOARD_MAX_CARD,
      (boardZoneH - (rows - 1) * SLOT_GAP_PX) / rows
    )
  );
  const totalH = rows * cardH + (rows - 1) * SLOT_GAP_PX;
  const startY = boardStartY + Math.max(0, (boardZoneH - totalH) / 2);

  const slots: Slot[] = [];
  for (let i = 0; i < slotCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cardsInRow = Math.min(cols, slotCount - row * cols);
    const rowW = cardsInRow * cardW + (cardsInRow - 1) * SLOT_GAP_PX;
    const startX = SAFE_MARGIN_PX + (availW - rowW) / 2;
    slots.push({
      index: clueCount + i,
      x: Math.round(startX + col * (cardW + SLOT_GAP_PX) + cardW / 2),
      y: Math.round(startY + row * (cardH + SLOT_GAP_PX) + cardH / 2),
      w: Math.round(cardW),
      h: Math.round(cardH),
      hitW: Math.max(touchFloor, Math.round(cardW)),
      hitH: Math.max(touchFloor, Math.round(cardH)),
      page: 0,
      role: "target",
    });
  }
  return slots;
}

/**
 * Bố cục ma trận chọn hình (matrix-3x3) — `GT-011`.
 *
 * Khác `matrix-slot-grid` ở chỗ khay chọn nằm **dưới** ma trận chứ không bên phải
 * (mục 7.3 spec khuôn). `computeGridLayout` không thay được: nó chỉ sinh một vùng
 * `neutral` duy nhất, không tách được ô ma trận với thẻ chọn.
 *
 * `slotCount` là số thẻ chọn; `targetCount` >= 9 cho lưới 3×3, còn lại 2×2.
 */
export function computeMatrix3x3Layout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawGridSize } = input;
  const gridSize = (rawGridSize ?? 0) >= 9 ? 3 : 2;
  const touchFloor = getTouchFloor(ageBand);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const cell = Math.max(touchFloor, MATRIX_3X3_CELL_PX);
  const matrixH = gridSize * cell + (gridSize - 1) * SLOT_GAP_PX;
  const matrixW = matrixH;

  const trayCols = Math.max(
    1,
    Math.min(
      slotCount,
      Math.floor((availW + SLOT_GAP_PX) / (cell + SLOT_GAP_PX))
    )
  );
  const trayRows = Math.max(1, Math.ceil(slotCount / trayCols));
  const trayH = trayRows * cell + (trayRows - 1) * SLOT_GAP_PX;

  const blockH = matrixH + SLOT_GAP_PX + trayH;
  const blockStartY = SAFE_MARGIN_PX + Math.max(0, (availH - blockH) / 2);
  const matrixStartX = SAFE_MARGIN_PX + (availW - matrixW) / 2;

  const slots: Slot[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      slots.push({
        index: r * gridSize + c,
        x: Math.round(matrixStartX + c * (cell + SLOT_GAP_PX) + cell / 2),
        y: Math.round(blockStartY + r * (cell + SLOT_GAP_PX) + cell / 2),
        w: Math.round(cell),
        h: Math.round(cell),
        hitW: Math.max(touchFloor, Math.round(cell)),
        hitH: Math.max(touchFloor, Math.round(cell)),
        page: 0,
        role: "target",
      });
    }
  }

  const trayStartY = blockStartY + matrixH + SLOT_GAP_PX;
  for (let o = 0; o < slotCount; o++) {
    const row = Math.floor(o / trayCols);
    const col = o % trayCols;
    const inRow = Math.min(trayCols, slotCount - row * trayCols);
    const rowW = inRow * cell + (inRow - 1) * SLOT_GAP_PX;
    const rowStartX = SAFE_MARGIN_PX + (availW - rowW) / 2;
    slots.push({
      index: gridSize * gridSize + o,
      x: Math.round(rowStartX + col * (cell + SLOT_GAP_PX) + cell / 2),
      y: Math.round(trayStartY + row * (cell + SLOT_GAP_PX) + cell / 2),
      w: Math.round(cell),
      h: Math.round(cell),
      hitW: Math.max(touchFloor, Math.round(cell)),
      hitH: Math.max(touchFloor, Math.round(cell)),
      page: 0,
      role: "source",
    });
  }

  return slots;
}

/**
 * Bố cục phương trình hình ảnh (equation-rows) — `GT-010`.
 * Hàng trên là 2-3 dòng phương trình, hàng dưới là khay chọn giá trị.
 */
export function computeEquationRowsLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawEqCount } = input;
  const eqCount = Math.max(1, rawEqCount ?? 2);
  const touchFloor = getTouchFloor(ageBand);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const rowH = Math.min(80, Math.floor((availH * 0.6) / eqCount));
  const card = Math.max(touchFloor, 64);

  const slots: Slot[] = [];
  const eqStartY = SAFE_MARGIN_PX + 10;
  const eqGap = 12;

  // Slots cho phương trình
  for (let i = 0; i < eqCount; i++) {
    slots.push({
      index: i,
      x: Math.round(SAFE_MARGIN_PX + availW / 2),
      y: Math.round(eqStartY + i * (rowH + eqGap) + rowH / 2),
      w: Math.round(availW * 0.8),
      h: Math.round(rowH),
      hitW: Math.round(availW * 0.8),
      hitH: Math.max(touchFloor, rowH),
      page: 0,
      role: "target",
    });
  }

  // Slots cho options
  const trayStartY = eqStartY + eqCount * (rowH + eqGap) + 16;
  const optCols = Math.max(1, slotCount);
  const totalOptW = optCols * card + (optCols - 1) * SLOT_GAP_PX;
  const optStartX = SAFE_MARGIN_PX + Math.max(0, (availW - totalOptW) / 2);

  for (let o = 0; o < slotCount; o++) {
    slots.push({
      index: eqCount + o,
      x: Math.round(optStartX + o * (card + SLOT_GAP_PX) + card / 2),
      y: Math.round(trayStartY + card / 2),
      w: Math.round(card),
      h: Math.round(card),
      hitW: Math.max(touchFloor, Math.round(card)),
      hitH: Math.max(touchFloor, Math.round(card)),
      page: 0,
      role: "source",
    });
  }

  return slots;
}

/**
 * Bố cục chia đôi trục đối xứng (mirror-axis-split) — `GT-021`.
 * Nửa trái là mẫu tham chiếu, nửa phải là các ô cần hoàn thiện đối xứng, khay dưới là các mảnh lựa chọn.
 */
export function computeMirrorAxisSplitLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawTargetCount } = input;
  const targetCount = Math.max(1, rawTargetCount ?? 2);
  const touchFloor = getTouchFloor(ageBand);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;

  const slots: Slot[] = [];

  // Vùng làm việc chính bên trên chia đôi trục dọc (x = 480 là trục đối xứng)
  const mainH = Math.floor(availH * 0.65);
  const halfW = Math.floor((availW - SLOT_GAP_PX * 2) / 2);
  const cell = Math.max(touchFloor, 72);

  // 1. Mẫu đối xứng bên trái (Neutral / Reference)
  slots.push({
    index: 0,
    x: Math.round(SAFE_MARGIN_PX + halfW / 2),
    y: Math.round(SAFE_MARGIN_PX + mainH / 2),
    w: Math.round(halfW),
    h: Math.round(mainH),
    hitW: Math.round(halfW),
    hitH: Math.round(mainH),
    page: 0,
    role: "neutral",
  });

  // 2. Các ô đích cần hoàn thiện bên phải (Target)
  const targetCols = Math.min(targetCount, 3);
  const targetStartX = SAFE_MARGIN_PX + halfW + SLOT_GAP_PX * 2;

  for (let t = 0; t < targetCount; t++) {
    const row = Math.floor(t / targetCols);
    const col = t % targetCols;
    slots.push({
      index: 1 + t,
      x: Math.round(targetStartX + col * (cell + SLOT_GAP_PX) + cell / 2),
      y: Math.round(
        SAFE_MARGIN_PX + 20 + row * (cell + SLOT_GAP_PX) + cell / 2
      ),
      w: Math.round(cell),
      h: Math.round(cell),
      hitW: Math.max(touchFloor, Math.round(cell)),
      hitH: Math.max(touchFloor, Math.round(cell)),
      page: 0,
      role: "target",
    });
  }

  // 3. Khay mảnh lựa chọn bên dưới (Source)
  const trayStartY = SAFE_MARGIN_PX + mainH + 16;
  const sourceCols = Math.max(1, slotCount);
  const totalSourceW = sourceCols * cell + (sourceCols - 1) * SLOT_GAP_PX;
  const sourceStartX =
    SAFE_MARGIN_PX + Math.max(0, (availW - totalSourceW) / 2);

  for (let s = 0; s < slotCount; s++) {
    slots.push({
      index: 1 + targetCount + s,
      x: Math.round(sourceStartX + s * (cell + SLOT_GAP_PX) + cell / 2),
      y: Math.round(trayStartY + cell / 2),
      w: Math.round(cell),
      h: Math.round(cell),
      hitW: Math.max(touchFloor, Math.round(cell)),
      hitH: Math.max(touchFloor, Math.round(cell)),
      page: 0,
      role: "source",
    });
  }

  return slots;
}

/**
 * Bố cục khung cảnh tự do (free-scene) — `GT-022`.
 * Phân bố các vị trí vật thể trong không gian tranh logic đảm bảo sàn chạm và không chồng lấn.
 */
export function computeFreeSceneLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand } = input;
  if (slotCount <= 0) {
    return [];
  }
  const touchFloor = getTouchFloor(ageBand);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX;
  const cell = Math.max(touchFloor, 64);

  // Phân bố đều lưới mở rộng làm các điểm neo trong khung cảnh
  const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(slotCount))));
  const rows = Math.ceil(slotCount / cols);
  const colStep = availW / cols;
  const rowStep = availH / rows;

  const slots: Slot[] = [];
  for (let i = 0; i < slotCount; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    slots.push({
      index: i,
      x: Math.round(SAFE_MARGIN_PX + c * colStep + colStep / 2),
      y: Math.round(SAFE_MARGIN_PX + r * rowStep + rowStep / 2),
      w: Math.round(cell),
      h: Math.round(cell),
      hitW: Math.max(touchFloor, Math.round(cell)),
      hitH: Math.max(touchFloor, Math.round(cell)),
      page: 0,
      role: "neutral",
    });
  }

  return slots;
}

/**
 * Bố cục dải đo bằng đơn vị lặp (measure-strip) — `GT-030`.
 * - Slot 0: Vật mẫu được đo (neutral) trên dải đo trên.
 * - Slot 1..N: Các vị trí đặt đơn vị liên tiếp dọc vật (target).
 * - Slot N+1: Đơn vị nguồn trong khay (source).
 * - Slot N+2..N+1+M: Các ô đáp án lựa chọn ở khay dưới (neutral).
 */
export function computeMeasureStripLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { w: LOGIC_WIDTH } = input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount: rawOptionCount, ageBand, targetCount: rawUnits } = input;
  const units = Math.max(2, Math.min(10, rawUnits ?? 4));
  const optionCount = Math.max(1, rawOptionCount ?? 3);
  const touchFloor = getTouchFloor(ageBand);

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const unitW = Math.max(
    touchFloor,
    Math.min(96, Math.floor((availW - (units - 1) * SLOT_GAP_PX) / units))
  );
  const stripW = units * unitW + (units - 1) * SLOT_GAP_PX;
  const stripStartX = Math.round((LOGIC_WIDTH - stripW) / 2);

  const slots: Slot[] = [];

  // Slot 0: Vật được đo (dải trên)
  slots.push({
    index: 0,
    x: Math.round(LOGIC_WIDTH / 2),
    y: 180,
    w: Math.round(stripW),
    h: 80,
    hitW: Math.round(stripW),
    hitH: Math.max(touchFloor, 80),
    page: 0,
    role: "neutral",
  });

  // Slot 1..units: Các ô đặt đơn vị trên dải đo (ngay dưới vật)
  for (let i = 0; i < units; i++) {
    slots.push({
      index: 1 + i,
      x: Math.round(stripStartX + i * (unitW + SLOT_GAP_PX) + unitW / 2),
      y: 280,
      w: Math.round(unitW),
      h: Math.round(unitW),
      hitW: Math.max(touchFloor, Math.round(unitW)),
      hitH: Math.max(touchFloor, Math.round(unitW)),
      page: 0,
      role: "target",
    });
  }

  // Slot 1+units: Đơn vị nguồn trong khay
  const trayY = 430;
  const trayX = SAFE_MARGIN_PX + Math.round(unitW / 2) + 20;
  slots.push({
    index: 1 + units,
    x: trayX,
    y: trayY,
    w: Math.round(unitW),
    h: Math.round(unitW),
    hitW: Math.max(touchFloor, Math.round(unitW)),
    hitH: Math.max(touchFloor, Math.round(unitW)),
    page: 0,
    role: "source",
  });

  // Slot 2+units..: Các ô đáp án lựa chọn
  const optionsAreaLeft = trayX + Math.round(unitW / 2) + 30;
  const optionsAreaRight = LOGIC_WIDTH - SAFE_MARGIN_PX;
  const optionsAvailW = Math.max(100, optionsAreaRight - optionsAreaLeft);

  let optGap = 16;
  let optCell = Math.max(
    touchFloor,
    Math.min(
      96,
      Math.floor((optionsAvailW - (optionCount - 1) * optGap) / optionCount)
    )
  );

  let optionsTotalW = optionCount * optCell + (optionCount - 1) * optGap;
  if (optionsTotalW > optionsAvailW && optionCount > 1) {
    optGap = Math.max(
      4,
      Math.floor((optionsAvailW - optionCount * touchFloor) / (optionCount - 1))
    );
    optCell = touchFloor;
    optionsTotalW = optionCount * optCell + (optionCount - 1) * optGap;
  }

  const optStartX =
    optionsAreaLeft +
    Math.max(0, Math.round((optionsAvailW - optionsTotalW) / 2));

  for (let j = 0; j < optionCount; j++) {
    slots.push({
      index: 2 + units + j,
      x: Math.round(optStartX + j * (optCell + optGap) + optCell / 2),
      y: trayY,
      w: Math.round(optCell),
      h: Math.round(optCell),
      hitW: Math.max(touchFloor, Math.round(optCell)),
      hitH: Math.max(touchFloor, Math.round(optCell)),
      page: 0,
      role: "neutral",
    });
  }

  return slots;
}

/**
 * Bố cục dệt hoa văn lưới (weave-grid).
 * - Khung lưới ô vuông matrix ở trên (targets)
 * - Khay màu/sợi ở dưới (sources)
 */
export function computeWeaveGridLayout(input: LayoutInput): Slot[] {
  // Che hằng ở phạm vi hàm: mọi phép tính bên dưới giữ nguyên tên, nhưng đọc
  // theo không gian logic của khung nhìn hiện tại. Bỏ trống thì là 960x540.
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand, targetCount: rawCellCount } = input;
  const touchFloor = getTouchFloor(ageBand);
  const totalCells = rawCellCount && rawCellCount >= 4 ? rawCellCount : 4;
  const gridDimension = Math.round(Math.sqrt(totalCells));
  const rows = gridDimension;
  const cols = Math.ceil(totalCells / rows);

  const availGridW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availGridH = 260;

  const maxCellW = Math.floor((availGridW - (cols - 1) * 8) / cols);
  const maxCellH = Math.floor((availGridH - (rows - 1) * 8) / rows);
  const cell = Math.max(touchFloor, Math.min(68, Math.min(maxCellW, maxCellH)));
  const gap = Math.max(
    4,
    Math.min(8, Math.floor((availGridW - cols * cell) / Math.max(1, cols - 1)))
  );

  const gridTotalW = cols * cell + (cols - 1) * gap;
  const gridTotalH = rows * cell + (rows - 1) * gap;
  const gridStartX = Math.max(SAFE_MARGIN_PX, (LOGIC_WIDTH - gridTotalW) / 2);
  const gridStartY = Math.max(
    SAFE_MARGIN_PX + 40,
    100 + (availGridH - gridTotalH) / 2
  );

  const slots: Slot[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < totalCells) {
        slots.push({
          index: idx,
          x: Math.round(gridStartX + c * (cell + gap) + cell / 2),
          y: Math.round(gridStartY + r * (cell + gap) + cell / 2),
          w: Math.round(cell),
          h: Math.round(cell),
          hitW: Math.max(touchFloor, Math.round(cell)),
          hitH: Math.max(touchFloor, Math.round(cell)),
          page: 0,
          role: "target",
        });
      }
    }
  }

  // Khay màu/sợi bên dưới
  const availPaletteW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  let paletteGap = 12;
  let paletteW = Math.max(
    touchFloor,
    Math.min(
      64,
      Math.floor(
        (availPaletteW - (slotCount - 1) * paletteGap) / Math.max(1, slotCount)
      )
    )
  );
  if (
    slotCount * paletteW + (slotCount - 1) * paletteGap > availPaletteW &&
    slotCount > 1
  ) {
    paletteGap = Math.max(
      2,
      Math.floor((availPaletteW - slotCount * touchFloor) / (slotCount - 1))
    );
    paletteW = touchFloor;
  }
  const paletteH = paletteW;
  const paletteTotalW = slotCount * paletteW + (slotCount - 1) * paletteGap;
  const paletteStartX = Math.max(
    SAFE_MARGIN_PX,
    (LOGIC_WIDTH - paletteTotalW) / 2
  );
  const paletteY = Math.min(LOGIC_HEIGHT - SAFE_MARGIN_PX - paletteH / 2, 450);

  for (let p = 0; p < slotCount; p++) {
    slots.push({
      index: totalCells + p,
      x: Math.round(paletteStartX + p * (paletteW + paletteGap) + paletteW / 2),
      y: Math.round(paletteY),
      w: Math.round(paletteW),
      h: Math.round(paletteH),
      hitW: Math.max(touchFloor, Math.round(paletteW)),
      hitH: Math.max(touchFloor, Math.round(paletteH)),
      page: 0,
      role: "source",
    });
  }

  return slots;
}
