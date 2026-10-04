import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";

/** `BR-E026-04`: kích thích chỉ hiện khi cổng cử chỉ mở — hiện thì chạm được. */
describe("GT-026 — kích thích ẩn khi cổng cử chỉ đóng", () => {
  const fixture = GT026_FIXTURES.find((f) => !f.difficulty.untimed);
  if (!fixture) {
    throw new Error("Timed fixture missing");
  }
  const { content, difficulty } = fixture;

  function buildEngine(): { engine: GameEngine; session: GT026Session } {
    const session = new GT026Session(content, difficulty);
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-026",
        content_version: 1,
        template_code: "GT-026",
        content_pack: content,
        difficulty_params: difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => session
    );
    return { engine, session };
  }

  it("getView không có entity khi cổng đóng, có khi cổng mở", () => {
    const { engine, session } = buildEngine();
    engine.acceptingInput = false;
    engine.advanceFrame(16);
    expect(session.getView().entities).toHaveLength(0);

    engine.acceptingInput = true;
    engine.advanceFrame(16);
    expect(session.getView().entities).toHaveLength(1);
  });

  it("hint không trỏ vào kích thích khi cổng đóng", () => {
    const { engine, session } = buildEngine();
    engine.acceptingInput = false;
    engine.advanceFrame(16);
    expect(session.getHintTargetIndex()).toBeNull();
  });

  it("chạm ngay khi kích thích hiện thì tính là một lượt thật", () => {
    const { engine, session } = buildEngine();
    engine.acceptingInput = false;
    engine.advanceFrame(difficulty.stimulus_window_ms * 3);
    engine.acceptingInput = true;
    engine.advanceFrame(16);
    expect(session.getView().entities).toHaveLength(1);
    expect(session.getCurrentTrial()?.id).toBe(content.trials[0]?.id);
  });
});
