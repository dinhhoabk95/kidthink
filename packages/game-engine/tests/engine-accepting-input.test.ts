import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";

/**
 * Đồng hồ trợ giúp (`ScaffoldingSystem`) và cử chỉ chỉ được tính từ lúc câu
 * dẫn đọc xong — không phải từ lúc vòng mở màn (Task #273, `BR-PNR-11`).
 * `GameEngine.acceptingInput` là cổng: bề mặt chơi hạ nó xuống `false` khi mở
 * vòng, và nâng lại `true` khi câu dẫn phát xong (hoặc quá hạn dự phòng).
 */
describe("GameEngine.acceptingInput / advanceFrame (BR-PNR-11)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture missing");
  }
  const { content, difficulty } = fixture;

  function buildEngine(): GameEngine {
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-001",
        content_version: 1,
        template_code: "GT-001",
        content_pack: content,
        difficulty_params: difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: true,
      },
      () => new GT001Session(content, difficulty)
    );
    return engine;
  }

  it("mặc định acceptingInput = true — không đổi hành vi cho bề mặt chưa gắn cổng câu dẫn", () => {
    const engine = buildEngine();
    expect(engine.acceptingInput).toBe(true);
    engine.destroy();
  });

  it("acceptingInput = false: đồng hồ trợ giúp không chạy, dù nhiều khung trôi qua", () => {
    const engine = buildEngine();
    engine.acceptingInput = false;

    // Band 3-4: L1 tới sau 10s hoặc 1 miss. Trôi 20s mà vẫn ở L0 mới đúng.
    for (let i = 0; i < 20; i++) {
      engine.advanceFrame(1000);
    }

    expect(engine.scaffolding?.getCurrentLevel()).toBe(0);
    engine.destroy();
  });

  it("acceptingInput = true: đồng hồ trợ giúp chạy bình thường trở lại", () => {
    const engine = buildEngine();
    engine.acceptingInput = false;
    for (let i = 0; i < 20; i++) {
      engine.advanceFrame(1000);
    }
    engine.acceptingInput = true;

    for (let i = 0; i < 11; i++) {
      engine.advanceFrame(1000);
    }

    expect(engine.scaffolding?.getCurrentLevel()).toBeGreaterThanOrEqual(1);
    engine.destroy();
  });

  it("advanceFrame vẫn gọi session.update() khi acceptingInput = false — cảnh vẫn sống", () => {
    const engine = buildEngine();
    let updateCalls = 0;
    if (engine.activeSession) {
      (engine.activeSession as GT001Session & { update: unknown }).update =
        () => {
          updateCalls++;
        };
    }
    engine.acceptingInput = false;

    engine.advanceFrame(16);

    expect(updateCalls).toBe(1);
    engine.destroy();
  });
});
