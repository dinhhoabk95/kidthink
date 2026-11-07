import { describe, expect, it } from "vitest";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures.js";
import { GT032Session } from "#src/templates/GT-032/session.js";
import { GT032ContentSchema } from "#src/templates/GT-032/template.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 600;
const WONDER_MS = 1500;
const FIXTURE = GT032_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-032");
}

function openCompare(): GT032Session {
  const session = new GT032Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function openPour(): GT032Session {
  const content = GT032ContentSchema.parse({
    prompt: "Bé hãy rót nước đến vạch 4 cho chiếc cốc nhé!",
    question_type: "pour_to_mark",
    conservation_trap: false,
    cups: [
      {
        cup_id: "cup_pour",
        shape: "standard",
        capacity_units: 6,
        fill_units: 2,
        target_units: 4,
        color: "sky",
      },
      {
        cup_id: "cup_ref",
        shape: "narrow_tall",
        capacity_units: 6,
        fill_units: 4,
        target_units: 4,
        color: "sky",
      },
    ],
  });
  const session = new GT032Session(content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

describe("GT-032: khung chuyện Ngựa Con khát nước, tiếng rót nước, mascot đáp lại (BR-E032-09)", () => {
  it("storyLine nhắc Ngựa Con và khớp loại bài: rót không có ở bài chọn cốc", () => {
    const compare = openCompare().storyLine() ?? "";
    const pour = openPour().storyLine() ?? "";

    expect(compare).toContain("Ngựa Con");
    expect(compare).not.toContain("rót");
    expect(pour).toContain("Ngựa Con");
    expect(pour).toContain("rót");
    expect(compare + pour).not.toContain("Voi");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openPour(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Ngựa");
  });

  it("rót một nấc: một cue water_pour, mascot happy rồi null, như nhau dù chưa tới vạch hay đã tới", () => {
    const session = openPour();
    session.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", delta: 1 },
    });
    expect(session.takeSfxCues()).toEqual(["water_pour"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", delta: 1 },
    });
    expect(session.takeSfxCues()).toEqual(["water_pour"]);
  });

  it("chốt khi chưa tới vạch: không cue, mascot wonder rồi null", () => {
    const session = openPour();
    session.commit({ type: "confirm_pour", data: {} });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn cốc sai: wonder; chọn đúng thì thắng, mascot null", () => {
    const session = openCompare();
    const wrong = FIXTURE.content.cups.find((c) => !session.isCupCorrect(c));
    const right = FIXTURE.content.cups.find((c) => session.isCupCorrect(c));
    session.commit({ type: "select_cup", data: { cup_id: wrong?.cup_id } });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");

    session.commit({ type: "select_cup", data: { cup_id: right?.cup_id } });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
