import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameEngine } from "#src/index";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";

/** Task #313 B5 — resume phát `game_resumed` kèm `paused_ms`. */
describe("GameEngine.resume phát game_resumed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("paused_ms bằng thời gian đã pause", () => {
    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture missing");
    }
    const { content, difficulty } = fixture;
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
      () => new GT001Session(content, difficulty)
    );
    const resumed: number[] = [];
    engine.on("game_resumed", (event) => {
      resumed.push(Number(event.data?.paused_ms));
    });
    engine.pause("user");
    vi.advanceTimersByTime(4200);
    engine.resume();
    expect(resumed).toEqual([4200]);
    engine.destroy();
  });
});
