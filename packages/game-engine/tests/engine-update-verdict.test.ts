import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";

/**
 * BR-E026-06: lượt hết giờ không chạm là một lần thử. Engine phải báo verdict
 * của nhịp `update()` cho bề mặt chơi để telemetry có `answer_*`.
 */
describe("GameEngine.onUpdateVerdict — verdict ở nhịp update", () => {
  const fixture = GT026_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture missing");
  }
  const { content, difficulty } = fixture;

  function buildEngine(): GameEngine {
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
    return engine;
  }

  it("báo verdict đúng cho mỗi lượt hết giờ; lượt go bỏ sót là sai", () => {
    const engine = buildEngine();
    const verdicts: boolean[] = [];
    engine.onUpdateVerdict = (isCorrect: boolean) => {
      verdicts.push(isCorrect);
    };

    for (const trial of content.trials) {
      engine.advanceFrame(difficulty.stimulus_window_ms + 50);
      engine.advanceFrame(difficulty.isi_ms + 50);
      expect(trial.kind === "go" || trial.kind === "nogo").toBe(true);
    }

    const expected = content.trials.map((trial) => trial.kind === "nogo");
    expect(verdicts).toEqual(expected);
    engine.destroy();
  });
});
