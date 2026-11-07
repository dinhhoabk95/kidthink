import { describe, expect, it } from "vitest";
import { GT037Session } from "#src/templates/GT-037/session";
import type { GT037Content } from "#src/templates/GT-037/template";

/**
 * Task #313 — GT-037: ký hiệu gây nhầm giảm theo band (`BR-E037-11`).
 * 3-4 không có ký hiệu dễ nhầm, 4-5 tối đa 2, 5-6 đủ.
 */
const CONTENT: GT037Content = {
  prompt: "Con tìm hết chữ b nhé",
  symbols: [
    { id: "t", asset: { kind: "text" as const, text: "b" } },
    { id: "c1", asset: { kind: "text" as const, text: "d" } },
    { id: "c2", asset: { kind: "text" as const, text: "p" } },
    { id: "c3", asset: { kind: "text" as const, text: "q" } },
    { id: "n1", asset: { kind: "text" as const, text: "o" } },
    { id: "n2", asset: { kind: "text" as const, text: "x" } },
  ],
  target_ids: ["t"],
  target_copies: 3,
  item_count: 12,
  confusable_ids: ["c1", "c2", "c3"],
};
const CONFUSABLE = new Set(CONTENT.confusable_ids);

function confusablesOn(band: "3-4" | "4-5" | "5-6", seed: number): Set<string> {
  const session = new GT037Session(CONTENT, {}, seed);
  session.prepareRound(band);
  return new Set(
    session.boardSymbols.map((s) => s.id).filter((id) => CONFUSABLE.has(id))
  );
}

describe("GT-037 — ký hiệu gây nhầm giảm theo band (BR-E037-11)", () => {
  it("3-4: bảng không có ký hiệu gây nhầm nào, ở mọi seed", () => {
    for (let seed = 0; seed < 20; seed++) {
      expect([...confusablesOn("3-4", seed)]).toEqual([]);
    }
  });

  it("4-5: đúng hai ký hiệu gây nhầm đầu danh sách, ở mọi seed", () => {
    for (let seed = 0; seed < 20; seed++) {
      expect([...confusablesOn("4-5", seed)].sort()).toEqual(["c1", "c2"]);
    }
  });

  it("5-6: đủ ba ký hiệu gây nhầm", () => {
    for (let seed = 0; seed < 20; seed++) {
      expect([...confusablesOn("5-6", seed)].sort()).toEqual([
        "c1",
        "c2",
        "c3",
      ]);
    }
  });

  it("số bản sao đích và tổng ký hiệu không đổi vì bớt gây nhầm", () => {
    const session = new GT037Session(CONTENT, {}, 3);
    session.prepareRound("3-4");
    expect(session.boardSymbols).toHaveLength(session.itemCount);
    expect(session.boardSymbols.filter((s) => s.id === "t")).toHaveLength(3);
  });

  it("đổi band giữa lượt vẫn giữ ô đã khoanh (BR-E037-08)", () => {
    const session = new GT037Session(CONTENT, {}, 3);
    session.prepareRound("5-6");
    const idx = session.boardSymbols.findIndex((s) => s.id === "t");
    const slot = session.slots[idx];
    if (!slot) {
      throw new Error("Thiếu ô");
    }
    session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 1 });
    session.resolveSlots("3-4");
    expect(session.foundTargets.size).toBe(1);
    expect(
      [...session.foundTargets].map((i) => session.boardSymbols[i]?.id)
    ).toEqual(["t"]);
  });
});
