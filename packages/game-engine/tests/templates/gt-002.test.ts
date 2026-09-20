import { describe, expect, it } from "vitest";
import type { ActionResult } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import type { LogicSpace } from "#src/layout/constants";
import { COMMIT_ENTITY_ID } from "#src/render/index.js";
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

function commitEntity(session: GT002Session): ViewEntity {
  const entity = session
    .getView()
    .entities.find((e) => e.id === COMMIT_ENTITY_ID);
  if (!entity) {
    throw new Error(`Thiếu entity ${COMMIT_ENTITY_ID}`);
  }
  return entity;
}

function tapCommitButton(session: GT002Session): ActionResult | undefined {
  const entity = commitEntity(session);
  return session.dispatch({
    type: "tap",
    x: entity.x,
    y: entity.y,
    timeMs: 0,
  });
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
 * Nút **Xong** là đường `commit` duy nhất của GT-002 trên bề mặt trẻ (`G1`,
 * `D-275-1`). Trước Task #275 S1b, web không phát `commit` cho GT-002 nên
 * không có cách nộp bài: chỉ harness engine gửi thẳng `commit` mới thắng được.
 */
describe("GT-002 — nút Xong trên canvas (N1, Task #275 S1b)", () => {
  it("getView() có entity nút Xong, vai trung tính, nhãn Xong", () => {
    const session = buildSession();

    const entity = commitEntity(session);

    expect(entity.role).toBe("neutral");
    expect(entity.label).toBe("Xong");
  });

  it("chạm nút Xong với tập chọn đúng thì thắng", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }

    const verdict = tapCommitButton(session);

    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("chạm nút Xong với tập chọn sai thì nhắc thử lại, chưa thắng", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);

    const verdict = tapCommitButton(session);

    expect(verdict).toEqual({ valid: false, feedback: "amber_soft" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("chạm nút Xong khi chưa chọn vật nào thì bị nuốt, không tính lần sai", () => {
    const session = buildSession();

    const verdict = tapCommitButton(session);

    expect(verdict).toEqual({ valid: false, feedback: "none" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("nút Xong không đè vật nào, ở cả khung ngang và khung dọc", () => {
    const spaces: LogicSpace[] = [
      { w: 960, h: 540 },
      { w: 540, h: 1168 },
    ];

    for (const space of spaces) {
      const session = buildSession(space);
      const button = commitEntity(session);
      const buttonTop = button.y - button.h / 2;

      for (const slot of session.slots) {
        const slotBottom = slot.y + slot.hitH / 2;
        expect(slotBottom).toBeLessThan(buttonTop);
      }
      expect(button.y + button.h / 2).toBeLessThanOrEqual(space.h);
    }
  });
});
