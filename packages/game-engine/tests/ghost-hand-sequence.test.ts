import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { resolveGhostHandFrame } from "#src/systems/ghost-hand-sequence";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures.js";
import { GT035Session } from "#src/templates/GT-035/session.js";

/** Task #313 — bàn tay ma chạy chuỗi bước tuần tự (BR-E035-12, BR-SCF-09). */
describe("resolveGhostHandFrame", () => {
  it("chia chu kỳ theo bước: mỗi bước một cycleMs, tiến độ chạy 0→1", () => {
    expect(resolveGhostHandFrame(3, 1000, 0)).toEqual({ step: 0, progress: 0 });
    expect(resolveGhostHandFrame(3, 1000, 500)).toEqual({
      step: 0,
      progress: 0.5,
    });
    expect(resolveGhostHandFrame(3, 1000, 1000)).toEqual({
      step: 1,
      progress: 0,
    });
    expect(resolveGhostHandFrame(3, 1000, 2750)).toEqual({
      step: 2,
      progress: 0.75,
    });
  });

  it("hết bước thì lặp lại từ bước đầu", () => {
    expect(resolveGhostHandFrame(3, 1000, 3000)).toEqual({
      step: 0,
      progress: 0,
    });
    expect(resolveGhostHandFrame(3, 1000, 4250).step).toBe(1);
  });

  it("một bước thì hành vi như cũ", () => {
    expect(resolveGhostHandFrame(1, 1000, 1250)).toEqual({
      step: 0,
      progress: 0.25,
    });
  });
});

function loadGT035(): GameEngine {
  const f = GT035_FIXTURES[0];
  if (!f) {
    throw new Error("Thiếu fixture GT-035");
  }
  const engine = new GameEngine();
  engine.load(
    {
      level_code: "LVL-035",
      content_version: 1,
      template_code: "GT-035",
      content_pack: f.content,
      difficulty_params: f.difficulty,
      theme_id: "default",
      age_band: "5-6",
      reduced_motion: false,
      audio_enabled: false,
    },
    () => new GT035Session(f.content, f.difficulty)
  );
  return engine;
}

describe("runtime: chuỗi bàn tay ma ở L3", () => {
  it("GT-035 ở L3 có ba bước, bước đầu trùng demoGhostHand", () => {
    const engine = loadGT035();
    for (let i = 0; i < 80; i++) {
      engine.advanceFrame(1000);
    }
    expect(engine.scaffolding?.getCurrentLevel()).toBe(3);
    expect(engine.demoGhostSequence.length).toBe(3);
    expect(engine.demoGhostHand).toEqual(engine.demoGhostSequence[0]);
    engine.destroy();
  });

  it("hint về L0 thì chuỗi được dọn", () => {
    const engine = loadGT035();
    for (let i = 0; i < 80; i++) {
      engine.advanceFrame(1000);
    }
    engine.scaffolding?.resetOnSuccess();
    engine.advanceFrame(10);
    expect(engine.demoGhostSequence.length).toBe(0);
    expect(engine.demoGhostHand).toBeNull();
    engine.destroy();
  });

  it("engine không cài hook thì không có chuỗi, chỉ một bàn tay như cũ", () => {
    const f = GT001_FIXTURES[0];
    if (!f) {
      throw new Error("Thiếu fixture GT-001");
    }
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-001",
        content_version: 1,
        template_code: "GT-001",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: false,
      },
      () => new GT001Session(f.content, f.difficulty)
    );
    for (let i = 0; i < 80; i++) {
      engine.advanceFrame(1000);
    }
    expect(engine.demoGhostSequence.length).toBe(0);
    expect(engine.demoGhostHand).not.toBeNull();
    engine.destroy();
  });
});
