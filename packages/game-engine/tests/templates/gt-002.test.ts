import { describe, expect, it } from "vitest";
import type { LogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test.js";
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

describe("GT-002 — commit sai giữ tập chọn, trạng thái một nguồn (G3, G5, Task #275 S2)", () => {
  it("commit sai thì giữ nguyên tập chọn và không entity nào ở trạng thái incorrect", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);

    session.dispatch({ type: "commit", timeMs: 0 });

    expect(session.getItemState(firstDistractor)).toBe("selected");
    expect(session.getItemState(firstCorrect)).toBe("selected");
    const entities = session.getView().entities;
    expect(entities.some((e) => e.state === "incorrect")).toBe(false);
  });

  it("chạm lại distractor sau khi commit sai: trở về idle và mechanic không còn chọn", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    if (!firstDistractor) {
      throw new Error("Fixture thiếu distractor");
    }
    tapItem(session, firstDistractor);
    session.dispatch({ type: "commit", timeMs: 0 });

    tapItem(session, firstDistractor);

    expect(session.getItemState(firstDistractor)).toBe("idle");
    const entity = session
      .getView()
      .entities.find((e) => e.id === firstDistractor);
    expect(entity?.state).toBe("idle");
  });
});

describe("GT-002 — vị trí vật xáo theo seed (R3, Task #275 S4)", () => {
  it("cùng seed thì cùng thứ tự, khác seed thì vị trí vật đổi", () => {
    const s1 = new GT002Session(content, difficulty, 42);
    s1.prepareRound("4-5");
    const s2 = new GT002Session(content, difficulty, 42);
    s2.prepareRound("4-5");
    const s3 = new GT002Session(content, difficulty, 9999);
    s3.prepareRound("4-5");

    const order1 = s1.displayItems.map((i) => i.item_id);
    const order2 = s2.displayItems.map((i) => i.item_id);
    const order3 = s3.displayItems.map((i) => i.item_id);

    expect(order1).toEqual(order2);
    expect(order1).not.toEqual(order3);
  });

  it("getHintTargetIndex() trỏ đúng vật đúng sau khi xáo", () => {
    const s = new GT002Session(content, difficulty, 12_345);
    s.prepareRound("4-5");
    const hintIdx = s.getHintTargetIndex();
    expect(hintIdx).not.toBeNull();
    const item = hintIdx === null ? undefined : s.displayItems[hintIdx];
    expect(item?.is_correct).toBe(true);
  });

  it("20.000 seed: tỉ lệ vật đúng ở ô 0 lệch <= 1 điểm % so với target_count / item_count", () => {
    const targetCount = content.items.filter((i) => i.is_correct).length;
    const totalCount = content.items.length;
    const expectedRatio = targetCount / totalCount;

    let correctAtZero = 0;
    const totalTrials = 20_000;
    for (let seed = 1; seed <= totalTrials; seed++) {
      const s = new GT002Session(content, difficulty, seed);
      s.prepareRound("4-5");
      if (s.displayItems[0]?.is_correct) {
        correctAtZero++;
      }
    }

    const actualRatio = correctAtZero / totalTrials;
    expect(Math.abs(actualRatio - expectedRatio)).toBeLessThanOrEqual(0.01);
  });
});

describe("GT-002 — chạm vật đọc tên, một hình học chạm (R6, E4/E5, Task #275 S5)", () => {
  it("getView() mang glyph, label, spokenLabel và role neutral", () => {
    const session = buildSession();
    const entities = session.getView().entities;

    expect(entities.length).toBe(content.items.length);
    for (const entity of entities) {
      expect(entity.role).toBe("neutral");
      expect(entity.label).toBeDefined();
      expect(entity.spokenLabel).toBeDefined();
    }
  });

  it("điểm ở góc hình vuông cũ nhưng ngoài vòng tròn (bán kính + 24px) thì toAction trả null", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot");
    }
    const r = Math.min(slot.hitW, slot.w) / 2;
    // Điểm ở góc: dx = r + 16, dy = r + 16.
    // Chebyshev (hình vuông): max(dx, dy) = r + 16 <= r + 24.
    // Euclid (vòng tròn): hypot(dx, dy) = 1.414 * (r + 16) > r + 24.
    const cornerX = slot.x + r + 16;
    const cornerY = slot.y + r + 16;

    const action = session.toAction({
      type: "tap",
      x: cornerX,
      y: cornerY,
      timeMs: 0,
    });

    expect(action).toBeNull();
  });

  it("quét lưới điểm: toAction và findHitEntity chọn cùng một entity", () => {
    const session = buildSession();
    const entities = session.getView().entities;

    for (let x = 0; x <= 960; x += 30) {
      for (let y = 0; y <= 540; y += 30) {
        const action = session.toAction({ type: "tap", x, y, timeMs: 0 });
        const hitEntity = findHitEntity(entities, x, y);

        const actionItemId =
          action &&
          typeof action.data === "object" &&
          action.data !== null &&
          "item_id" in action.data
            ? String((action.data as { item_id: unknown }).item_id)
            : null;

        expect(actionItemId).toBe(hitEntity ? hitEntity.id : null);
      }
    }
  });
});
