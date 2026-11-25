import { describe, expect, it } from "vitest";
import { SAMPLE_LEVEL_1 } from "#src/templates/GT-012/fixtures";
import { FlashRecallSession } from "#src/templates/GT-012/session";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function openSession(): FlashRecallSession {
  const session = new FlashRecallSession(
    SAMPLE_LEVEL_1.content_pack,
    SAMPLE_LEVEL_1.difficulty_params
  );
  session.prepareRound("3-4");
  return session;
}

describe("GT-012: khung chuyện đom đóm, tiếng mở nắp chuông, mascot ngạc nhiên (BR-E012-06)", () => {
  it("storyLine nhắc đom đóm và nắp chuông, không nhắc Gấu Con", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Đom đóm");
    expect(story).toContain("nắp chuông");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Đom đóm"))).toBe(false);
  });

  it("trước khi trẻ bấm bắt đầu: chưa có cue, mascot null", () => {
    const session = openSession();
    session.update(5000);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("bấm bắt đầu xếp cue bell_open; xem lại cũng một cue", () => {
    const session = openSession();
    session.startFlash();
    expect(session.takeSfxCues()).toEqual(["bell_open"]);

    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 50);
    expect(session.replayFlash()).toBe(true);
    expect(session.takeSfxCues()).toEqual(["bell_open"]);
  });

  it("mascot wonder từ lúc mở nắp tới khi thắng, đáp sai không đổi dáng hay xếp cue", () => {
    const session = openSession();
    session.startFlash();
    session.takeSfxCues();
    expect(session.mascotMood()).toBe("wonder");

    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms + 50);
    session.selectValue(1);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);

    session.selectValue(2);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });

  it("bước chạm để mở nắp: getHintTarget trỏ vào đĩa che, sau khi mở thì không còn", () => {
    const session = openSession();

    expect(session.getHintTarget()).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });

    session.startFlash();

    expect(session.getHintTarget()?.kind).not.toBe("region");
  });
});
