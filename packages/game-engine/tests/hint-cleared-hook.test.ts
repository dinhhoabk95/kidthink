import { describe, expect, it } from "vitest";
import { GameEngine, type HintLevel, type HintTarget } from "#src/index";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";

/**
 * Task #313 — trợ giúp về `L0` (trẻ vừa làm đúng) thì session được báo để dọn
 * trạng thái gợi ý riêng (vd GT-034 phát lặp mẫu nửa tốc độ, GT-032 cột nước
 * tách): không có hook này gợi ý cũ ở lại trên màn và trong tai trẻ.
 */
const fixture = GT001_FIXTURES[0];
if (!fixture) {
  throw new Error("Fixture missing");
}
const { content, difficulty } = fixture;

class TrackingSession extends GT001Session {
  shownLevel: 0 | HintLevel = 0;
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    this.shownLevel = level;
    return super.getHintTargetForLevel(level);
  }
  override onHintCleared(): void {
    this.shownLevel = 0;
  }
}

function build(session: GT001Session): GameEngine {
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
      audio_enabled: false,
    },
    () => session
  );
  return engine;
}

describe("onHintCleared — trợ giúp về L0 thì session dọn gợi ý riêng", () => {
  it("leo lên L1+ rồi resetScaffolding: session nhận onHintCleared", () => {
    const session = new TrackingSession(content, difficulty);
    const engine = build(session);
    for (let i = 0; i < 20 && session.shownLevel === 0; i++) {
      engine.advanceFrame(1000);
    }
    expect(session.shownLevel).toBeGreaterThan(0);
    engine.resetScaffolding();
    expect(session.shownLevel).toBe(0);
    engine.destroy();
  });
});
