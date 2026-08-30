/**
 * `balanceSystem` — tính toán trọng lượng 2 đĩa cân, độ lệch và góc nghiêng đòn cân.
 * Mục 7.4 của [`montessori-template-batch.md`](../../../../docs/specs/01-platform/montessori-template-batch.md).
 *
 * System này **độc lập với khuôn** (`BR-MTB-15`): không phụ thuộc vào Zod
 * hay bất kỳ file nào trong `templates/`.
 *
 * Phản hồi liên tục (continuous tilt) nằm ở tầng render; `checkWinCondition()`
 * luôn là nhị phân (D-RO).
 */

export interface WeightedItem {
  readonly item_id: string;
  readonly weight: number;
}

export type BalanceState = "balanced" | "left_heavy" | "right_heavy";

export const MAX_TILT_ANGLE_DEG = 25;

/** Tính tổng trọng lượng danh sách vật thể. */
export function sumWeights(items: readonly WeightedItem[]): number {
  return items.reduce((acc, item) => acc + item.weight, 0);
}

/**
 * Tính góc nghiêng đòn cân (độ).
 * - Dương: đĩa phải nặng hơn (nghiêng xuống bên phải).
 * - Âm: đĩa trái nặng hơn (nghiêng xuống bên trái).
 * - 0: cân bằng ngang.
 */
export function computeTiltAngle(
  totalLeft: number,
  totalRight: number,
  maxAngleDeg = MAX_TILT_ANGLE_DEG
): number {
  const delta = totalRight - totalLeft;
  if (delta === 0) {
    return 0;
  }

  // Sử dụng hàm sigmoid/tanh hoặc tuyến tính bão hoà
  // Mỗi 1 đơn vị chênh lệch tạo ~5 độ nghiêng, bão hoà ở maxAngleDeg
  const rawAngle = delta * 5;
  return Math.max(-maxAngleDeg, Math.min(maxAngleDeg, rawAngle));
}

/** Xác định trạng thái cân: balanced, left_heavy, right_heavy. */
export function getBalanceState(
  totalLeft: number,
  totalRight: number
): BalanceState {
  if (totalLeft === totalRight) {
    return "balanced";
  }
  return totalLeft > totalRight ? "left_heavy" : "right_heavy";
}

/**
 * Kiểm tra xem có tồn tại tập con của tray để thêm vào (left, right) nhằm đạt cân bằng không.
 */
export function canAchieveBalance(
  initialLeft: readonly WeightedItem[],
  initialRight: readonly WeightedItem[],
  tray: readonly WeightedItem[]
): boolean {
  const baseLeft = sumWeights(initialLeft);
  const baseRight = sumWeights(initialRight);

  // Đệ quy thử mọi cách phân bổ từng vật phẩm trong tray: vào left, vào right, hoặc để nguyên trong tray
  function search(
    idx: number,
    currentLeft: number,
    currentRight: number
  ): boolean {
    if (currentLeft === currentRight) {
      return true;
    }
    if (idx === tray.length) {
      return currentLeft === currentRight;
    }

    const item = tray[idx];
    if (!item) {
      return currentLeft === currentRight;
    }
    const itemWeight = item.weight;
    // Cách 1: Cho vào đĩa trái
    if (search(idx + 1, currentLeft + itemWeight, currentRight)) {
      return true;
    }
    // Cách 2: Cho vào đĩa phải
    if (search(idx + 1, currentLeft, currentRight + itemWeight)) {
      return true;
    }
    // Cách 3: Giữ nguyên trong khay
    if (search(idx + 1, currentLeft, currentRight)) {
      return true;
    }

    return false;
  }

  return search(0, baseLeft, baseRight);
}
