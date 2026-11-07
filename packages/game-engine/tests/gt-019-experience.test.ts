import { describe, expect, it } from "vitest";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT019_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-019");
}

function openSession(): GT019Session {
  const session = new GT019Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

describe("GT-019: khung chuyện Dơi Con chiếu bóng bằng đèn pin, tiếng tách khi xoay, mascot đáp lại (BR-E019-07)", () => {
  it("storyLine nhắc Dơi Con, đèn pin, bóng và xoay; không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Dơi Con");
    expect(story).toContain("đèn pin");
    expect(story).toContain("bóng");
    expect(story).toContain("xoay");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Dơi");
  });

  it("xoay mảnh: mỗi lần một cue torch_click, như nhau dù đã đúng hướng hay chưa, mascot null", () => {
    const session = openSession();
    const pieceId = FIXTURE.content.pieces[0]?.piece_id ?? "";
    session.onRotatePiece(pieceId, "cw");
    expect(session.takeSfxCues()).toEqual(["torch_click"]);
    session.onRotatePiece(pieceId, "cw");
    expect(session.takeSfxCues()).toEqual(["torch_click"]);
    expect(session.mascotMood()).toBeNull();
  });

  it("đặt chưa khớp hướng: wonder rồi null; đặt đúng mà chưa xong cả bộ: happy rồi null", () => {
    const fixture = GT019_FIXTURES.find((f) => f.content.pieces.length >= 2);
    if (!fixture) {
      throw new Error("Thiếu fixture GT-019 nhiều mảnh");
    }
    const session = new GT019Session(fixture.content, fixture.difficulty, 0);
    session.prepareRound("5-6");
    const piece = fixture.content.pieces[0];
    const slot = fixture.content.target_slots.find(
      (s) => s.slot_id === piece?.target_slot_id
    );
    const pieceId = piece?.piece_id ?? "";
    const slotId = slot?.slot_id ?? "";
    expect(session.getPieceTransform(pieceId)?.rotation).not.toBe(
      slot?.target_rotation
    );
    session.onPlacePiece(pieceId, slotId);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    for (let i = 0; i < 4; i++) {
      if (
        session.getPieceTransform(pieceId)?.rotation === slot?.target_rotation
      ) {
        break;
      }
      session.onRotatePiece(pieceId, "cw");
    }
    session.onPlacePiece(pieceId, slotId);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
