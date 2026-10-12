/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: geometry calculations */
import type { AgeBand } from "#src/contracts/types";
import {
  CONTENT_TOP_PX,
  DEFAULT_LOGIC_SPACE,
  JITTER_MAX_PX,
  type LogicSpace,
  resolveTouchFloor,
  SAFE_MARGIN_PX,
  SCATTER_BOARD_OCCUPANCY_MAX,
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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

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
      inStage: input.inStage === true,
      slotCount,
      clueCount,
      touchFloor,
      availW,
      boardZoneH,
      boardStartY: CONTENT_TOP_PX + clueZoneH + SLOT_GAP_PX,
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
  const centerY = CONTENT_TOP_PX + clueZoneH / 2;

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
  inStage: boolean;
  slotCount: number;
  clueCount: number;
  touchFloor: number;
  availW: number;
  boardZoneH: number;
  boardStartY: number;
}): Slot[] {
  const {
    inStage,
    slotCount,
    clueCount,
    touchFloor,
    availW,
    boardZoneH,
    boardStartY,
  } = args;
  const maxColsByTouch = Math.max(
    1,
    Math.floor((availW + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX))
  );
  let cols = Math.max(
    1,
    Math.min(
      CLUE_BOARD_MAX_COLS,
      maxColsByTouch,
      slotCount <= CLUE_BOARD_MAX_COLS ? slotCount : Math.ceil(slotCount / 2)
    )
  );
  // Vùng bảng thấp (điện thoại ngang): thêm cột trước khi để hàng tràn xuống
  // dưới đáy — thẻ không co dưới sàn chạm nên số hàng là thứ duy nhất chỉnh được.
  const fitsHeight = (rowCount: number): boolean =>
    rowCount * touchFloor + (rowCount - 1) * SLOT_GAP_PX <= boardZoneH;
  while (
    inStage &&
    cols < Math.min(maxColsByTouch, slotCount) &&
    !fitsHeight(Math.ceil(slotCount / cols))
  ) {
    cols += 1;
  }
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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

  const slots: Slot[] = [];

  // Vùng làm việc chính bên trên chia đôi trục dọc (x = 480 là trục đối xứng)
  const mainH = Math.floor(availH * 0.65);
  const halfW = Math.floor((availW - SLOT_GAP_PX * 2) / 2);
  const cell = Math.max(touchFloor, 72);

  // 1. Mẫu đối xứng bên trái (Neutral / Reference)
  slots.push({
    index: 0,
    x: Math.round(SAFE_MARGIN_PX + halfW / 2),
    y: Math.round(CONTENT_TOP_PX + mainH / 2),
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
        CONTENT_TOP_PX + 20 + row * (cell + SLOT_GAP_PX) + cell / 2
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
  const trayStartY = CONTENT_TOP_PX + mainH + 16;
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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;
  const cell = Math.max(touchFloor, 64);

  // Phân bố đều lưới mở rộng làm các điểm neo trong khung cảnh
  let cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(slotCount))));
  if (input.inStage) {
    // Trong stage: không nhiều cột hơn số vùng chạm ở sàn xếp vừa bề ngang, rồi
    // thêm cột chừng nào hàng còn tràn đáy — ô không co dưới sàn chạm nên chỉ
    // số cột chỉnh được (`BR-LAY-05`, `BR-PSZ-04`).
    // Mỗi ô neo ở giữa một ngăn rộng `availW / cols`, nên ngăn phải chứa cả vùng
    // chạm lẫn một khe: cột `cols` cần `cols * (sàn + khe)` ≤ `availW`.
    const maxColsByTouch = Math.max(
      1,
      Math.floor(availW / (touchFloor + SLOT_GAP_PX))
    );
    cols = Math.min(cols, maxColsByTouch);
    const rowsFit = (rowCount: number): boolean =>
      rowCount * (touchFloor + SLOT_GAP_PX) <= availH;
    while (
      cols < Math.min(maxColsByTouch, slotCount) &&
      !rowsFit(Math.ceil(slotCount / cols))
    ) {
      cols += 1;
    }
  }
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
      y: Math.round(CONTENT_TOP_PX + r * rowStep + rowStep / 2),
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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
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
    CONTENT_TOP_PX + 16,
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

