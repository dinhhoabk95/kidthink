import { describe, expect, it } from "vitest";
import { GameEngine, type HintLevel, type HintTarget } from "#src/index";
import { RenderSystem } from "#src/systems/render-system";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures.js";
import { GT003Session } from "#src/templates/GT-003/session.js";

/** Task #313 Phase 2 — `demo_shown` chỉ khi bàn tay ma thật sự được vẽ. */
const fixture = GT001_FIXTURES[0];
if (!fixture) {
  throw new Error("Fixture missing");
}
const { content, difficulty } = fixture;

class ActionHintSession extends GT001Session {
  override getHintTargetForLevel(_level: HintLevel): HintTarget | null {
    return { kind: "action" };
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

function demoEvents(engine: GameEngine): number {
  let count = 0;
  engine.on("demo_shown", () => {
    count++;
  });
  // L2 của band 3-4 tới sau ~18s.
  for (let i = 0; i < 20; i++) {
    engine.advanceFrame(1000);
  }
  return count;
}

describe("demo_shown gắn với bàn tay ma thật", () => {
  it("hint trỏ vào slot ở L2 thì phát demo_shown và có bàn tay để vẽ", () => {
    const engine = build(new GT001Session(content, difficulty));
    expect(demoEvents(engine)).toBeGreaterThanOrEqual(1);
    expect(engine.demoGhostHand).not.toBeNull();
    engine.destroy();
  });

  it("hint chỉ là nút hành động (không vẽ được tay) thì không phát demo_shown", () => {
    const engine = build(new ActionHintSession(content, difficulty));
    expect(demoEvents(engine)).toBe(0);
    expect(engine.demoGhostHand).toBeNull();
    engine.destroy();
  });
});

describe("GT-003: bàn tay ma kéo từ vật tới ô đích", () => {
  it("L2 có nguồn và đích", () => {
    const f = GT003_FIXTURES[0];
    if (!f) {
      throw new Error("Fixture missing");
    }
    const engine = new GameEngine();
    engine.load(
      {
        level_code: "LVL-003",
        content_version: 1,
        template_code: "GT-003",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "3-4",
        reduced_motion: false,
        audio_enabled: false,
      },
      () => new GT003Session(f.content, f.difficulty)
    );
    for (let i = 0; i < 30; i++) {
      engine.advanceFrame(1000);
    }
    expect(engine.demoGhostHand?.to).not.toBeNull();
    expect(engine.demoGhostHand?.to).toBeDefined();
    engine.destroy();
  });
});

describe("RenderSystem.renderGhostHand", () => {
  function recordingCtx(): { ctx: CanvasRenderingContext2D; calls: string[] } {
    const calls: string[] = [];
    const ctx = new Proxy(
      {},
      {
        get: (_t, prop: string) => {
          if (prop === "measureText") {
            return () => ({ width: 10 });
          }
          return (..._a: unknown[]) => {
            calls.push(prop);
          };
        },
        set: () => true,
      }
    ) as CanvasRenderingContext2D;
    return { ctx, calls };
  }

  it("vẽ bàn tay (fillText) khi toạ độ hợp lệ, bỏ qua khi NaN", () => {
    const rs = new RenderSystem();
    const ok = recordingCtx();
    rs.renderGhostHand(ok.ctx, { x: 10, y: 10 }, { x: 100, y: 100 }, 0.5);
    expect(ok.calls).toContain("fillText");
    const bad = recordingCtx();
    rs.renderGhostHand(bad.ctx, { x: Number.NaN, y: 10 }, null, 0.5);
    expect(bad.calls).not.toContain("fillText");
  });
});
