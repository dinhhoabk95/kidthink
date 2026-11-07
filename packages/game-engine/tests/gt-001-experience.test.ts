import { describe, expect, it } from "vitest";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT001Session {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-001");
  }
  const session = new GT001Session(fixture.content, fixture.difficulty);
  session.prepareRound("4-5");
  return session;
}

function pick(session: GT001Session, itemId: string): void {
  session.commit({ type: "select_item", data: { item_id: itemId } });
}

describe("GT-001: khung chuyện, tiếng gỗ, mascot thắc mắc (BR-E001-05)", () => {
  it("storyLine nhắc Gấu Con và việc chọn đúng món", () => {
    const story = makeSession().storyLine();

    expect(story).toContain("Gấu Con");
    expect(story).toContain("chọn");
  });

  it("khung chuyện không lên canvas", () => {
    const session = makeSession();
    const story = session.storyLine() ?? "";
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => story.includes(t) || t.includes("Gấu Con"))).toBe(
      false
    );
  });

  it("mỗi lần chọn token, đúng hay sai, xếp đúng một cue wood_tap", () => {
    const wrong = makeSession();
    pick(wrong, "banana_opt");
    expect(wrong.takeSfxCues()).toEqual(["wood_tap"]);

    const right = makeSession();
    pick(right, "apple_opt");
    expect(right.takeSfxCues()).toEqual(["wood_tap"]);
  });

  it("chọn lại đúng token đã chọn không xếp thêm cue", () => {
    const session = makeSession();
    pick(session, "banana_opt");
    session.takeSfxCues();
    pick(session, "banana_opt");

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot: chưa chọn thì null, chọn sai thì wonder, chọn đúng thì về null", () => {
    const session = makeSession();
    expect(session.mascotMood()).toBeNull();

    pick(session, "banana_opt");
    expect(session.mascotMood()).toBe("wonder");

    pick(session, "apple_opt");
    expect(session.mascotMood()).toBeNull();
  });

  it("dựng lại vòng thì xoá tâm trạng wonder", () => {
    const session = makeSession();
    pick(session, "banana_opt");
    session.prepareRound("4-5");

    expect(session.mascotMood()).toBeNull();
  });
});
