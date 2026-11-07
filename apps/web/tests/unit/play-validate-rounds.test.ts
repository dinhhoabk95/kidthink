import { describe, expect, it } from "vitest";
import { findInvalidRound } from "~/composables/play/validate-rounds";

/** Task #313 B3 — mọi round phải qua contract trước khi chơi, không chỉ round 0. */
const GOOD = {
  prompt: "Tìm quả táo màu đỏ",
  target_item: { item_id: "t", asset: { kind: "emoji", ref: "🍎" } },
  options: [
    { item_id: "a", asset: { kind: "emoji", ref: "🍎" }, is_correct: true },
    { item_id: "b", asset: { kind: "emoji", ref: "🍌" }, is_correct: false },
  ],
};

describe("Task #313 B3 — findInvalidRound", () => {
  it("trả null khi mọi round hợp lệ", () => {
    expect(
      findInvalidRound("GT-001", [
        { round_index: 0, content_pack: GOOD },
        { round_index: 1, content_pack: GOOD },
      ])
    ).toBeNull();
  });

  it("trả chỉ số round sau bị hỏng, không chỉ round 0", () => {
    expect(
      findInvalidRound("GT-001", [
        { round_index: 0, content_pack: GOOD },
        { round_index: 1, content_pack: { prompt: "thiếu options" } },
      ])
    ).toBe(1);
  });
});
