import { describe, expect, it } from "vitest";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures.js";
import { GT033Session } from "#src/templates/GT-033/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 800;
const WONDER_MS = 1500;
const FIXTURE = GT033_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-033");
}

function openSession(): GT033Session {
  const session = new GT033Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function blankIndex(): number {
  return FIXTURE.content.cells.indexOf(null);
}

describe("GT-033: khung chuyện Bà Dệt thổ cẩm, tiếng kéo sợi, mascot đáp lại (BR-E033-05)", () => {
  it("storyLine nhắc Bà và khăn thổ cẩm, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("khăn thổ cẩm");
    expect(story).toContain("sợi");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("thổ cẩm");
  });

  it("đặt sợi: một cue yarn_pull như nhau dù đúng hay sai màu; đúng thì happy rồi null", () => {
    const session = openSession();
    const expected = session.getExpectedColorAt(blankIndex()) ?? "";
    const wrong =
      FIXTURE.content.palette.find((p) => p.color_id !== expected)?.color_id ??
      "";
    session.commit({
      type: "place_yarn",
      data: { cell_index: blankIndex(), color_id: wrong },
    });
    expect(session.takeSfxCues()).toEqual(["yarn_pull"]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({
      type: "place_yarn",
      data: { cell_index: blankIndex(), color_id: expected },
    });
    expect(session.takeSfxCues()).toEqual(["yarn_pull"]);
  });

  it("gỡ sợi và chọn màu không có cue", () => {
    const session = openSession();
    session.commit({ type: "select_color", data: { color_id: "blue" } });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
    expect(HAPPY_MS).toBeGreaterThan(0);
  });
});
