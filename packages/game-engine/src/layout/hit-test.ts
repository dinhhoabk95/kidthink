import type { Slot } from "./types.js";

/**
 * Dung sai chạm của mọi engine tap — khớp `input.tolerance_px: 24` khai trong
 * `template.ts`. Engine (`toAction()`) và bề mặt web (tìm entity để đọc lại từ
 * khoá) BẮT BUỘC dùng cùng số này: hai số khác nhau là một vành chạm chọn được
 * mà không đọc tên, hoặc ngược lại (Task #274, E5).
 */
export const TAP_TOLERANCE_PX = 24;

type HitShape = "circle" | "square";

/** Hộp chạm tối thiểu: tâm cộng kích thước vùng chạm. */
interface HitBox {
  readonly x: number;
  readonly y: number;
  readonly hitW: number;
  readonly hitH: number;
}

/** Hộp chạm của một entity bề mặt — entity chỉ mang kích thước vẽ `w`/`h`. */
interface EntityBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Hình vùng chạm, mặc định `circle` (token tròn). Khay chữ nhật: `square`. */
  readonly hitShape?: HitShape;
}

/**
 * Bình phương khoảng cách từ điểm chạm tới tâm hộp nếu điểm nằm trong vùng
 * chạm, `null` nếu nằm ngoài. Một công thức cho mọi đường tìm điểm trúng.
 */
function hitDistanceSq(
  box: HitBox,
  x: number,
  y: number,
  shape: HitShape,
  tolerance: number
): number | null {
  const dx = x - box.x;
  const dy = y - box.y;
  const distSq = dx * dx + dy * dy;

  if (shape === "circle") {
    const radius = Math.min(box.hitW, box.hitH) / 2 + tolerance;
    return distSq <= radius * radius ? distSq : null;
  }

  const halfW = box.hitW / 2 + tolerance;
  const halfH = box.hitH / 2 + tolerance;
  return Math.abs(dx) <= halfW && Math.abs(dy) <= halfH ? distSq : null;
}

function findNearestHitIndex(
  boxes: readonly (HitBox | undefined)[],
  x: number,
  y: number,
  shape: HitShape,
  tolerance: number
): number {
  let bestIndex = -1;
  let minDistanceSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (!box) {
      continue;
    }
    const distSq = hitDistanceSq(box, x, y, shape, tolerance);
    if (distSq !== null && distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestIndex = i;
    }
  }
  return bestIndex;
}

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
 * `shape` phải khớp hình đang vẽ (`drawSlotItem(..., shape)`): token tròn thì
 * `circle`, thẻ vuông thì `square`.
 */
export function isPointInSlot(
  slot: Slot,
  x: number,
  y: number,
  shape: HitShape = "circle",
  tolerance = 6
): boolean {
  return hitDistanceSq(slot, x, y, shape, tolerance) !== null;
}

/**
 * Tìm chỉ số slot trúng điểm (x, y). Nếu có nhiều slot thoả mãn (ví dụ gần nhau),
 * ưu tiên slot có tâm gần điểm chạm nhất.
 */
export function findHitSlotIndex(
  slots: readonly Slot[],
  x: number,
  y: number,
  shape: HitShape = "circle",
  tolerance = 6
): number {
  return findNearestHitIndex(slots, x, y, shape, tolerance);
}

/**
 * Entity bề mặt bị chạm tại (x, y) — cùng công thức hình tròn và cùng
 * `TAP_TOLERANCE_PX` với `toAction()` của engine tap, trên kích thước entity
 * (`w`/`h`, bằng `hitW`/`hitH` của slot ở mọi layout hiện có). Nhiều entity
 * cùng thoả thì lấy entity có tâm gần nhất.
 */
export function findHitEntity<T extends EntityBox>(
  entities: readonly T[],
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): T | null {
  let bestIndex = -1;
  let minDistanceSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    if (!entity) {
      continue;
    }
    const distSq = hitDistanceSq(
      { x: entity.x, y: entity.y, hitW: entity.w, hitH: entity.h },
      x,
      y,
      entity.hitShape ?? "circle",
      tolerance
    );
    if (distSq !== null && distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestIndex = i;
    }
  }
  return entities[bestIndex] ?? null;
}
