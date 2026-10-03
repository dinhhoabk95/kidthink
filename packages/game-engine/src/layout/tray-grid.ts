/**
 * Lưới vật trong khay (`play-stage-zones.md`, `BR-PSZ-13`): khay **nhiều hàng**,
 * không phân trang. `computeStageZones` dùng để đo chiều cao khay theo số vật,
 * `computeTraySourceSlots` dùng để đặt từng vật — cả hai đọc cùng một hàm nên
 * khay shell cấp và slot engine đặt không bao giờ lệch hàng.
 *
 * Hàm thuần: chỉ đọc số vật, bề rộng khay và cạnh sàn chạm (`BR-PSZ-02`).
 */

import { SLOT_GAP_PX } from "./constants.js";

/** Đệm hai bên của khay dải và khay cột: dock gỗ vẽ ôm slot cần chỗ này. */
export const TRAY_PAD_X_PX = 16;

/** Đệm trên và dưới của khay dải. */
export const TRAY_PAD_Y_PX = 6;

/**
 * Dải nhãn dưới mỗi hàng vật khi vật trong khay có nhãn vẽ dưới thân
 * (`drawSlotLabel`: GT-031 giá xu, GT-033 tên màu). Không chừa thì nhãn rơi ra
 * ngoài dock hoặc ra ngoài canvas ở hàng cuối.
 */
export const TRAY_LABEL_ROW_PX = 36;

export interface TrayGrid {
  /** Số vật tối đa trên một hàng. */
  readonly perRow: number;
  readonly rows: number;
}

/** Số vật một hàng chứa được khi mỗi vật chiếm `edge` và cách nhau `SLOT_GAP_PX`. */
export function trayItemsPerRow(trayW: number, edge: number): number {
  const avail = trayW - 2 * TRAY_PAD_X_PX;
  return Math.max(1, Math.floor((avail + SLOT_GAP_PX) / (edge + SLOT_GAP_PX)));
}

/**
 * Chia `items` vật vào các hàng của khay rộng `trayW`. Số hàng là ít nhất để
 * chứa hết; số vật mỗi hàng cân lại cho đều (10 vật, 4 chỗ một hàng: 3 hàng
 * 4-3-3 thay vì 4-4-2) nhưng không vượt sức chứa một hàng.
 */
export function layoutTrayGrid(
  items: number,
  trayW: number,
  edge: number
): TrayGrid {
  const count = Math.max(0, Math.floor(items));
  if (count === 0) {
    return { perRow: 1, rows: 1 };
  }
  const capacity = trayItemsPerRow(trayW, edge);
  const rows = Math.ceil(count / capacity);
  return { perRow: Math.ceil(count / rows), rows };
}

/** Chiều cao khay dải cho `rows` hàng vật cạnh `edge`, mỗi hàng thêm `labelH` cho nhãn. */
export function trayHeightForRows(
  rows: number,
  edge: number,
  labelH = 0
): number {
  return rows * (edge + labelH) + (rows - 1) * SLOT_GAP_PX + 2 * TRAY_PAD_Y_PX;
}

/** Bề rộng khay cột chứa đúng `cols` cột vật cạnh `edge`. */
export function trayWidthForCols(cols: number, edge: number): number {
  return cols * edge + (cols - 1) * SLOT_GAP_PX + 2 * TRAY_PAD_X_PX;
}
