import { describe, expect, it } from "vitest";
import { GT037Session } from "#src/templates/GT-037/session";
import type { GT037Content } from "#src/templates/GT-037/template";

const CONTENT: GT037Content = {
  prompt: "Con tìm hết số 3 nhé",
  symbols: [
    { id: "t", asset: { kind: "text" as const, text: "3" } },
    { id: "c1", asset: { kind: "text" as const, text: "8" } },
    { id: "c2", asset: { kind: "text" as const, text: "B" } },
    { id: "d1", asset: { kind: "text" as const, text: "5" } },
    { id: "d2", asset: { kind: "text" as const, text: "7" } },
    { id: "d3", asset: { kind: "text" as const, text: "2" } },
  ],
  target_ids: ["t"],
  target_copies: 5,
  item_count: 30,
  confusable_ids: ["c1", "c2"],
};

const COUNT_RE = /\d+\s*\/\s*\d+/;
const CAP = { "3-4": 10, "4-5": 16, "5-6": 20 } as const;
const BANDS = ["3-4", "4-5", "5-6"] as const;

function tapTargets(session: GT037Session, count: number): void {
  let found = 0;
  for (let i = 0; i < session.boardSymbols.length && found < count; i++) {
    const slot = session.slots[i];
    if (session.boardSymbols[i]?.id === "t" && slot) {
      session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 1000 * i });
      found++;
    }
  }
}

function foundIds(session: GT037Session): string[] {
  return [...session.foundTargets].map(
    (i) => session.boardSymbols[i]?.id ?? "?"
  );
}

describe("GT-037 BR-E037-08: dựng lại bảng giữa lượt giữ nguyên tiến độ", () => {
  it("đổi band giữa lượt không xoá ký hiệu đã khoanh", () => {
    const session = new GT037Session(CONTENT, {}, 7);
    session.prepareRound("5-6");
    tapTargets(session, 2);
    expect(session.foundTargets.size).toBe(2);
    session.resolveSlots("3-4");
    expect(session.foundTargets.size).toBe(2);
    expect(foundIds(session)).toEqual(["t", "t"]);
    expect(session.order).toHaveLength(2);
    for (const step of session.order) {
      expect(session.boardSymbols[step.slotIndex]?.id).toBe(step.symbolId);
    }
  });

  it("bảng thu nhỏ vẫn đủ số bản sao đích và chưa thắng", () => {
    const session = new GT037Session(CONTENT, {}, 11);
    session.prepareRound("5-6");
    tapTargets(session, 3);
    session.resolveSlots("3-4");
    const targets = session.boardSymbols.filter((s) => s.id === "t");
    expect(targets).toHaveLength(session.targetCopies);
    expect(session.checkWinCondition()).toBe(false);
  });
});

describe("GT-037 BR-E037-09: item_count trần theo band", () => {
  for (const band of BANDS) {
    it(`band ${band}: item_count 30 bị chặn ở ${CAP[band]}`, () => {
      const session = new GT037Session(CONTENT, {}, 3);
      session.prepareRound(band);
      expect(session.slots.length).toBeLessThanOrEqual(CAP[band]);
      expect(session.boardSymbols.length).toBe(session.slots.length);
      expect(session.boardSymbols.filter((s) => s.id === "t").length).toBe(
        session.targetCopies
      );
    });
  }
});

describe("GT-037 BR-E037-09: show_target_counter điều khiển bộ đếm đã tìm / tổng", () => {
  function counterText(
    difficulty: ConstructorParameters<typeof GT037Session>[1]
  ): string {
    const session = new GT037Session(CONTENT, difficulty, 5);
    session.prepareRound("5-6");
    return session.getCounterText();
  }

  it("mặc định bật ở finish_mode auto: có đã tìm / tổng", () => {
    expect(counterText({})).toMatch(COUNT_RE);
  });

  it("show_target_counter tắt ở auto: chỉ còn lời nhắc, không có số", () => {
    const text = counterText({ show_target_counter: false });
    expect(text).not.toMatch(COUNT_RE);
    expect(text.length).toBeGreaterThan(0);
  });

  it("mặc định tắt ở declare: không lộ tổng số bản sao đích", () => {
    expect(counterText({ finish_mode: "declare" })).not.toMatch(COUNT_RE);
  });

  it("declare + show_target_counter bật: hiện đã tìm / tổng", () => {
    expect(
      counterText({ finish_mode: "declare", show_target_counter: true })
    ).toMatch(COUNT_RE);
  });
});
