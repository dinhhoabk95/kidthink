import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import { liquidCupRect } from "#src/render/craft-shapes";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures";
import { GT032Session } from "#src/templates/GT-032/session";
import { GT032ContentSchema } from "#src/templates/GT-032/template";

/**
 * Task #313 Phase 3 — GT-032: cùng số vạch nước thì cùng lượng nước nhìn thấy
 * (`BR-E032-05`), nhãn không in số vạch (`BR-E032-06`), rót tới vạch phải
 * tự chốt chứ không thắng khi chạm lướt qua (`BR-E032-07`).
 */
const base = GT032_FIXTURES[0];
if (!base) {
  throw new Error("Thiếu fixture");
}
const difficulty = base.difficulty;

const SLOT: Slot = {
  index: 0,
  x: 200,
  y: 200,
  w: 160,
  h: 200,
  hitW: 160,
  hitH: 200,
  page: 0,
  role: "source",
};
const RE_VACH = /vạch/;
const RE_FRACTION = /\d+\s*\/\s*\d+/;
const SHAPES = ["standard", "narrow_tall", "wide_short", "fluted"] as const;

describe("GT-032 — cùng số vạch là cùng lượng nước nhìn thấy (BR-E032-05)", () => {
  it("mọi hình cốc cùng dung tích có diện tích thân bằng nhau", () => {
    const areas = SHAPES.map((shape) => {
      const r = liquidCupRect(SLOT, shape, 8, 8);
      return r.w * r.h;
    });
    for (const area of areas) {
      expect(area).toBeCloseTo(areas[0] ?? 0, 6);
    }
  });

  it("lượng nước vẽ ra (diện tích × tỉ lệ mức) bằng nhau khi cùng fill_units", () => {
    const water = (shape: (typeof SHAPES)[number], cap: number) => {
      const r = liquidCupRect(SLOT, shape, cap, 8);
      return r.w * r.h * (4 / cap);
    };
    // 4 vạch ở cốc dung tích 8 hình cao hẹp, và 4 vạch ở cốc dung tích 4 hình rộng thấp.
    expect(water("narrow_tall", 8)).toBeCloseTo(water("wide_short", 8), 6);
    const half = liquidCupRect(SLOT, "standard", 4, 8);
    const full = liquidCupRect(SLOT, "standard", 8, 8);
    expect(half.w * half.h * 2).toBeCloseTo(full.w * full.h, 6);
  });

  it("đáy các cốc canh theo cùng một mặt bàn", () => {
    const bottoms = SHAPES.map((shape) => {
      const r = liquidCupRect(SLOT, shape, 8, 8);
      return r.y + r.h;
    });
    for (const b of bottoms) {
      expect(b).toBeCloseTo(bottoms[0] ?? 0, 6);
    }
  });
});

describe("GT-032 — nhãn không lộ mức nước (BR-E032-06)", () => {
  it("label và spokenLabel của cốc không in số vạch hay phân số", () => {
    const f = GT032_FIXTURES[1];
    if (!f) {
      throw new Error("Thiếu fixture");
    }
    const session = new GT032Session(f.content, f.difficulty);
    session.prepareRound("5-6");
    for (const e of session.getView().entities) {
      expect(e.label ?? "").not.toMatch(RE_FRACTION);
      expect(e.spokenLabel).not.toMatch(RE_VACH);
    }
  });
});

function pourSession(): GT032Session {
  const content = GT032ContentSchema.parse({
    prompt: "Rót tới vạch",
    question_type: "pour_to_mark",
    conservation_trap: false,
    cups: [
      {
        cup_id: "cup_pour",
        shape: "standard",
        capacity_units: 6,
        fill_units: 2,
        target_units: 4,
        color: "sky",
      },
      {
        cup_id: "cup_ref",
        shape: "narrow_tall",
        capacity_units: 6,
        fill_units: 4,
        target_units: 4,
        color: "sky",
      },
    ],
  });
  const session = new GT032Session(content, difficulty);
  session.prepareRound("5-6");
  return session;
}

describe("GT-032 — rót tới vạch phải tự chốt (BR-E032-07)", () => {
  it("chỉ dạng pour_to_mark có nút chốt", () => {
    expect(pourSession().needsCommit).toBe(true);
    const more = new GT032Session(base.content, difficulty);
    expect(more.needsCommit).toBe(false);
  });

  it("rót tới đúng vạch vẫn chưa thắng; bấm chốt mới thắng", () => {
    const session = pourSession();
    session.dispatch({ type: "adjust", delta: 1, timeMs: 1 });
    session.dispatch({ type: "adjust", delta: 1, timeMs: 2 });
    expect(session.getCupFill("cup_pour")).toBe(4);
    expect(session.checkWinCondition()).toBe(false);
    const verdict = session.dispatch({ type: "commit", timeMs: 3 });
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("chốt khi chưa tới vạch: báo nhẹ, nước giữ nguyên, rót tiếp được", () => {
    const session = pourSession();
    const verdict = session.dispatch({ type: "commit", timeMs: 1 });
    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.getCupFill("cup_pour")).toBe(2);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("chạm liên tục vào cốc không thắng nếu không chốt", () => {
    const session = pourSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot");
    }
    for (let i = 0; i < 20; i++) {
      session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: i });
    }
    expect(session.checkWinCondition()).toBe(false);
  });

  it("đã tới vạch thì gợi ý chỉ vào nút chốt", () => {
    const session = pourSession();
    session.dispatch({ type: "adjust", delta: 2, timeMs: 1 });
    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });
});
