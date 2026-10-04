import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";

/**
 * Vòng thắng nhờ nhịp `update()` (không phải cử chỉ): GT-026 chỉ chốt lượt cuối
 * khi khoảng nghỉ ISI hết. Bề mặt chơi chỉ nghe thắng qua cử chỉ nên vòng treo
 * ở màn trống (phát hiện khi chơi thật ở trình duyệt, #283).
 */
describe("GameEngine.onSessionWon — vòng thắng ở nhịp update", () => {
  const fixture = GT026_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture missing");
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

  function playAllCorrect(engine: GameEngine, session: GT026Session): void {
    for (const trial of content.trials) {
      if (trial.kind === "go") {
        session.onTapStimulus();
        engine.advanceFrame(difficulty.isi_ms + 50);
      } else {
        engine.advanceFrame(difficulty.stimulus_window_ms + 50);
        engine.advanceFrame(difficulty.isi_ms + 50);
      }
    }
  }

  it("gọi onSessionWon đúng một lần khi lượt cuối kết thúc ở nhịp update", () => {
    const { engine, session } = buildEngine();
    let wonCalls = 0;
    engine.onSessionWon = () => {
      wonCalls++;
    };

    playAllCorrect(engine, session);
    engine.advanceFrame(1000);

    expect(session.checkWinCondition()).toBe(true);
    expect(wonCalls).toBe(1);
    engine.destroy();
  });

  it("không gọi onSessionWon khi vòng chưa thắng", () => {
    const { engine, session } = buildEngine();
    let wonCalls = 0;
    engine.onSessionWon = () => {
      wonCalls++;
    };

    session.onTapStimulus();
    engine.advanceFrame(difficulty.isi_ms + 50);

    expect(session.checkWinCondition()).toBe(false);
    expect(wonCalls).toBe(0);
    engine.destroy();
  });

  it("BR-E026-04: cổng cử chỉ đóng thì cửa sổ kích thích đứng yên, không ghi miss", () => {
    const { engine, session } = buildEngine();
    engine.acceptingInput = false;

    for (let i = 0; i < 10; i++) {
      engine.advanceFrame(difficulty.stimulus_window_ms);
    }

    expect(session.getCurrentTrial()?.id).toBe(content.trials[0]?.id);
    expect(session.getState()).toBe("stimulus");

    engine.acceptingInput = true;
    engine.advanceFrame(difficulty.stimulus_window_ms + 50);

    expect(session.getState()).toBe("isi");
    engine.destroy();
  });
});
