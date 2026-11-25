import { describe, expect, it, vi } from "vitest";
import {
  type ActionResult,
  BaseGameSession,
  type GameAction,
} from "#src/game-session";
import { GameEngine } from "#src/index";
import type { MascotPose } from "#src/render/mascot";
import { type RoundConfig, RoundRunner } from "#src/round-runner";
import { resolveBaseMascotPose } from "#src/systems/feedback-overlay";
import type { SFXType } from "#src/systems/sfx-engine";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";

const FIXTURE = GT001_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Fixture missing");
}

/** Session tối thiểu cho phép test xếp cue, tâm trạng và khung chuyện. */
class CueSession extends BaseGameSession {
  mood: MascotPose | null = null;
  story: string | null = null;
  setupEntities(): void {
    /* noop */
  }
  validateAction(_a: GameAction): ActionResult {
    return { valid: true, feedback: "none" };
  }
  checkWinCondition(): boolean {
    return false;
  }
  push(type: SFXType): void {
    this.queueSfx(type);
  }
  override mascotMood(): MascotPose | null {
    return this.mood;
  }
  override storyLine(): string | null {
    return this.story;
  }
}

function loadEngine(session: CueSession): GameEngine {
  const engine = new GameEngine();
  engine.load(
    {
      level_code: "LVL-CUE",
      content_version: 1,
      template_code: "GT-001",
      content_pack: FIXTURE.content,
      difficulty_params: FIXTURE.difficulty,
      theme_id: "default",
      age_band: "4-5",
      reduced_motion: false,
      audio_enabled: true,
    },
    () => session
  );
  return engine;
}

describe("BR-FBK-14 — cue âm của session", () => {
  it("takeSfxCues rút hàng đợi theo thứ tự rồi để trống", () => {
    const session = new CueSession();
    session.push("wood_tap");
    session.push("star_collect");

    expect(session.takeSfxCues()).toEqual(["wood_tap", "star_collect"]);
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("hàng đợi có trần 8 — cue thứ 9 trở đi bị bỏ", () => {
    const session = new CueSession();
    for (let i = 0; i < 20; i++) {
      session.push("wood_tap");
    }

    expect(session.takeSfxCues()).toHaveLength(8);
  });

  it("engine phát cue một lần mỗi khung, đúng thứ tự", () => {
    const session = new CueSession();
    const engine = loadEngine(session);
    const play = vi.spyOn(engine.audio, "play").mockImplementation(() => {
      /* spy */
    });
    session.push("card_flip");
    session.push("sparkle_find");

    engine.advanceFrame(16);
    engine.advanceFrame(16);

    expect(play.mock.calls.map((c) => c[0])).toEqual([
      "card_flip",
      "sparkle_find",
    ]);
    engine.destroy();
  });
});

describe("BR-FBK-15 — dáng mascot nền", () => {
  const base = { acceptingInput: true, hintLevel: 0 };

  it("mặc định idle", () => {
    expect(resolveBaseMascotPose({ ...base, session: new CueSession() })).toBe(
      "idle"
    );
  });

  it("trợ giúp thắng tâm trạng của session — trẻ đang kẹt cần thấy dáng gợi ý", () => {
    const session = new CueSession();
    session.mood = "freeze";

    expect(resolveBaseMascotPose({ ...base, hintLevel: 2, session })).toBe(
      "hint"
    );
  });

  it("chưa có trợ giúp thì tâm trạng của session thắng idle", () => {
    const session = new CueSession();
    session.mood = "freeze";

    expect(resolveBaseMascotPose({ ...base, session })).toBe("freeze");
  });

  it("lời dẫn đang đọc thì listen, thắng cả tâm trạng", () => {
    const session = new CueSession();
    session.mood = "cheer";

    expect(
      resolveBaseMascotPose({ ...base, acceptingInput: false, session })
    ).toBe("listen");
  });

  it("không tâm trạng, có trợ giúp thì hint", () => {
    expect(
      resolveBaseMascotPose({
        ...base,
        hintLevel: 1,
        session: new CueSession(),
      })
    ).toBe("hint");
  });

  it("không có session vẫn trả dáng hợp lệ", () => {
    expect(resolveBaseMascotPose({ ...base, session: null })).toBe("idle");
  });
});

describe("BR-FBK-16 — khung chuyện đọc một lần ở vòng đầu", () => {
  function runnerWith(story: string | null, rounds: number): RoundRunner {
    const configs: RoundConfig[] = [];
    for (let i = 0; i < rounds; i++) {
      configs.push({
        round_index: i,
        content_pack: {},
        difficulty_params: { item_count: 3, hint_after_ms: 2000 },
      });
    }
    const runner = new RoundRunner({
      rounds: configs,
      sessionFactory: () => {
        const s = new CueSession();
        s.story = story;
        return s;
      },
      onPlayNarration: () => {
        /* shell tự phát */
      },
    });
    runner.startFirstRound();
    return runner;
  }

  it("vòng đầu, mở vòng: khung chuyện đứng trước câu dẫn", () => {
    const runner = runnerWith("Gấu Con đi chợ.", 2);

    expect(runner.spokenPromptFor("Chọn quả táo", "round_open")).toEqual([
      "Gấu Con đi chợ.",
      "Chọn quả táo",
    ]);
  });

  it("nghe lại chỉ đọc câu dẫn", () => {
    const runner = runnerWith("Gấu Con đi chợ.", 2);

    expect(runner.spokenPromptFor("Chọn quả táo", "replay")).toBe(
      "Chọn quả táo"
    );
  });

  it("session không khai khung chuyện thì giữ nguyên câu dẫn", () => {
    const runner = runnerWith(null, 1);

    expect(runner.spokenPromptFor("Chọn quả táo", "round_open")).toBe(
      "Chọn quả táo"
    );
  });

  it("vòng sau không đọc lại khung chuyện", () => {
    const runner = runnerWith("Gấu Con đi chợ.", 2);
    runner.completeCurrentRound();

    expect(runner.getState().currentRoundIndex).toBe(1);
    expect(runner.spokenPromptFor("Chọn quả táo", "round_open")).toBe(
      "Chọn quả táo"
    );
  });
});
