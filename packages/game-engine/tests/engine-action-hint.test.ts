import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures.js";
import { GT002Session } from "#src/templates/GT-002/session.js";

/**
 * Gợi ý có thể trỏ vào nút hành động ở `zones.action` (`BR-PSZ-05`, Task #283
 * B2): khi mọi vật đúng đã chọn, bước kế là bấm Xong nên `core` bật
 * `actionHinted` để shell nháy nút, không vẽ vòng hổ phách quanh slot nào.
 */
describe("GameEngine.actionHinted (BR-PSZ-05)", () => {
  const fixture = GT002_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture missing");
  }
  const { content, difficulty } = fixture;
  const HINT_ADVANCE_MS = 1000;
  const HINT_FRAMES = 40;

  function buildEngine(): { engine: GameEngine; session: GT002Session } {
    const session = new GT002Session(content, difficulty, 1);
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-002",
        content_version: 1,
        template_code: "GT-002",
        content_pack: content,
        difficulty_params: difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: false,
      },
      () => session
    );
    session.prepareRound("4-5");
    return { engine, session };
  }

  function selectAllCorrect(session: GT002Session): void {
    for (const item of content.items.filter((i) => i.is_correct)) {
      session.toggleItemSelection(item.item_id);
    }
  }

  function runHintClock(engine: GameEngine): void {
    for (let i = 0; i < HINT_FRAMES; i++) {
      engine.advanceFrame(HINT_ADVANCE_MS);
    }
  }

  it("chọn đủ vật đúng rồi chờ trợ giúp: actionHinted bật, không có focusIndex", () => {
    const { engine, session } = buildEngine();
    selectAllCorrect(session);

    runHintClock(engine);

    expect(engine.actionHinted).toBe(true);
    expect(engine.focusIndex).toBeNull();
    engine.destroy();
  });

  it("ca âm: chưa chọn vật nào thì gợi ý trỏ vào vật, actionHinted tắt", () => {
    const { engine } = buildEngine();

    runHintClock(engine);

    expect(engine.actionHinted).toBe(false);
    expect(engine.focusIndex).not.toBeNull();
    engine.destroy();
  });
});
