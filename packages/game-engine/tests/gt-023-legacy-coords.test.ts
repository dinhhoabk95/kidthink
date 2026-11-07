import { describe, expect, it } from "vitest";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types.js";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";

function overlaps(a: Slot, b: Slot): boolean {
  return (
    Math.abs(a.x - b.x) < (a.hitW + b.hitW) / 2 &&
    Math.abs(a.y - b.y) < (a.hitH + b.hitH) / 2
  );
}

describe("GT-023: khung không stage — neo và khay cùng một hệ toạ độ (BR-E023-09)", () => {
  for (const [i, fixture] of GT023_FIXTURES.entries()) {
    it(`fixture #${i}: neo là slot của layout, không chồng khay, thả đúng vị trí vẽ`, () => {
      const session = new GT023Session(fixture.content, fixture.difficulty);
      session.prepareRound("4-5");
      const { entities } = session.getView();
      const sources = session.sourceSlots;
      const targets = session.targetSlots;
      expect(targets.length).toBe(fixture.content.anchors.length);

      for (const [k, anchor] of fixture.content.anchors.entries()) {
        const slot = targets[k];
        if (!slot) {
          throw new Error("thiếu slot neo");
        }
        const entity = entities.find(
          (e) => e.role === "target" && e.slotIndex === slot.index
        );
        // Thực thể neo đứng đúng slot của layout (cùng hệ với khay).
        expect(entity?.x).toBe(slot.x);
        expect(entity?.y).toBe(slot.y);
        for (const src of sources) {
          expect(overlaps(slot, src)).toBe(false);
        }
        // Thả mảnh đúng từ khay vào tâm neo vẽ ra thì trúng đúng neo đó.
        const partIndex = fixture.content.parts.findIndex(
          (p) => p.part_id === anchor.accepted_part_id
        );
        const part = fixture.content.parts[partIndex];
        const srcSlot = sources[partIndex];
        if (!(part && srcSlot)) {
          throw new Error("thiếu mảnh");
        }
        const action = session.toAction({
          type: "drop",
          fromX: srcSlot.x,
          fromY: srcSlot.y,
          toX: slot.x,
          toY: slot.y,
          timeMs: 0,
        });
        expect(action?.data).toMatchObject({
          item_id: part.part_id,
          target_id: anchor.anchor_id,
        });
      }
    });
  }

  it("onSnapPart sau khi dựng slot chỉ hút vào ô neo vẽ ra, không rơi về toạ độ content", () => {
    let farChecked = 0;
    for (const fixture of GT023_FIXTURES) {
      const session = new GT023Session(fixture.content, fixture.difficulty);
      session.prepareRound("4-5");
      // Cùng bán kính với `findHitAnchor`: sàn hút 64 px cộng dung sai chạm.
      const radius =
        Math.max(fixture.difficulty.snap_radius_px, 64) + TAP_TOLERANCE_PX;
      for (const [k, anchor] of fixture.content.anchors.entries()) {
        const slot = session.targetSlots[k];
        if (!slot) {
          throw new Error("thiếu slot neo");
        }
        // Toạ độ content xa mọi ô neo: thả ở đó là thả vào chỗ trống.
        const nearSomeSlot = session.targetSlots.some(
          (t) => Math.hypot(t.x - anchor.x, t.y - anchor.y) <= radius
        );
        if (!nearSomeSlot) {
          expect(
            session.onSnapPart(anchor.accepted_part_id, anchor.x, anchor.y)
          ).toBeNull();
          farChecked++;
        }
      }
      const first = fixture.content.anchors[0];
      const slot = session.targetSlots[0];
      if (!(first && slot)) {
        throw new Error("thiếu neo đầu");
      }
      expect(
        session.onSnapPart(first.accepted_part_id, slot.x, slot.y)
          ?.isAnchorMatch
      ).toBe(true);
    }
    // Không có toạ độ content nào xa ô neo thì ca này không đo gì.
    expect(farChecked).toBeGreaterThan(0);
  });
});
