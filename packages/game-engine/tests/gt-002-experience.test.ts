import { describe, expect, it } from "vitest";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures.js";
import { GT002Session } from "#src/templates/GT-002/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const CHEER_MS = 800;
const WONDER_MS = 1500;
const FIXTURE = GT002_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-002");
}

function openSession(): GT002Session {
  const session = new GT002Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function toggle(session: GT002Session, correct: boolean, nth = 0): string {
  const item = FIXTURE.content.items.filter((i) => i.is_correct === correct)[
    nth
  ];
  const itemId = item?.item_id ?? "";
  session.commit({ type: "toggle_item", data: { item_id: itemId } });
  return itemId;
}

function submit(session: GT002Session): void {
  session.commit({ type: "submit_selection", data: {} });
}

describe("GT-002: khung chuyện lưới cá, tiếng tõm, mascot đáp lại hành động (BR-E002-05)", () => {
  it("storyLine nhắc lưới và cá, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("lưới");
    expect(story).toContain("cá");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn).toEqual([]);
  });

  it("chọn cá đúng hay sai đều một cue net_splash như nhau; bỏ chọn không có cue", () => {
    const right = openSession();
    toggle(right, true);
    const wrong = openSession();
    const wrongId = toggle(wrong, false);

    expect(right.takeSfxCues()).toEqual(["net_splash"]);
    expect(wrong.takeSfxCues()).toEqual(["net_splash"]);

    wrong.commit({ type: "toggle_item", data: { item_id: wrongId } });
    expect(wrong.takeSfxCues()).toEqual([]);
  });

  it("mascot cheer ngắn sau khi chọn rồi về null, giống nhau với cá đúng và sai", () => {
    const right = openSession();
    const wrong = openSession();
    toggle(right, true);
    toggle(wrong, false);

    expect(right.mascotMood()).toBe("cheer");
    expect(wrong.mascotMood()).toBe("cheer");
    right.update(CHEER_MS + 1);
    expect(right.mascotMood()).toBeNull();
  });

  it("kéo lưới chưa đúng: wonder, không cue; kéo đúng: thắng, mascot null", () => {
    const session = openSession();
    toggle(session, false);
    session.update(CHEER_MS + 1);
    session.takeSfxCues();

    submit(session);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    toggle(session, false);
    toggle(session, true, 0);
    toggle(session, true, 1);
    session.update(CHEER_MS + 1);
    submit(session);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
