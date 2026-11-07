import { describe, expect, it } from "vitest";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures.js";
import { GT035_STEP_MS, GT035Session } from "#src/templates/GT-035/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const WONDER_MS = 1500;
const FIXTURE = GT035_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-035");
}

function openSession(): GT035Session {
  const session = new GT035Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function addAndRun(session: GT035Session, commands: string[]): void {
  for (const command of commands) {
    session.commit({ type: "add_command", data: { command } });
  }
  session.commit({ type: "run_program", data: {} });
}

describe("GT-035: khung chuyện Robot Bíp đi tìm ngôi sao, tiếng bíp mỗi nhịp, mascot đáp lại (BR-E035-11)", () => {
  it("storyLine nhắc Robot Bíp và thẻ lệnh, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Robot Bíp");
    expect(story).toContain("lệnh");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Bíp");
  });

  it("xếp lệnh và bấm chạy chưa có cue; mỗi nhịp robot đi một cue robot_beep", () => {
    const session = openSession();
    addAndRun(session, ["forward", "forward"]);
    expect(session.takeSfxCues()).toEqual([]);

    session.update(GT035_STEP_MS);
    expect(session.takeSfxCues()).toEqual(["robot_beep"]);
    session.update(GT035_STEP_MS);
    expect(session.takeSfxCues()).toEqual(["robot_beep"]);
  });

  it("chương trình hụt: wonder rồi null", () => {
    const session = openSession();
    addAndRun(session, ["turn_left"]);
    session.update(GT035_STEP_MS);
    session.update(GT035_STEP_MS);

    expect(session.checkWinCondition()).toBe(false);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
