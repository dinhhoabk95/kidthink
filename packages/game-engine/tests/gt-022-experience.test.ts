import { describe, expect, it } from "vitest";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import { GT022Session } from "#src/templates/GT-022/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const FOUND_MS = 1000;
const FIXTURE = GT022_FIXTURES[1] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-022");
}

function openSession(): GT022Session {
  const session = new GT022Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function idsWhere(isTarget: boolean): string[] {
  return FIXTURE.content.scene_objects
    .filter((o) => o.is_target === isTarget && !o.is_hidden)
    .map((o) => o.id);
}

describe("GT-022: khung chuyện Vịt Con, tiếng bong kính lúp, mascot nhảy ngắn (BR-E022-07)", () => {
  it("storyLine nhắc Vịt Con, kính lúp và đồ chơi lạc, không nhắc Gấu Con", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Vịt Con");
    expect(story).toContain("kính lúp");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Vịt Con"))).toBe(false);
  });

  it("tìm ra mục tiêu mới xếp một cue lens_pop; chạm lại hoặc chạm nhiễu thì không", () => {
    const session = openSession();
    const [target] = idsWhere(true);
    const [distractor] = idsWhere(false);

    session.onTapObject(distractor ?? "");
    expect(session.takeSfxCues()).toEqual([]);

    session.onTapObject(target ?? "");
    expect(session.takeSfxCues()).toEqual(["lens_pop"]);

    session.onTapObject(target ?? "");
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot: happy ngắn sau khi tìm ra, encourage ngắn sau chạm nhiễu, thắng thì null", () => {
    const session = openSession();
    const targets = idsWhere(true);
    expect(targets.length).toBeGreaterThan(1);
    expect(session.mascotMood()).toBeNull();

    session.onTapObject(idsWhere(false)[0] ?? "");
    expect(session.mascotMood()).toBe("encourage");

    session.onTapObject(targets[0] ?? "");
    expect(session.mascotMood()).toBe("happy");
    session.update(FOUND_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.onTapObject(targets[1] ?? "");
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
