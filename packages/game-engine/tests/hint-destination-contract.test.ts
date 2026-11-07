import { describe, expect, it } from "vitest";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures";
import { GT036Session } from "#src/templates/GT-036/session";

/** Task #313 R2 — hợp đồng gợi ý nguồn/đích của GT-029 (BR-E029-08) và GT-036 (BR-E036-12). */
describe("GT-036: gợi ý kéo phần tử từ bảng vào ô dải (BR-E036-12)", () => {
  const f = GT036_FIXTURES[0];
  if (!f) {
    throw new Error("Missing GT036 fixture");
  }

  it("chưa cầm đúng phần tử: nguồn là bảng, đích là ô dải", () => {
    const session = new GT036Session(f.content, f.difficulty, "5-6");
    session.prepareRound("5-6");
    const [first, second] = f.content.palette;
    if (!(first && second)) {
      throw new Error("Palette too small");
    }
    // Ô 0 đã đặt phần tử đầu; ô 1 cần phần tử khác loại, trẻ đang cầm phần tử đầu.
    session.commit({
      type: "place_element",
      data: { slotIndex: 0, elementId: first.id },
    });
    const hint = session.getHintTarget();
    const track = f.content.track_length;
    expect(hint).toEqual({
      kind: "slot",
      index: track + 1,
      toIndex: 1,
    });
  });

  it("đã cầm đúng phần tử: chỉ trỏ ô, không có đích", () => {
    const session = new GT036Session(f.content, f.difficulty, "5-6");
    session.prepareRound("5-6");
    const hint = session.getHintTarget();
    expect(hint).toEqual({ kind: "slot", index: 0 });
    expect(session.getHintDestinationIndex()).toBeNull();
  });
});

describe("GT-029: gợi ý bớt vật chỉ chạm (BR-E029-08)", () => {
  const f = GT029_FIXTURES[0];
  if (!f) {
    throw new Error("Missing GT029 fixture");
  }

  it("còn lượt bớt: có nguồn, không có đích", () => {
    const session = new GT029Session(f.content, f.difficulty);
    session.prepareRound("3-4");
    expect(session.getHintTargetIndex()).not.toBeNull();
    expect(session.getHintDestinationIndex()).toBeNull();
    expect(session.getHintTarget()?.kind).toBe("slot");
    const hint = session.getHintTarget();
    expect(
      hint && "toIndex" in hint ? hint.toIndex : undefined
    ).toBeUndefined();
  });
});
