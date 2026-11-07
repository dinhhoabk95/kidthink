import { describe, expect, it } from "vitest";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures.js";
import { GT028Session } from "#src/templates/GT-028/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HOP_MS = 700;
const WONDER_MS = 1500;
const FIXTURE = GT028_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-028");
}

function openSession(): GT028Session {
  const session = new GT028Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function tapItems(session: GT028Session, count: number, from = 0): void {
  for (const item of FIXTURE.content.items.slice(from, from + count)) {
    session.onTapItem(item.item_id);
  }
}

describe("GT-028: khung chuyện Ếch Xanh nhảy cóc, tiếng nhảy, mascot nhảy theo (BR-E028-06)", () => {
  it("storyLine nhắc Ếch Xanh và việc nhảy trên tia số, không nhắc Gấu Con", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Ếch Xanh");
    expect(story).toContain("tia số");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn).toEqual([]);
  });

  it("mỗi lần chạm thêm một vật xếp một cue frog_hop; bỏ chọn thì không", () => {
    const session = openSession();
    tapItems(session, 2);
    expect(session.takeSfxCues()).toEqual(["frog_hop", "frog_hop"]);

    const first = FIXTURE.content.items[0];
    session.onTapItem(first?.item_id ?? "");
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot happy ngắn sau mỗi bước nhảy rồi về null; chưa chạm thì null", () => {
    const session = openSession();
    expect(session.mascotMood()).toBeNull();

    tapItems(session, 1);
    expect(session.mascotMood()).toBe("happy");
    session.update(HOP_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("nộp sai: wonder ngắn, không cue; nộp đúng: thắng thì mascot null", () => {
    const session = openSession();
    tapItems(session, 1);
    session.takeSfxCues();
    session.onSubmitCount();
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    // Vật đầu đã chọn: chạm tiếp các vật còn lại cho đủ đích.
    const steps = FIXTURE.content.target_total / FIXTURE.content.step;
    tapItems(session, steps - 1, 1);
    session.onSubmitCount();
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
