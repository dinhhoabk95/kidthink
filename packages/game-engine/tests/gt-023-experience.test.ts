import { describe, expect, it } from "vitest";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT023_FIXTURES.find((f) => f.content.parts.length >= 2);

function openSession(): GT023Session {
  if (!FIXTURE) {
    throw new Error("Thiếu fixture GT-023 nhiều mảnh");
  }
  const session = new GT023Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

describe("GT-023: khung chuyện Chim Gõ Kiến lắp mô hình gỗ, tiếng click khi khớp, mascot đáp lại (BR-E023-07)", () => {
  it("storyLine nhắc Chim Gõ Kiến, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Chim Gõ Kiến");
    expect(story).toContain("mảnh");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Gõ Kiến");
  });

  it("mảnh vào đúng neo: một cue piece_click, mascot happy rồi null", () => {
    const session = openSession();
    const part = FIXTURE?.content.parts[0];
    session.onAssemblePart(part?.part_id ?? "", part?.target_anchor_id ?? "");

    expect(session.takeSfxCues()).toEqual(["piece_click"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("mảnh vào neo không hợp: không cue, mascot wonder rồi null", () => {
    const session = openSession();
    const part = FIXTURE?.content.parts[0];
    const other = FIXTURE?.content.parts.find(
      (p) => p.target_anchor_id !== part?.target_anchor_id
    );
    session.onAssemblePart(part?.part_id ?? "", other?.target_anchor_id ?? "");

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
