import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ActionResult,
  AudioController,
  BaseGameSession,
  type GameAction,
  GameEngine,
  type RoundConfig,
  RoundRunner,
} from "#src/index";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { CommandQueueSystem } from "#src/systems/command-queue-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";

/**
 * Vòng đời engine: rAF đúng một vòng, delta có trần, lỗi trong khung hình
 * không giết vòng lặp, huỷ thì dọn audio, câu dẫn vòng cũ không settle vòng mới.
 */

const ITEM_COUNT_RE = /item_count/;

class StubSession extends BaseGameSession {
  readonly deltas: number[] = [];
  throwOnce = false;

  setupEntities(): void {
    // stub
  }
  validateAction(_a: GameAction): ActionResult {
    return { valid: true, feedback: "none" };
  }
  checkWinCondition(): boolean {
    return false;
  }
  update(deltaMs: number): ActionResult {
    this.deltas.push(deltaMs);
    if (this.throwOnce) {
      this.throwOnce = false;
      throw new Error("lỗi giả trong update");
    }
    return { valid: true, feedback: "none" };
  }
}

const GT001 = GT001_FIXTURES[0];
if (!GT001) {
  throw new Error("Thiếu fixture GT-001");
}

const CONFIG = {
  level_code: "LVL-TEST",
  content_version: 1,
  template_code: "GT-001",
  content_pack: GT001.content,
  difficulty_params: GT001.difficulty,
  theme_id: "default",
  age_band: "4-5" as const,
  reduced_motion: false,
  audio_enabled: false,
};

interface RafHarness {
  readonly calls: () => number;
  runFrame(): void;
}

function installRaf(): RafHarness {
  let pending: FrameRequestCallback | null = null;
  let id = 0;
  const raf = vi.fn((cb: FrameRequestCallback): number => {
    pending = cb;
    id++;
    return id;
  });
  vi.stubGlobal("requestAnimationFrame", raf);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  return {
    calls: () => raf.mock.calls.length,
    runFrame(): void {
      const cb = pending;
      pending = null;
      cb?.(0);
    },
  };
}

function loadEngine(session: StubSession): GameEngine {
  const engine = new GameEngine();
  engine.load(CONFIG, () => session);
  return engine;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GameEngine — vòng lặp khung hình", () => {
  it("start() lần hai không mở thêm vòng rAF", () => {
    const harness = installRaf();
    const engine = loadEngine(new StubSession());
    engine.start();
    engine.start();
    expect(harness.calls()).toBe(1);
    engine.destroy();
  });

  it("delta khung hình bị trần ở 100ms sau khi tab quay lại", () => {
    const harness = installRaf();
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const session = new StubSession();
    const engine = loadEngine(session);
    engine.start();
    now += 5000;
    harness.runFrame();
    expect(Math.max(...session.deltas)).toBeLessThanOrEqual(100);
    engine.destroy();
  });

  it("update ném lỗi không làm chết vòng lặp", () => {
    const harness = installRaf();
    const session = new StubSession();
    const engine = loadEngine(session);
    engine.start();
    const callsBefore = harness.calls();
    session.throwOnce = true;
    expect(() => harness.runFrame()).toThrow();
    expect(harness.calls()).toBe(callsBefore + 1);
    engine.destroy();
  });

  it("destroy() dọn audio và gỡ mọi callback", () => {
    installRaf();
    const engine = loadEngine(new StubSession());
    const dispose = vi.spyOn(engine.audio, "dispose");
    engine.onSessionWon = vi.fn();
    engine.onAfterRender = vi.fn();
    engine.start();
    engine.destroy();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(engine.onSessionWon).toBeUndefined();
    expect(engine.onAfterRender).toBeUndefined();
  });
});

describe("RoundRunner — câu dẫn vòng cũ không settle vòng mới", () => {
  function rounds(): RoundConfig[] {
    return [0, 1].map((round_index) => ({
      round_index,
      instruction: `Câu dẫn vòng ${round_index}`,
      content_pack: {},
      difficulty_params: { item_count: 3 },
    }));
  }

  it("cancel() bắn onEnd của vòng trước khi vòng sau đã mở: vòng sau vẫn chờ đọc", () => {
    const audio = new AudioController(true);
    let pendingEnd: (() => void) | undefined;
    // Giả lập speak(): cancel() kết thúc đồng bộ câu đang đọc trước khi đọc câu mới.
    vi.spyOn(audio, "speakPrompt").mockImplementation((_text, onEnd) => {
      const previous = pendingEnd;
      pendingEnd = onEnd;
      previous?.();
      return true;
    });
    const runner = new RoundRunner({
      rounds: rounds(),
      sessionFactory: () => new StubSession(),
      audioController: audio,
      gateOnPromptSettle: true,
    });
    runner.startFirstRound();
    expect(runner.isPromptSettled()).toBe(false);

    runner.skipCurrentRound("user");
    expect(runner.getState().currentRoundIndex).toBe(1);
    expect(runner.isPromptSettled()).toBe(false);

    pendingEnd?.();
    expect(runner.isPromptSettled()).toBe(true);
  });

  it("vòng thiếu item_count bị chặn ngay ở constructor", () => {
    const bad = rounds();
    const second = bad[1];
    if (second) {
      second.difficulty_params = {};
    }
    expect(
      () =>
        new RoundRunner({
          rounds: bad,
          sessionFactory: () => new StubSession(),
        })
    ).toThrow(ITEM_COUNT_RE);
  });
});

describe("OrderingMechanic — `sequence_submitted` được chấm", () => {
  it("đúng thứ tự → CORRECT, sai → RETRY, không còn IGNORED", () => {
    const mech = new OrderingMechanic();
    mech.setInitialSequence(["a", "b"]);
    const submit: GameAction = { type: "sequence_submitted", data: null };
    expect(mech.validate(submit, ["a", "b"]).valid).toBe(true);
    expect(mech.validate(submit, ["b", "a"]).feedback).not.toBe("none");
  });
});

describe("CommandQueueSystem — xoá lệnh không để lại `loop` mồ côi", () => {
  it("xoá lệnh đứng trước loop thì loop đầu hàng bị bỏ", () => {
    const queue = new CommandQueueSystem({
      rows: 3,
      cols: 3,
      start: { col: 0, row: 0, facing: "right" },
      goal: { col: 2, row: 0 },
    });
    queue.addCommand({ type: "forward" });
    queue.addCommand({ type: "loop", count: 2 });
    queue.removeCommand(0);
    expect(queue.commandCount).toBe(0);
  });
});

describe("SFXEngine.dispose() — đóng AudioContext", () => {
  it("đóng context đã mở", () => {
    const close = vi.fn(() => Promise.resolve());
    const param = {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };
    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      close = close;
      resume(): Promise<void> {
        return Promise.resolve();
      }
      createOscillator(): object {
        return {
          type: "sine",
          frequency: param,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain(): object {
        return { gain: param, connect: vi.fn() };
      }
    }
    vi.stubGlobal("window", {});
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const sfx = new SFXEngine();
    sfx.play("tap");
    sfx.dispose();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
