import { describe, expect, it } from "vitest";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures";
import { GT031Session } from "#src/templates/GT-031/session";

/**
 * Task #313 Phase 3 — GT-031: trẻ gom xu rồi tự bấm "trả tiền"; đủ tổng cũng
 * không tự thắng, vượt tổng không bị chặn hay báo sai trước khi chốt
 * (`BR-E031-05`, `BR-E031-06`).
 */
const found = GT031_FIXTURES[1]; // xu 1, 2, 2, 5 — đích 5
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT031Session {
  const session = new GT031Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function deposit(session: GT031Session, coinId: string) {
  return session.dispatch({
    type: "tap",
    ...centerOf(session, coinId),
    timeMs: 1,
  });
}

function centerOf(session: GT031Session, id: string): { x: number; y: number } {
  const e = session.getView().entities.find((v) => v.id === id);
  if (!e) {
    throw new Error(`Thiếu entity ${id}`);
  }
  return { x: e.x, y: e.y };
}

describe("GT-031 — chốt bằng nút trả tiền (BR-E031-05)", () => {
  it("có nút trả tiền; chưa bỏ xu nào thì nút mờ và cử chỉ commit bị nuốt", () => {
    const session = build();
    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
    expect(session.dispatch({ type: "commit", timeMs: 1 })).toEqual({
      valid: false,
      feedback: "none",
    });
  });

  it("tổng bằng đích vẫn chưa thắng cho tới khi bấm trả", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    expect(session.getCurrentTotal()).toBe(5);
    expect(session.checkWinCondition()).toBe(false);
    const verdict = session.dispatch({ type: "commit", timeMs: 5 });
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("bỏ xu làm vượt đích không bị chặn và không báo sai trước khi chốt", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_2" } });
    const verdict = deposit(session, "c5_1");
    expect(verdict?.valid).toBe(true);
    expect(verdict?.feedback).toBe("none");
    expect(session.getCurrentTotal()).toBe(9);
    const target = session
      .getView()
      .entities.find((e) => e.id === "payment_target");
    expect(target?.state).toBe("idle");
  });

  it("trả sai tổng: báo nhẹ, xu giữ nguyên, thêm bớt rồi trả lại thì thắng", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_2" } });
    const wrong = session.dispatch({ type: "commit", timeMs: 5 });
    expect(wrong?.valid).toBe(false);
    expect(wrong?.feedback).toBe("amber_soft");
    expect(session.getCurrentTotal()).toBe(4);
    expect(session.checkWinCondition()).toBe(false);
    session.commit({ type: "deposit_coin", data: { coin_id: "c1_1" } });
    expect(session.dispatch({ type: "commit", timeMs: 9 })?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("trả sai thì ô tổng nháy hổ phách một nhịp rồi tắt", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.dispatch({ type: "commit", timeMs: 5 });
    const flash = () =>
      session.getView().entities.find((e) => e.id === "payment_target")?.state;
    expect(flash()).toBe("incorrect");
    session.update(3000);
    expect(flash()).toBe("idle");
  });
});

describe("GT-031 — gợi ý dẫn tới nút trả (BR-E031-05)", () => {
  it("đủ tổng thì hint chỉ vào nút trả tiền, vượt tổng thì chỉ xu cần gỡ", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    expect(session.getHintTarget()).toEqual({ kind: "action" });

    const over = build();
    over.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    over.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    const hint = over.getHintTarget();
    expect(hint?.kind).toBe("slot");
    expect(over.getHintDestinationIndex()).toBeNull();
  });
});

describe("GT-031 — exact_change tắt (BR-E031-06)", () => {
  it("trả dư vẫn được khi không đòi đúng số", () => {
    const session = new GT031Session(f.content, {
      ...f.difficulty,
      exact_change: false,
    });
    session.prepareRound("5-6");
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    expect(session.dispatch({ type: "commit", timeMs: 5 })?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});
