import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";

/**
 * BR-E026-06/08: lượt nogo kìm được là một lần thử đúng, engine báo verdict của
 * nhịp `update()` cho bề mặt chơi để telemetry có `answer_*`; lượt go bỏ sót là
 * trung tính nên không có verdict.
 */
describe("GameEngine.onUpdateVerdict — verdict ở nhịp update", () => {
  const fixture = GT026_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture missing");
  }
  const { content, difficulty } = fixture;

  it("báo verdict đúng cho lượt nogo kìm được; lượt go bỏ sót là trung tính, không có verdict (BR-E026-08)", () => {
    const trials = ["nogo", "go", "nogo", "nogo"] as const;
    const mixed = {
      ...content,
      trials: trials.map((kind, i) => ({ id: `t${i}`, kind })),
    };
    const session = new GT026Session(mixed, difficulty);
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-026",
        content_version: 1,
        template_code: "GT-026",
        content_pack: mixed,
        difficulty_params: difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => session
    );
    const verdicts: boolean[] = [];
    engine.onUpdateVerdict = (isCorrect: boolean) => {
      verdicts.push(isCorrect);
    };

    for (const _ of trials) {
      engine.advanceFrame(10_000);
      engine.advanceFrame(difficulty.isi_ms + 50);
    }

    expect(verdicts).toEqual([true, true, true]);
    engine.destroy();
  });
});
