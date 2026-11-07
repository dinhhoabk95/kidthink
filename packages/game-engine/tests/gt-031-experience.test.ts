import { describe, expect, it } from "vitest";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures.js";
import { GT031Session } from "#src/templates/GT-031/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const ENCOURAGE_MS = 1500;
const FIXTURE = GT031_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-031");
}

function openSession(): GT031Session {
  const session = new GT031Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function deposit(session: GT031Session, coinId: string): void {
  session.commit({ type: "deposit_coin", data: { coin_id: coinId } });
}

describe("GT-031: khung chuyện Heo Đất đi chợ quê, tiếng xu rơi, mascot chỉ động viên khi trả chưa đủ (BR-E031-08)", () => {
  it("storyLine nhắc Heo Đất, chợ quê và xu, không nhắc Gấu Con", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Heo Đất");
    expect(story).toContain("chợ quê");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn).toEqual([]);
  });

  it("mỗi xu bỏ vào heo xếp một cue coin_clink; gỡ xu thì không", () => {
    const session = openSession();
    deposit(session, "c1_1");
    deposit(session, "c2_1");
    expect(session.takeSfxCues()).toEqual(["coin_clink", "coin_clink"]);

    session.commit({ type: "remove_coin", data: { coin_id: "c2_1" } });
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("xu đã bỏ rồi không bỏ lại: không thêm cue", () => {
    const session = openSession();
    deposit(session, "c1_1");
    session.takeSfxCues();
    deposit(session, "c1_1");

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("bỏ xu không đổi dáng mascot và không báo đúng sai trước khi trả", () => {
    const session = openSession();
    deposit(session, "c1_1");
    deposit(session, "c2_1");

    expect(session.mascotMood()).toBeNull();
  });

  it("trả chưa đủ: encourage 1500 ms rồi null; trả đủ: thắng, mascot null", () => {
    const session = openSession();
    deposit(session, "c1_1");
    session.commit({ type: "pay", data: {} });
    expect(session.mascotMood()).toBe("encourage");
    session.update(ENCOURAGE_MS + 1);
    expect(session.mascotMood()).toBeNull();

    deposit(session, "c2_1");
    session.commit({ type: "pay", data: {} });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
