/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: geometry calculations */
import {
  CONTENT_TOP_PX,
  DEFAULT_LOGIC_SPACE,
  resolveTouchFloor,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "./constants.js";
import type { LayoutInput, Slot } from "./types.js";

interface FitInput {
  readonly slotCount: number;
  readonly preferredCols: number;
  readonly fixedCols?: number;
  /** Số cột tối đa mà bề ngang chứa được ở sàn chạm. */
  readonly fitCols: number;
  /** Số hàng tối đa mà chiều cao chứa được ở sàn chạm. */
  readonly fitRows: number;
}

/**
 * Chọn số cột và hàng để mọi ô vào một trang (`BR-PSZ-13`): bắt đầu từ số cột
 * ưa thích, tăng cột (trừ khi cố định) tới khi số hàng vừa chiều cao. Không
 * vừa dù đã đủ cột thì giữ số hàng tối đa — phần dư còn phân trang và được đo
 * như nợ.
 */
function fitWithoutPaging(input: FitInput): { cols: number; rows: number } {
  const { slotCount, fitCols, fitRows } = input;
  let cols = Math.max(1, Math.min(input.preferredCols, fitCols));
  let rows = Math.ceil(slotCount / cols);
  while (rows > fitRows && !input.fixedCols && cols < fitCols) {
    cols += 1;
    rows = Math.ceil(slotCount / cols);
  }
  return { cols, rows: Math.max(1, Math.min(rows, fitRows)) };
}

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

  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const minW = touchFloor;
  const minH = touchFloor;

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

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

  let targetRows = options?.fixedRows
    ? Math.min(options.fixedRows, maxPossibleRows)
    : Math.max(1, Math.min(maxPossibleRows, Math.ceil(slotCount / targetCols)));
  if (input.inStage) {
    // Trong sân khấu không phân trang (`BR-PSZ-13`): số hàng chỉ bị chặn bởi
    // chiều cao thật, số cột nới tới khi mọi ô vừa một trang. Chỉ khi cả cột
    // lẫn hàng đã tới sàn chạm mà vẫn không đủ chỗ thì mới còn trang sau.
    const fit = fitWithoutPaging({
      slotCount,
      preferredCols: Math.max(
        targetCols,
        options?.fixedRows ? Math.ceil(slotCount / options.fixedRows) : 1
      ),
      fixedCols: options?.fixedCols,
      fitCols: Math.max(
        1,
        Math.floor((availW + SLOT_GAP_PX) / (minW + SLOT_GAP_PX))
      ),
      fitRows: Math.max(
        1,
        Math.floor((availH + SLOT_GAP_PX) / (minH + SLOT_GAP_PX))
      ),
    });
    targetCols = fit.cols;
    targetRows = fit.rows;
  }

  const itemsPerPage = targetCols * targetRows;
  const roundToFit = input.inStage ? Math.floor : (value: number) => value;
  const slotW = Math.max(
    minW,
    Math.min(
      120,
      roundToFit((availW - (targetCols - 1) * SLOT_GAP_PX) / targetCols)
    )
  );
  const slotH = Math.max(
    minH,
    Math.min(
      120,
      roundToFit((availH - (targetRows - 1) * SLOT_GAP_PX) / targetRows)
    )
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
    const startY = CONTENT_TOP_PX + (availH - totalGridH) / 2;

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

  const slots: Slot[] = [];

  if (options.orientation === "vertical") {
    // Nguồn ở trên, Đích ở dưới
    const zoneH = (availH - SLOT_GAP_PX) / 2;
    const topStartY = CONTENT_TOP_PX;
    const botStartY = CONTENT_TOP_PX + zoneH + SLOT_GAP_PX;

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
    const sourceStartY = CONTENT_TOP_PX + (availH - totalSourceH) / 2;

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
    const targetStartY = CONTENT_TOP_PX + (availH - totalTargetH) / 2;

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
  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);

  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

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
    const cy = CONTENT_TOP_PX + topZoneH / 2;
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
    CONTENT_TOP_PX + topZoneH + (availH - topZoneH - bucketH) / 2;

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

  const touchFloor = resolveTouchFloor(ageBand, input.cssPerLogic);
  const availW = LOGIC_WIDTH - 2 * SAFE_MARGIN_PX;
  const availH = LOGIC_HEIGHT - CONTENT_TOP_PX - SAFE_MARGIN_PX;

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
    const centerY = CONTENT_TOP_PX + availH / 2;
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
