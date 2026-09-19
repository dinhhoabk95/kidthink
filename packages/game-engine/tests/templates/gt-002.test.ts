import { describe, expect, it } from "vitest";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import { GT002Session } from "#src/templates/GT-002/session";

/**
 * GT-002 chấm tập chọn **chỉ** khi `commit` (`BR-E002-02`, `N4`, `N6`).
 * Trước Task #275 S1a, chọn đủ tập đúng là thắng ngay: `dispatch()` nuốt mọi
 * cử chỉ sau đó nên trẻ không bỏ chọn được, và bề mặt web từ chối "Bỏ qua"
 * vì vòng đã "thắng" mà chưa ai nộp.
 */
describe("GT-002 — thắng chỉ khi commit (BR-E002-02, Task #275 S1a)", () => {
  const fixture = GT002_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-002 not found");
  }
  const { content, difficulty } = fixture;
  const correctIds = content.items
    .filter((item) => item.is_correct)
    .map((item) => item.item_id);

  function buildSession(): GT002Session {
    const session = new GT002Session(content, difficulty, 1);
    session.prepareRound("4-5");
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
