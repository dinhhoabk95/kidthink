import { describe, expect, it } from "vitest";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures.js";
import { GT006Session } from "#src/templates/GT-006/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 700;
const WONDER_MS = 1500;
const FIXTURE = GT006_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-006");
}

function openSession(): GT006Session {
  const session = new GT006Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function reorder(session: GT006Session, from: number, to: number): void {
  session.commit({
    type: "reorder_step",
    data: { from_index: from, to_index: to },
  });
}

describe("GT-006: khung chuyện Rùa Con, tiếng tạch máy chiếu, mascot đáp lại thao tác (BR-E006-05)", () => {
  it("storyLine nhắc Rùa Con và cuộn phim, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Rùa Con");
    expect(story).toContain("cuộn phim");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas: chữ vẽ chỉ là nhãn thẻ có sẵn", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );
    const labels = FIXTURE.content.sequence.map((s) => s.label);

    expect(drawn.filter((text) => !labels.includes(text))).toEqual([]);
  });

  it("đổi chỗ thẻ xếp một cue film_tick và mascot happy; đổi không hợp lệ thì không", () => {
    const session = openSession();
    reorder(session, 0, 1);
    expect(session.takeSfxCues()).toEqual(["film_tick"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();

    reorder(session, 0, 99);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("bấm xong khi chưa đúng: wonder, không cue; xếp đúng rồi bấm xong: thắng, mascot null", () => {
    const session = openSession();
    session.commit({ type: "check_sequence", data: {} });
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    const target = FIXTURE.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);
    for (let i = 0; i < target.length; i++) {
      const at = session.getCurrentSequence().indexOf(target[i] ?? "");
      reorder(session, at, i);
    }
    session.commit({ type: "check_sequence", data: {} });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
