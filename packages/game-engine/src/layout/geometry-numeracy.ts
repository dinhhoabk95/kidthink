/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: geometry calculations */
import {
  CONTENT_TOP_PX,
  DEFAULT_LOGIC_SPACE,
  resolveTouchFloor,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "./constants.js";
import type { LayoutInput, Slot } from "./types.js";

/** Hằng của `equation-rows` (GT-010) — xem computeEquationRowsLayout. */
const EQUATION_ROW_MAX_H = 80;

const EQUATION_ROW_MIN_H = 40;

const EQUATION_TRAY_GAP_PX = 16;

/** Cạnh ô của `matrix-slot-grid` trước khi bị sàn chạm đẩy lên. */
const MATRIX_SLOT_CELL_PX = 80;

/** Cạnh ô của `matrix-3x3`; khay chọn nằm **dưới** ma trận, không nằm bên phải. */
const MATRIX_3X3_CELL_PX = 96;

/** Tỉ lệ rộng/cao của stage từ đó khay đứng cạnh ma trận (chỉ khi `inStage`). */
const MATRIX_SIDE_BY_SIDE_ASPECT = 1.3;

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);

  const slotW = Math.max(touchFloor, 80);
  const slotH = Math.max(touchFloor, 80);
  const slots: Slot[] = [];

  // Slot 0: Whole (Ô tổng) ở đỉnh
  const wholeX = LOGIC_WIDTH / 2;
  const wholeY = CONTENT_TOP_PX + slotH / 2 + 10;
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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);

  const slotW = Math.max(touchFloor, 70);
  const slotH = Math.max(touchFloor, 70);
  const slots: Slot[] = [];

  // 10 ô target (2 hàng x 5 cột)
  const cols = 5;
  const rows = 2;
  const gridW = cols * slotW + (cols - 1) * SLOT_GAP_PX;
  const gridStartX = (LOGIC_WIDTH - gridW) / 2;
  const gridStartY = CONTENT_TOP_PX + 20;

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

  const cell = Math.max(touchFloor, MATRIX_SLOT_CELL_PX);
  const slots: Slot[] = [];

  // Khung ma trận bên trái
  const matrixTotalW = gridSize * cell + (gridSize - 1) * SLOT_GAP_PX;
  const matrixTotalH = gridSize * cell + (gridSize - 1) * SLOT_GAP_PX;
  const matrixStartX = SAFE_MARGIN_PX;
  const matrixStartY =
    CONTENT_TOP_PX + Math.max(0, (availH - matrixTotalH) / 2);

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
  const trayStartY = CONTENT_TOP_PX + Math.max(0, (availH - trayTotalH) / 2);

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

  // Trong stage ngang (điện thoại nằm ngang) khay chọn đứng cạnh ma trận thay vì
  // dưới nó — chồng hai tầng ở sân khấu thấp làm ma trận tràn đỉnh.
  const sideBySide =
    input.inStage === true && availW >= availH * MATRIX_SIDE_BY_SIDE_ASPECT;
  const maxCellH = sideBySide
    ? Math.floor((availH - (gridSize - 1) * SLOT_GAP_PX) / gridSize)
    : Math.floor((availH - gridSize * SLOT_GAP_PX) / (gridSize + 1));
  const cell = Math.max(touchFloor, Math.min(MATRIX_3X3_CELL_PX, maxCellH));
  const matrixH = gridSize * cell + (gridSize - 1) * SLOT_GAP_PX;
  const matrixW = matrixH;

  const trayRegionW = sideBySide ? availW - matrixW - SLOT_GAP_PX : availW;
  const trayCols = Math.max(
    1,
    Math.min(
      slotCount,
      Math.floor((trayRegionW + SLOT_GAP_PX) / (cell + SLOT_GAP_PX))
    )
  );
  const trayRows = Math.max(1, Math.ceil(slotCount / trayCols));
  const trayH = trayRows * cell + (trayRows - 1) * SLOT_GAP_PX;

  const blockH = sideBySide ? matrixH : matrixH + SLOT_GAP_PX + trayH;
  const blockStartY = CONTENT_TOP_PX + Math.max(0, (availH - blockH) / 2);
  const matrixStartX = sideBySide
    ? SAFE_MARGIN_PX
    : SAFE_MARGIN_PX + (availW - matrixW) / 2;
  const trayRegionX = sideBySide
    ? SAFE_MARGIN_PX + matrixW + SLOT_GAP_PX
    : SAFE_MARGIN_PX;

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

  const trayStartY = sideBySide
    ? CONTENT_TOP_PX + Math.max(0, (availH - trayH) / 2)
    : blockStartY + matrixH + SLOT_GAP_PX;
  for (let o = 0; o < slotCount; o++) {
    const row = Math.floor(o / trayCols);
    const col = o % trayCols;
    const inRow = Math.min(trayCols, slotCount - row * trayCols);
    const rowW = inRow * cell + (inRow - 1) * SLOT_GAP_PX;
    const rowStartX = trayRegionX + (trayRegionW - rowW) / 2;
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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;
  const inStage = input.inStage === true;

  const card = Math.max(touchFloor, 64);
  const eqStartY = CONTENT_TOP_PX + 10;
  const eqGap = inStage ? SLOT_GAP_PX : 12;
  const optCols = inStage
    ? Math.max(
        1,
        Math.min(
          slotCount,
          Math.floor((availW + SLOT_GAP_PX) / (card + SLOT_GAP_PX))
        )
      )
    : Math.max(1, slotCount);
  const optRows = Math.ceil(Math.max(1, slotCount) / optCols);
  const optBlockH = optRows * card + (optRows - 1) * SLOT_GAP_PX;
  // Trong stage, hàng phương trình co lại (không dưới `EQUATION_ROW_MIN_H`) để
  // khay chọn không bị đẩy ra khỏi đáy; ngoài stage giữ công thức cũ.
  const rowH = inStage
    ? Math.max(
        EQUATION_ROW_MIN_H,
        Math.min(
          EQUATION_ROW_MAX_H,
          Math.floor(
            (availH - 10 - EQUATION_TRAY_GAP_PX - optBlockH) / eqCount - eqGap
          )
        )
      )
    : Math.min(EQUATION_ROW_MAX_H, Math.floor((availH * 0.6) / eqCount));

  const slots: Slot[] = [];
  // Slots cho phương trình. Trong stage, hàng phương trình chỉ để đọc nên vùng
  // chạm bằng đúng ô vẽ: sàn chạm làm vùng chạm cao hơn khoảng cách giữa hai
  // hàng và các hàng chồng nhau (`BR-LAY-05`).
  for (let i = 0; i < eqCount; i++) {
    const rowW = Math.round(availW * 0.8);
    slots.push({
      index: i,
      x: Math.round(SAFE_MARGIN_PX + availW / 2),
      y: Math.round(eqStartY + i * (rowH + eqGap) + rowH / 2),
      w: rowW,
      h: Math.round(rowH),
      hitW: rowW,
      hitH: inStage ? Math.round(rowH) : Math.max(touchFloor, rowH),
      page: 0,
      role: inStage ? "neutral" : "target",
    });
  }

  // Slots cho options; trong stage thì xuống hàng thay vì tràn ngang.
  const trayStartY = eqStartY + eqCount * (rowH + eqGap) + EQUATION_TRAY_GAP_PX;

  for (let o = 0; o < slotCount; o++) {
    const row = Math.floor(o / optCols);
    const col = o % optCols;
    const inRow = Math.min(optCols, slotCount - row * optCols);
    const rowTotalW = inRow * card + (inRow - 1) * SLOT_GAP_PX;
    const optStartX = SAFE_MARGIN_PX + Math.max(0, (availW - rowTotalW) / 2);
    slots.push({
      index: eqCount + o,
      x: Math.round(optStartX + col * (card + SLOT_GAP_PX) + card / 2),
      y: Math.round(trayStartY + row * (card + SLOT_GAP_PX) + card / 2),
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
