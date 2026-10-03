import { describe, expect, it } from "vitest";
import type { LogicSpace } from "#src/layout/constants";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import { GT002Session } from "#src/templates/GT-002/session";

/**
 * GT-002 chấm tập chọn **chỉ** khi `commit` (`BR-E002-02`, `N4`, `N6`).
 * Trước Task #275 S1a, chọn đủ tập đúng là thắng ngay: `dispatch()` nuốt mọi
 * cử chỉ sau đó nên trẻ không bỏ chọn được, và bề mặt web từ chối "Bỏ qua"
 * vì vòng đã "thắng" mà chưa ai nộp.
 */
const fixture = GT002_FIXTURES[0];
if (!fixture) {
  throw new Error("Fixture GT-002 not found");
}
const { content, difficulty } = fixture;
const correctIds = content.items
  .filter((item) => item.is_correct)
  .map((item) => item.item_id);
const distractorIds = content.items
  .filter((item) => !item.is_correct)
  .map((item) => item.item_id);

function buildSession(space?: LogicSpace): GT002Session {
  const session = new GT002Session(content, difficulty, 1);
  session.prepareRound("4-5", space);
  return session;
}

function tapItem(session: GT002Session, itemId: string): void {
  const index = session.displayItems.findIndex(
    (item) => item.item_id === itemId
  );
  const slot = session.slots[index];
  if (!slot) {
    throw new Error(`Thiếu slot của ${itemId}`);
  }
  session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 0 });
}

describe("GT-002 — thắng chỉ khi commit (BR-E002-02, Task #275 S1a)", () => {
  it("chọn đủ tập đúng mà chưa commit thì chưa thắng", () => {
    const session = buildSession();

    for (const id of correctIds) {
      tapItem(session, id);
    }

    expect(session.checkWinCondition()).toBe(false);
  });

  it("chọn đủ tập đúng rồi chạm lại một vật thì vật đó bỏ chọn được", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Fixture không có vật đúng");
    }

    tapItem(session, firstCorrect);

    expect(session.getItemState(firstCorrect)).toBe("idle");
  });

  it("commit với tập chọn đúng thì thắng", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }

    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});

/**
 * Nút **Xong** nằm ở `zones.action` do shell vẽ (`BR-PSZ-05`, Task #283 B2): engine
 * khai `needsCommit`, báo sáng/mờ qua `canCommit()` và chỉ nhận `commit`.
 * Trước đó (#275 S1b) engine tự vẽ nút trong canvas; nút đó đã gỡ.
 */
describe("GT-002 — nút Xong ở zones.action (BR-PSZ-05, Task #283 B2)", () => {
  it("khai needsCommit, mờ khi chưa chọn, sáng khi đã chọn", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Fixture không có vật đúng");
    }

    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
    tapItem(session, firstCorrect);
    expect(session.canCommit()).toBe(true);
  });

  it("getView() không còn entity nút Xong — shell dựng nút hành động", () => {
    const session = buildSession();

    const ids = session.getView().entities.map((e) => e.id);

    expect(ids.every((id) => id !== "commit:done")).toBe(true);
  });

  it("commit với tập chọn sai thì nhắc thử lại, chưa thắng", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);

    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict).toEqual({ valid: false, feedback: "amber_soft" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("commit khi chưa chọn vật nào thì bị nuốt, không tính lần sai", () => {
    const session = buildSession();

    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict).toEqual({ valid: false, feedback: "none" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("chọn đủ vật đúng thì gợi ý trỏ vào nút hành động, chưa đủ thì trỏ vật", () => {
    const session = buildSession();
    expect(session.getHintTarget()?.kind).toBe("slot");

    for (const id of correctIds) {
      tapItem(session, id);
    }

    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });
});
