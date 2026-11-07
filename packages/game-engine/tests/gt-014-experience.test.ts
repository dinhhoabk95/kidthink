import { describe, expect, it } from "vitest";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures.js";
import { BalanceScaleSession } from "#src/templates/GT-014/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 700;
const WONDER_MS = 1500;
const BALANCE = GT014_FIXTURES.find((f) => f.content.goal === "balance");
const PICK = GT014_FIXTURES.find((f) => f.content.goal === "pick_heavier");

function openSession(fixture: (typeof GT014_FIXTURES)[number] | undefined) {
  if (!fixture) {
    throw new Error("Thiếu fixture GT-014");
  }
  const session = new BalanceScaleSession(
    fixture.content,
    fixture.difficulty,
    0
  );
  session.prepareRound("5-6");
  return { session, content: fixture.content };
}

describe("GT-014: khung chuyện Hà Mã Nhỏ chơi bập bênh, tiếng kẽo kẹt, mascot đáp lại thao tác (BR-E014-05)", () => {
  it("storyLine khớp goal: chọn bên không nhắc đặt quả cân, cân bằng không nhắc chọn bên", () => {
    const pick = openSession(PICK).session.storyLine() ?? "";
    const balance = openSession(BALANCE).session.storyLine() ?? "";

    expect(pick).toContain("Hà Mã Nhỏ");
    expect(pick).not.toContain("quả cân");
    expect(balance).toContain("bằng nhau");
    expect(balance).not.toContain("nặng hơn");
  });

  it("storyLine nhắc Hà Mã Nhỏ và bập bênh, không nhắc Gấu Con", () => {
    const story = openSession(BALANCE).session.storyLine() ?? "";

    expect(story).toContain("Hà Mã Nhỏ");
    expect(story).toContain("bập bênh");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const { session } = openSession(BALANCE);
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Hà Mã");
  });

  it("đặt vật rồi nhấc vật: mỗi lần một cue scale_creak, mascot happy rồi null", () => {
    const { session, content } = openSession(BALANCE);
    const itemId = content.tray[0]?.item_id ?? "";
    session.commit({
      type: "place_item",
      data: { item_id: itemId, target_pan: "left" },
    });
    expect(session.takeSfxCues()).toEqual(["scale_creak"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({
      type: "return_item",
      data: { item_id: itemId, from_pan: "left" },
    });
    expect(session.takeSfxCues()).toEqual(["scale_creak"]);
  });

  it("pick_heavier: chọn sai bên là wonder, không cue; chọn đúng thì thắng, mascot null", () => {
    const { session } = openSession(PICK);
    const leftIsHeavier = session.getLeftWeight() > session.getRightWeight();
    session.commit({
      type: "select_side",
      data: leftIsHeavier ? "right" : "left",
    });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({
      type: "select_side",
      data: leftIsHeavier ? "left" : "right",
    });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
