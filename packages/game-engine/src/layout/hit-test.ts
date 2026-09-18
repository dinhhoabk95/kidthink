import type { Slot } from "./types.js";

/**
 * Kiểm tra điểm (x, y) có nằm trong vùng hit của Slot hay không.
 *
 * Vùng hit dựa trên `hitW`/`hitH` — sàn chạm tối thiểu theo band tuổi
 * (`BR-A11-04`, `BR-ENG-05`), KHÔNG dựa trên `w`/`h` (kích thước vẽ). Hai giá
 * trị này trùng nhau ở mọi layout hiện có vì `w`/`h` đã bị kẹp không dưới sàn
 * chạm, nhưng vùng chạm phải theo đúng trường có nghĩa là "vùng chạm" —
 * layout nào sau này vẽ nhỏ hơn sàn chạm (để dày đặc hơn) mà không mở rộng
 * cũng phải vẫn chạm được đúng sàn.
 *
 * Mặc định kiểm tra khoảng cách hình tròn (Euclid) với dung sai nhẹ 6px,
 * tránh click ở góc chéo ngoài rìa hình tròn vẫn dính event.
 */
export function isPointInSlot(
  slot: Slot,
  x: number,
  y: number,
  shape: "circle" | "square" = "circle",
  tolerance = 6
): boolean {
  const dx = x - slot.x;
  const dy = y - slot.y;

  if (shape === "circle") {
    const radius = Math.min(slot.hitW, slot.hitH) / 2 + tolerance;
    return dx * dx + dy * dy <= radius * radius;
  }

  const halfW = slot.hitW / 2 + tolerance;
  const halfH = slot.hitH / 2 + tolerance;
  return Math.abs(dx) <= halfW && Math.abs(dy) <= halfH;
}

/**
 * Tìm chỉ số slot trúng điểm (x, y). Nếu có nhiều slot thoả mãn (ví dụ gần nhau),
 * ưu tiên slot có tâm gần điểm chạm nhất.
 */
export function findHitSlotIndex(
  slots: readonly Slot[],
  x: number,
  y: number,
  shape: "circle" | "square" = "circle",
  tolerance = 6
): number {
  let bestIndex = -1;
  let minDistanceSq = Number.POSITIVE_INFINITY;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot) {
      continue;
    }

    const dx = x - slot.x;
    const dy = y - slot.y;
    const distSq = dx * dx + dy * dy;

    if (shape === "circle") {
      const radius = Math.min(slot.hitW, slot.hitH) / 2 + tolerance;
      if (distSq <= radius * radius && distSq < minDistanceSq) {
        minDistanceSq = distSq;
        bestIndex = i;
      }
    } else {
      const halfW = slot.hitW / 2 + tolerance;
      const halfH = slot.hitH / 2 + tolerance;
      if (
        Math.abs(dx) <= halfW &&
        Math.abs(dy) <= halfH &&
        distSq < minDistanceSq
      ) {
        minDistanceSq = distSq;
        bestIndex = i;
      }
    }
  }

  return bestIndex;
}
