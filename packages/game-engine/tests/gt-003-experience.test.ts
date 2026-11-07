import { describe, expect, it } from "vitest";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const FIXTURE = GT003_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-003");
}

function openSession(): GT003Session {
  const session = new GT003Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("3-4");
  return session;
}

function dropInto(session: GT003Session, itemIndex: number): void {
  const slot = session.sourceSlots[itemIndex];
  const box = session.getContainerBox();
  if (!(slot && box)) {
    throw new Error("Thiếu slot hoặc rổ");
  }
  session.dispatch({
    type: "drop",
    fromX: slot.x,
    fromY: slot.y,
    toX: box.x,
    toY: box.y,
    timeMs: 100,
  });
}

function indexOfItem(session: GT003Session, correct: boolean): number {
  return session.displayItems.findIndex((i) => i.is_correct === correct);
}

describe("GT-003: khung chuyện, tiếng rơi, mascot reo (BR-E003-08)", () => {
  it("storyLine nhắc Gấu Con và việc bỏ đồ vào đúng chỗ", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Gấu Con");
    expect(story).toContain("bỏ đồ");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Gấu Con"))).toBe(false);
  });

  it("thả vật đúng xếp một cue drop_thud, thả lại không thêm", () => {
    const session = openSession();
    const correct = indexOfItem(session, true);
    dropInto(session, correct);

    expect(session.takeSfxCues()).toEqual(["drop_thud"]);

    session.update(16);
    dropInto(session, correct);

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("thả vật sai không có tiếng rơi", () => {
    const session = openSession();
    dropInto(session, indexOfItem(session, false));

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot: null → cheer sau vật đúng đầu tiên → null khi thắng", () => {
    const session = openSession();
    expect(session.mascotMood()).toBeNull();

    const corrects = session.displayItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.is_correct);
    expect(corrects.length).toBeGreaterThan(1);

    dropInto(session, corrects[0]?.index ?? -1);
    expect(session.mascotMood()).toBe("cheer");

    for (const { index } of corrects.slice(1)) {
      dropInto(session, index);
    }
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
