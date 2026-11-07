import { describe, expect, it } from "vitest";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures.js";
import { GT020Session } from "#src/templates/GT-020/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const FIXTURE = GT020_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-020");
}

/** Phiên đã hết giai đoạn xem trước, sẵn sàng nhận lật thẻ. */
function openSession(): GT020Session {
  const session = new GT020Session(FIXTURE.content, FIXTURE.difficulty);
  session.prepareRound("3-4");
  session.update(FIXTURE.difficulty.peek_all_initial_ms + 1);
  return session;
}

function tap(session: GT020Session, cardId: string): void {
  session.commit({ type: "tap_card", data: { card_id: cardId } });
}

describe("GT-020: khung chuyện, tiếng lật, mascot nhớ lại (BR-E020-07)", () => {
  it("storyLine nhắc Gấu Con và việc tìm hai bạn giống nhau", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Gấu Con");
    expect(story).toContain("giống nhau");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Gấu Con"))).toBe(false);
  });

  it("mỗi lần lật được thẻ úp xếp một cue card_flip", () => {
    const session = openSession();
    tap(session, "cat-1");

    expect(session.takeSfxCues()).toEqual(["card_flip"]);
  });

  it("chạm lại thẻ đang ngửa không xếp thêm cue", () => {
    const session = openSession();
    tap(session, "cat-1");
    session.takeSfxCues();
    tap(session, "cat-1");

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("chạm thẻ đã ghép không có cue", () => {
    const session = openSession();
    tap(session, "cat-1");
    tap(session, "cat-2");
    session.takeSfxCues();
    tap(session, "cat-1");

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("lúc xem trước chưa lật được nên không có cue", () => {
    const session = new GT020Session(FIXTURE.content, FIXTURE.difficulty);
    session.prepareRound("3-4");
    tap(session, "cat-1");

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot: null → wonder khi một thẻ chờ cặp → null khi ghép được", () => {
    const session = openSession();
    expect(session.mascotMood()).toBeNull();

    tap(session, "cat-1");
    expect(session.mascotMood()).toBe("wonder");

    tap(session, "cat-2");
    expect(session.mascotMood()).toBeNull();
  });

  it("cặp lệch đang mở vẫn là wonder, đóng lại thì null", () => {
    const session = openSession();
    tap(session, "cat-1");
    tap(session, "dog-1");
    expect(session.mascotMood()).toBe("wonder");

    session.update(FIXTURE.difficulty.flip_back_delay_ms + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
