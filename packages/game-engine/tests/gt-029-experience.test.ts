import { describe, expect, it } from "vitest";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures.js";
import { GT029Session } from "#src/templates/GT-029/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const MUNCH_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT029_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-029");
}

function openSession(): GT029Session {
  const session = new GT029Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function toggle(session: GT029Session, index: number): void {
  const item = FIXTURE.content.initial_items[index];
  session.commit({ type: "remove_item", data: { item_id: item?.item_id } });
}

function answer(session: GT029Session, correct: boolean): void {
  const option = FIXTURE.content.answer_options.find(
    (o) => o.is_correct === correct
  );
  session.commit({
    type: "select_option",
    data: { option_id: option?.option_id },
  });
}

function removeAll(session: GT029Session): void {
  for (let i = 0; i < FIXTURE.content.remove_count; i++) {
    toggle(session, i);
  }
}

describe("GT-029: khung chuyện Mèo Mướp ăn bớt, tiếng nhai, mascot reo ngắn (BR-E029-06)", () => {
  it("storyLine nhắc Mèo Mướp và việc bớt đồ ăn, không nhắc Gấu Con", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Mèo Mướp");
    expect(story).toContain("bớt");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn).toEqual([]);
  });

  it("mỗi vật bớt xếp một cue cat_munch; hoàn lại vật thì không", () => {
    const session = openSession();
    toggle(session, 0);
    expect(session.takeSfxCues()).toEqual(["cat_munch"]);

    toggle(session, 0);
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("bớt quá số lượng không có cue", () => {
    const session = openSession();
    removeAll(session);
    session.takeSfxCues();
    toggle(session, FIXTURE.content.remove_count);

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot cheer ngắn sau mỗi vật bớt rồi về null", () => {
    const session = openSession();
    expect(session.mascotMood()).toBeNull();

    toggle(session, 0);
    expect(session.mascotMood()).toBe("cheer");
    session.update(MUNCH_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn đáp án sai: wonder, không cue; đáp án đúng: thắng, mascot null", () => {
    const session = openSession();
    removeAll(session);
    session.update(MUNCH_MS + 1);
    session.takeSfxCues();

    answer(session, false);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    answer(session, true);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
