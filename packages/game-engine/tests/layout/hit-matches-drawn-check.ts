import type { ViewEntity } from "#src/interaction";
import type { Slot } from "#src/layout/types";

/** Sai số làm tròn khi so toạ độ vẽ với toạ độ vùng chạm và mép vùng. */
const EPSILON_PX = 1;

type FindHit = (
  entities: readonly ViewEntity[],
  x: number,
  y: number
) => ViewEntity | null;

function sameCentre(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) <= EPSILON_PX && Math.abs(a.y - b.y) <= EPSILON_PX;
}

/**
 * Loại lỗi của GT-025: vật vẽ ở một chỗ, vùng chạm ở chỗ khác. Với mỗi entity:
 * (1) cùng tâm với slot đã vẽ, (2) chạm vào tâm thì phép tìm entity của bề mặt web trả về chính tâm đó.
 */
export function findHitMismatches(
  entities: readonly ViewEntity[],
  slots: readonly Slot[],
  findHit: FindHit
): string[] {
  const found: string[] = [];
  for (const entity of entities) {
    const slot = slots[entity.slotIndex];
    if (slot && !sameCentre(slot, entity)) {
      found.push(
        `${entity.id} vẽ (${entity.x}, ${entity.y}) lệch slot (${slot.x}, ${slot.y})`
      );
    }
    const hit = findHit(entities, entity.x, entity.y);
    if (!(hit && sameCentre(hit, entity))) {
      found.push(`${entity.id} chạm vào tâm trúng ${hit?.id ?? "không ai"}`);
    }
  }
  return found;
}