/**
 * Tính số lượng ô ứng viên tối đa của bố cục scatter-board (GT-037).
 */
export function scatterBoardCandidateCellCount(
  ageBand: AgeBand,
  logic?: LogicSpace,
  jitterMaxPx: number = JITTER_MAX_PX
): number {
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } = logic ?? DEFAULT_LOGIC_SPACE;
  const touchFloor = resolveTouchFloor(ageBand);
  const cellStep = touchFloor + SLOT_GAP_PX + 2 * jitterMaxPx;
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;
  const cols = Math.floor(availW / cellStep);
  const rows = Math.floor(availH / cellStep);
  return Math.max(0, cols * rows);
}

/**
 * Tính sức chứa tối đa của bố cục scatter-board (GT-037).
 * Sức chứa = 85% số ô ứng viên (ô dư >= 15% để bảng không đọc ra hàng-cột theo BR-E037).
 */
export function scatterBoardCapacity(
  ageBand: AgeBand,
  logic?: LogicSpace,
  jitterMaxPx: number = JITTER_MAX_PX
): number {
  const candidateCount = scatterBoardCandidateCellCount(
    ageBand,
    logic,
    jitterMaxPx
  );
  return Math.floor(candidateCount * SCATTER_BOARD_OCCUPANCY_MAX);
}

/**
 * Bố cục bảng rải ký hiệu (scatter-board) — `GT-037` (BR-LAY-11, BR-E037-03).
 *
 * Hàm layout thuần trả về toàn bộ các ô ứng viên vừa trong vùng chơi logic.
 * Mỗi ô có bước = hit + SLOT_GAP_PX + 2 * JITTER_MAX_PX.
 * Cấm phân trang: ném LAYOUT_CAPACITY_EXCEEDED nếu slotCount vượt quá sức chứa.
 */
export function computeScatterBoardLayout(
  input: LayoutInput,
  options?: {
    jitterMaxPx?: number;
  }
): Slot[] {
  const { h: LOGIC_HEIGHT, w: LOGIC_WIDTH } =
    input.logic ?? DEFAULT_LOGIC_SPACE;
  const { slotCount, ageBand } = input;
  if (slotCount <= 0) {
    return [];
  }

  const jitterMax = options?.jitterMaxPx ?? JITTER_MAX_PX;
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const cellStep = touchFloor + SLOT_GAP_PX + 2 * jitterMax;

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

  const cols = Math.floor(availW / cellStep);
  const rows = Math.floor(availH / cellStep);
  const totalCandidateCells = Math.max(0, cols * rows);

  const maxCapacity = Math.floor(
    totalCandidateCells * SCATTER_BOARD_OCCUPANCY_MAX
  );

  if (slotCount > maxCapacity) {
    throw new Error(
      `LAYOUT_CAPACITY_EXCEEDED: slotCount ${slotCount} vượt quá sức chứa ${maxCapacity} của scatter-board cho band ${ageBand} (BR-LAY-11).`
    );
  }

  const totalGridW = cols * cellStep;
  const totalGridH = rows * cellStep;
  const startX = SAFE_MARGIN_PX + (availW - totalGridW) / 2;
  const startY = CONTENT_TOP_PX + (availH - totalGridH) / 2;

  const slots: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      slots.push({
        index: idx,
        x: Math.round(startX + c * cellStep + cellStep / 2),
        y: Math.round(startY + r * cellStep + cellStep / 2),
        w: Math.round(touchFloor),
        h: Math.round(touchFloor),
        hitW: Math.round(touchFloor),
        hitH: Math.round(touchFloor),
        page: 0,
        role: "neutral",
      });
    }
  }

  return slots;
}
