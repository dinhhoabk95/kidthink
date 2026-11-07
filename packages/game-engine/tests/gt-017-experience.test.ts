import { describe, expect, it } from "vitest";
import { GT017_FIXTURES } from "#src/templates/GT-017/fixtures.js";
import { BlockStackSession } from "#src/templates/GT-017/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 500;
const WONDER_MS = 1500;
const BASE = GT017_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-017");
}

function openSession(
  question: "count_cubes" | "top_view" | "match_solid" = "count_cubes"
): BlockStackSession {
  const session = new BlockStackSession(
    { ...BASE.content, question },
    BASE.difficulty,
    0
  );
  session.prepareRound("5-6");
  return session;
}

describe("GT-017: khung chuyện Hải Ly xây nhà, tiếng bụp khi xoay mô hình, mascot đáp lại (BR-E017-05)", () => {
  it("storyLine nhắc Hải Ly và khớp câu hỏi", () => {
    const count = openSession("count_cubes").storyLine() ?? "";
    const top = openSession("top_view").storyLine() ?? "";
    const solid = openSession("match_solid").storyLine() ?? "";

    expect(count).toContain("Hải Ly");
    expect(count).toContain("đếm");
    expect(top).toContain("từ trên xuống");
    expect(top).not.toContain("đếm");
    expect(solid).toContain("giống");
    expect(count + top + solid).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Hải Ly");
  });

  it("xoay mô hình: mỗi lần một cue block_bump, mascot happy rồi null", () => {
    const session = openSession();
    session.commit({ type: "rotate_model", data: "cw" });
    expect(session.takeSfxCues()).toEqual(["block_bump"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({ type: "rotate_model", data: "ccw" });
    expect(session.takeSfxCues()).toEqual(["block_bump"]);
  });

  it("chọn sai: không cue, mascot wonder rồi null; chọn đúng thì thắng, mascot null", () => {
    const session = openSession();
    const wrong = session.getOptions().find((o) => !o.is_correct);
    const right = session.getOptions().find((o) => o.is_correct);
    session.commit({ type: "select_option", data: wrong?.option_id ?? "" });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({ type: "select_option", data: right?.option_id ?? "" });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
