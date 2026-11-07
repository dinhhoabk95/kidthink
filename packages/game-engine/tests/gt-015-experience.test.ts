import { describe, expect, it } from "vitest";
import { GT015_FIXTURES } from "#src/templates/GT-015/fixtures.js";
import { SudokuMiniSession } from "#src/templates/GT-015/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const CHEER_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT015_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-015");
}

function openSession(): SudokuMiniSession {
  const session = new SudokuMiniSession(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function fill(
  session: SudokuMiniSession,
  row: number,
  col: number,
  symbolId: string | null
): void {
  session.commit({
    type: "fill_cell",
    data: { row, col, symbol_id: symbolId },
  });
}

describe("GT-015: khung chuyện Hươu Cao Cổ xếp chỗ ngồi, tiếng bịch, mascot đáp lại kết quả (BR-E015-07)", () => {
  it("storyLine nhắc Hươu Cao Cổ và chỗ ngồi, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Hươu Cao Cổ");
    expect(story).toContain("chỗ ngồi");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Hươu");
  });

  it("đặt hợp lệ: một cue seat_pat, mascot cheer rồi null", () => {
    const session = openSession();
    fill(session, 0, 1, "dog");

    expect(session.takeSfxCues()).toEqual(["seat_pat"]);
    expect(session.mascotMood()).toBe("cheer");
    session.update(CHEER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("đặt trùng: wonder rồi null, không cue; xoá ô không có cue", () => {
    const session = openSession();
    fill(session, 0, 1, "cat");

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    fill(session, 0, 1, null);
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("điền đủ đúng thì thắng, mascot null", () => {
    const session = openSession();
    fill(session, 0, 1, "dog");
    fill(session, 1, 1, "bird");

    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
