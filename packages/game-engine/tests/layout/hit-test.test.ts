import { describe, expect, it } from "vitest";
import { findHitSlotIndex, isPointInSlot } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";

function makeSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    index: 0,
    x: 100,
    y: 100,
    w: 40,
    h: 40,
    hitW: 40,
    hitH: 40,
    page: 0,
    role: "neutral",
    ...overrides,
  };
}

describe("isPointInSlot / findHitSlotIndex (BR-A11-04, BR-ENG-05)", () => {
  it("vùng chạm dùng hitW/hitH — sàn chạm tối thiểu — không dùng kích thước vẽ w/h", () => {
    // Kích thước vẽ (w/h) nhỏ hơn sàn chạm (hitW/hitH): trẻ vẫn phải chạm
    // trúng theo sàn chạm, không theo kích thước vật vẽ trên màn.
    const slot = makeSlot({ w: 20, h: 20, hitW: 100, hitH: 100 });

    // Cách tâm 45px: ngoài kích thước vẽ (20/2=10) rất xa, nhưng trong sàn
    // chạm (100/2=50).
    expect(isPointInSlot(slot, 145, 100, "circle", 0)).toBe(true);
  });

  it("tolerance cộng thêm vào bán kính sàn chạm, không phải bán kính vẽ", () => {
    const slot = makeSlot({ w: 20, h: 20, hitW: 100, hitH: 100 });
    // 50 (sàn chạm) + 10 (tolerance) = 60. Cách tâm 58px phải trúng.
    expect(isPointInSlot(slot, 158, 100, "circle", 10)).toBe(true);
    // Cách tâm 61px phải KHÔNG trúng (ngoài 60).
    expect(isPointInSlot(slot, 161, 100, "circle", 10)).toBe(false);
  });

  it("findHitSlotIndex chọn slot có tâm gần điểm chạm nhất khi nhiều slot đều thoả", () => {
    const slots: Slot[] = [
      makeSlot({ index: 0, x: 100, y: 100 }),
      makeSlot({ index: 1, x: 130, y: 100 }),
    ];
    // Điểm chạm gần slot 1 hơn (khoảng cách 10 so với 40).
    expect(findHitSlotIndex(slots, 120, 100, "circle", 30)).toBe(1);
  });

  it("chạm ngoài mọi slot trả -1", () => {
    const slots: Slot[] = [makeSlot({ index: 0, x: 100, y: 100 })];
    expect(findHitSlotIndex(slots, 5000, 5000, "circle", 24)).toBe(-1);
  });
});
