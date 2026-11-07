import { describe, expect, it } from "vitest";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import { GT021Session } from "#src/templates/GT-021/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT021_FIXTURES.find((f) => f.content.target_slots.length >= 2);

function openSession(): GT021Session {
  if (!FIXTURE) {
    throw new Error("Thiếu fixture GT-021 nhiều ô đích");
  }
  const session = new GT021Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function firstPair(): { good: string; bad: string; slot: string } {
  const target = FIXTURE?.content.target_slots[0];
  const options = FIXTURE?.content.options ?? [];
  const good = options.find((o) => o.asset_ref === target?.expected_asset_ref);
  const bad = options.find((o) => o.asset_ref !== target?.expected_asset_ref);
  return {
    good: good?.item_id ?? "",
    bad: bad?.item_id ?? "",
    slot: target?.slot_id ?? "",
  };
}

describe("GT-021: khung chuyện Cô Tiên và gương thần, tiếng lấp lánh khi khớp, mascot đáp lại (BR-E021-06)", () => {
  it("storyLine nhắc Cô Tiên và gương thần, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Cô Tiên");
    expect(story).toContain("gương thần");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Cô Tiên");
  });

  it("đặt đúng ô: một cue mirror_chime, mascot happy rồi null", () => {
    const session = openSession();
    const { good, slot } = firstPair();
    session.onPlaceOption(good, slot);

    expect(session.takeSfxCues()).toEqual(["mirror_chime"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("đặt sai: không cue, mascot wonder rồi null", () => {
    const session = openSession();
    const { bad, slot } = firstPair();
    session.onPlaceOption(bad, slot);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
