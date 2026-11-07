import { describe, expect, it, vi } from "vitest";
import type { Gesture } from "#src/interaction";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures.js";
import { GT000Session } from "#src/templates/GT-000/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 1000;
const LISTEN_MS = 1500;
const FIXTURE = GT000_FIXTURES[0] ?? failMissingFixture();
const RECOGNISE_INDEX = FIXTURE.content.steps?.findIndex(
  (s) => s.action === "recognise"
);

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-000");
}

function openSession(): GT000Session {
  const session = new GT000Session(FIXTURE.content, FIXTURE.difficulty);
  vi.spyOn(session.audio, "speakPrompt").mockImplementation((_text, onEnd) => {
    onEnd?.();
    return true;
  });
  vi.spyOn(session.audio, "playPromptAudio").mockImplementation(() => {
    /* mp3 — không liên quan */
  });
  session.prepareRound("3-4");
  return session;
}

function tapEntity(session: GT000Session, id: string): Gesture {
  const e = session.getView().entities.find((x) => x.id === id);
  if (!e) {
    throw new Error(`Thiếu entity ${id}`);
  }
  return { type: "tap", x: e.x, y: e.y, timeMs: 0 };
}

function advanceTo(session: GT000Session, index: number): void {
  while (session.currentStepIndex < index) {
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
  }
}

describe("GT-000: khung chuyện Cô Cú, tiếng ting, mascot thì thầm (BR-E000-15)", () => {
  it("storyLine nhắc Cô Cú, nghe, chỉ và nói, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Cô Cú");
    expect(story).toContain("chỉ");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas và không đóng cổng chạm", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join("")).not.toContain("Cú");
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("present và echo không có cue, mascot null", () => {
    const session = openSession();
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("recognise sai: listen, không cue, không wrong; đúng: teacher_chime và happy", () => {
    const session = openSession();
    advanceTo(session, RECOGNISE_INDEX ?? 0);
    session.takeSfxCues();

    session.dispatch(tapEntity(session, "num_2"));
    expect(session.mascotMood()).toBe("listen");
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.getView().entities.map((e) => e.state)).not.toContain(
      "wrong"
    );
    session.update(LISTEN_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.dispatch(tapEntity(session, "num_1"));
    expect(session.takeSfxCues()).toEqual(["teacher_chime"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("recall sai: không cue, mascot không đổi, vẫn đi tiếp ở update", () => {
    const session = openSession();
    advanceTo(session, RECOGNISE_INDEX ?? 0);
    session.dispatch(tapEntity(session, "num_1"));
    session.update(HAPPY_MS + 1);
    session.takeSfxCues();

    session.dispatch(tapEntity(session, "num_2"));
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
    expect(session.isAcceptingInput()).toBe(false);
  });
});
