import { describe, expect, it } from "vitest";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const FIXTURE = GT026_FIXTURES[0] ?? failMissingFixture();
const { isi_ms: ISI_MS, stimulus_window_ms: WINDOW_MS } = FIXTURE.difficulty;

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-026");
}

/** Chuỗi lượt: go, nogo, nogo, go — đủ bốn kết quả. */
function openSession(): GT026Session {
  const content = {
    ...FIXTURE.content,
    trials: (["go", "nogo", "nogo", "go"] as const).map((kind, i) => ({
      id: `t${i}`,
      kind,
    })),
  };
  const session = new GT026Session(content, FIXTURE.difficulty);
  session.prepareRound("5-6");
  session.commit({ type: "start_trials", data: {} });
  return session;
}

describe("GT-026: khung chuyện, âm đèn xanh/đỏ, mascot đứng hình (BR-E026-11)", () => {
  it("storyLine nhắc Gấu Con và trò đèn xanh, đèn đỏ", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Gấu Con");
    expect(story).toContain("đèn xanh");
    expect(story).toContain("đèn đỏ");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Gấu Con"))).toBe(false);
  });

  it("kích thích đang hiện: chưa cue, chưa mascot — không báo trước đáp án", () => {
    const session = openSession();

    expect(session.getState()).toBe("stimulus");
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();

    session.update(WINDOW_MS / 4);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("chạm đúng lượt go: cue go_chime, mascot cheer trong nhịp nghỉ, hết khi kích thích mới hiện", () => {
    const session = openSession();
    session.onTapStimulus();

    expect(session.takeSfxCues()).toEqual(["go_chime"]);
    expect(session.getState()).toBe("isi");
    expect(session.mascotMood()).toBe("cheer");

    session.update(ISI_MS + 1);
    expect(session.getState()).toBe("stimulus");
    expect(session.mascotMood()).toBeNull();
  });

  it("kìm được lượt nogo: cue stop_hum và mascot freeze", () => {
    const session = openSession();
    session.onTapStimulus();
    session.update(ISI_MS + 1);
    session.takeSfxCues();

    session.update(WINDOW_MS + 1);

    expect(session.getCurrentTrial()?.kind).toBe("nogo");
    expect(session.takeSfxCues()).toEqual(["stop_hum"]);
    expect(session.mascotMood()).toBe("freeze");
  });

  it("chạm nhầm lượt nogo: không cue, không mascot", () => {
    const session = openSession();
    session.onTapStimulus();
    session.update(ISI_MS + 1);
    session.takeSfxCues();

    session.onTapStimulus();

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("bỏ sót lượt go: không cue, không mascot (trung tính)", () => {
    const session = openSession();
    session.update(WINDOW_MS + 1);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });
});
