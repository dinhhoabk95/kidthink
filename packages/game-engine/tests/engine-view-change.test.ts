import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";

/**
 * Session thời gian thực đổi `getView().entities` giữa hai cử chỉ (kích thích
 * hiện/ẩn ở GT-026). Danh sách nút ẩn cho trình đọc màn hình phải theo kịp:
 * engine báo `onViewChanged` đúng khi tập thực thể đổi, không báo mỗi khung.
 */
describe("GameEngine.onViewChanged — danh sách thực thể đổi ở nhịp update", () => {
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

  it("báo khi kích thích ẩn đi ở khoảng nghỉ và hiện lại ở lượt sau", () => {
    const engine = buildEngine();
    let calls = 0;
    engine.onViewChanged = () => {
      calls++;
    };

    engine.advanceFrame(16);
    const afterIdle = calls;
    engine.advanceFrame(difficulty.stimulus_window_ms + 50);
    expect(calls).toBeGreaterThan(afterIdle);

    const afterHide = calls;
    engine.advanceFrame(difficulty.isi_ms + 50);
    expect(calls).toBeGreaterThan(afterHide);
    engine.destroy();
  });

  it("không báo khi tập thực thể không đổi giữa hai khung", () => {
    const engine = buildEngine();
    let calls = 0;
    engine.onViewChanged = () => {
      calls++;
    };
    engine.advanceFrame(16);
    calls = 0;

    engine.advanceFrame(16);
    engine.advanceFrame(16);

    expect(calls).toBe(0);
    engine.destroy();
  });
});
