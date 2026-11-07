import { describe, expect, it } from "vitest";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT009Session } from "#src/templates/GT-009/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const LISTEN_MS = 1200;
const WONDER_MS = 1500;
const FIXTURE = GT009_FIXTURES[0] ?? failMissingFixture();
const CLUE_ID = FIXTURE.content.clues[0]?.clue_id ?? "";
const ANSWER_ID = FIXTURE.content.answer_candidate_id;
const WRONG_ID =
  FIXTURE.content.candidates.find((c) => c.candidate_id !== ANSWER_ID)
    ?.candidate_id ?? "";

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-009");
}

function openSession(): GT009Session {
  const session = new GT009Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function revealClue(session: GT009Session): void {
  session.commit({ type: "reveal_clue", data: { clue_id: CLUE_ID } });
}

function select(session: GT009Session, id: string): void {
  session.commit({ type: "select_candidate", data: { candidate_id: id } });
}

describe("GT-009: khung chuyện Chồn Thám Tử, tiếng tinh, mascot đáp lại kết quả (BR-E009-07)", () => {
  it("storyLine nhắc Chồn Thám Tử và manh mối, không nhắc Vịt Con hay Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Chồn Thám Tử");
    expect(story).toContain("manh mối");
    expect(story).not.toContain("Vịt Con");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Chồn");
  });

  it("manh mối mới: một cue clue_ping và listen; chạm lại hoặc úp ứng viên thì không", () => {
    const session = openSession();
    revealClue(session);
    expect(session.takeSfxCues()).toEqual(["clue_ping"]);
    expect(session.mascotMood()).toBe("listen");
    session.update(LISTEN_MS + 1);
    expect(session.mascotMood()).toBeNull();

    revealClue(session);
    session.commit({ type: "toggle_eliminate", data: { item_id: WRONG_ID } });
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn ứng viên sai: wonder rồi null, không cue; chọn đúng thì thắng, mascot null", () => {
    const session = openSession();
    select(session, WRONG_ID);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    select(session, ANSWER_ID);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });

  it("manh mối engine tự lật sau các lần chọn sai không xếp cue clue_ping", () => {
    const session = openSession();
    for (const c of FIXTURE.content.candidates) {
      if (c.candidate_id !== ANSWER_ID) {
        select(session, c.candidate_id);
      }
    }

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
  });
});
