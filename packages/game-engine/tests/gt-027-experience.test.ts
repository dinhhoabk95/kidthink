import { describe, expect, it } from "vitest";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 700;
const WONDER_MS = 1500;
const FIXTURE = GT027_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-027");
}

function openSession(): GT027Session {
  const session = new GT027Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

type Item = (typeof FIXTURE.content.items)[number];

function matchesFirstRule(item: Item): boolean {
  const rule = FIXTURE.content.rules[0];
  if (rule?.dimension === "color") {
    return item.color === rule.target_value;
  }
  if (rule?.dimension === "shape") {
    return item.shape === rule.target_value;
  }
  return item.size === rule?.target_value;
}

describe("GT-027: khung chuyện Cáo Con thổi còi đổi luật, tiếng còi khi đổi luật, mascot đáp lại (BR-E027-05)", () => {
  it("storyLine nhắc Cáo Con và còi, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Cáo Con");
    expect(story).toContain("còi");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Cáo Con");
  });

  it("chọn đúng chưa đổi luật: không cue, mascot happy rồi null", () => {
    const session = openSession();
    const good = FIXTURE.content.items.find(matchesFirstRule);
    session.onSelectItem(good?.id ?? "");

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn sai: không cue, mascot wonder rồi null", () => {
    const session = openSession();
    const bad = FIXTURE.content.items.find((i) => !matchesFirstRule(i));
    session.onSelectItem(bad?.id ?? "");

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("lượt đúng làm đổi luật: một cue rule_whistle, mascot listen suốt lúc báo rồi null", () => {
    const session = openSession();
    const good = FIXTURE.content.items.find(matchesFirstRule);
    for (let i = 0; i < FIXTURE.content.switch_after_trials; i++) {
      session.onSelectItem(good?.id ?? "");
    }

    expect(session.takeSfxCues()).toEqual(["rule_whistle"]);
    expect(session.isSignaling()).toBe(true);
    expect(session.mascotMood()).toBe("listen");
    session.update(FIXTURE.difficulty.signal_duration_ms + 1);
    expect(session.mascotMood()).toBeNull();
  });
});
