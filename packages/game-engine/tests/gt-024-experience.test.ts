import { describe, expect, it } from "vitest";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import { GT024Session } from "#src/templates/GT-024/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 700;
const WONDER_MS = 1200;
const FIXTURE = GT024_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-024");
}

function openSession(): GT024Session {
  const session = new GT024Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.setupEntities();
  return session;
}

describe("GT-024: khung chuyện Kiến Nhỏ về tổ, tiếng bước chân kiến, mascot đáp lại (BR-E024-04)", () => {
  it("storyLine nhắc Kiến Nhỏ và tổ, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Kiến Nhỏ");
    expect(story).toContain("tổ");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = new GT024Session(FIXTURE.content, FIXTURE.difficulty, 0);
    session.prepareRound("5-6");
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Kiến");
  });

  it("chạm đúng điểm kế tiếp: một cue ant_step, mascot happy rồi null", () => {
    const session = openSession();
    const wp = FIXTURE.content.waypoints[0];
    session.onTracePoint({ x: wp?.x ?? 0, y: wp?.y ?? 0 });

    expect(session.takeSfxCues()).toEqual(["ant_step"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chạm nhầm điểm khác: không cue, mascot wonder rồi null", () => {
    const session = openSession();
    session.commit({ type: "tap_waypoint", data: { index: 2 } });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
