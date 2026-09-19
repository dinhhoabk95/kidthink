import { describe, expect, it, vi } from "vitest";
import {
  type ActionResult,
  BaseGameSession,
  type GameAction,
} from "#src/game-session";
import { type RoundConfig, RoundRunner } from "#src/round-runner";
import { AudioController } from "#src/systems/audio-controller";

class StubSession extends BaseGameSession {
  setupEntities(): void {
    /* noop */
  }
  validateAction(_a: GameAction): ActionResult {
    return { valid: true, feedback: "none" };
  }
  checkWinCondition(): boolean {
    return false;
  }
}

function makeRound(overrides: Partial<RoundConfig> = {}): RoundConfig {
  return {
    round_index: 0,
    content_pack: {},
    difficulty_params: { item_count: 3, hint_after_ms: 2000 },
    ...overrides,
  };
}

/**
 * Đồng hồ vòng (`duration_ms`) và hẹn giờ trợ giúp (`hint_after_ms`) chỉ bắt
 * đầu tính từ lúc câu dẫn đọc xong — không phải từ lúc mở vòng (Task #273,
 * `BR-PNR-11`). Mặc định (`gateOnPromptSettle` không khai) giữ đúng hành vi
 * cũ cho mọi lời gọi hiện có.
 */
describe("RoundRunner — gateOnPromptSettle (BR-PNR-11)", () => {
  it("mặc định (không khai gateOnPromptSettle): hẹn giờ trợ giúp chạy ngay khi mở vòng — hành vi cũ giữ nguyên", () => {
    vi.useFakeTimers();
    try {
      const runner = new RoundRunner({
        rounds: [makeRound()],
        sessionFactory: () => new StubSession(),
      });
      runner.startFirstRound();

      vi.advanceTimersByTime(2000);
      expect(runner.getState().hintCountTotal).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gateOnPromptSettle: true + onPlayNarration (đường bề mặt chơi): hẹn giờ trợ giúp KHÔNG chạy trước khi notePromptSettled()", () => {
    vi.useFakeTimers();
    try {
      const runner = new RoundRunner({
        rounds: [makeRound()],
        sessionFactory: () => new StubSession(),
        gateOnPromptSettle: true,
        onPlayNarration: () => {
          /* bề mặt chơi tự phát, tự gọi notePromptSettled() khi xong */
        },
      });
      runner.startFirstRound();
      expect(runner.isPromptSettled()).toBe(false);

      vi.advanceTimersByTime(5000);
      expect(runner.getState().hintCountTotal).toBe(0);

      runner.notePromptSettled();
      expect(runner.isPromptSettled()).toBe(true);
      vi.advanceTimersByTime(2000);
      expect(runner.getState().hintCountTotal).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gateOnPromptSettle mặc định false: isPromptSettled() luôn true, notePromptSettled() là no-op", () => {
    const runner = new RoundRunner({
      rounds: [makeRound()],
      sessionFactory: () => new StubSession(),
    });
    runner.startFirstRound();

    expect(runner.isPromptSettled()).toBe(true);
    runner.notePromptSettled();
    expect(runner.isPromptSettled()).toBe(true);
  });

  it("gateOnPromptSettle: true: duration_ms của round_completed tính từ notePromptSettled(), không phải từ round_started", () => {
    vi.useFakeTimers();
    try {
      const now = Date.now();
      vi.setSystemTime(now);

      const runner = new RoundRunner({
        rounds: [makeRound()],
        sessionFactory: () => new StubSession(),
        gateOnPromptSettle: true,
        onPlayNarration: () => {
          /* chờ notePromptSettled() */
        },
      });
      runner.startFirstRound();

      // 4s trôi qua trong lúc đọc câu dẫn — Cấm — NEVER tính vào duration_ms.
      vi.setSystemTime(now + 4000);
      runner.notePromptSettled();

      // 1s nữa trước khi trẻ trả lời đúng và vòng đóng.
      vi.setSystemTime(now + 5000);
      runner.completeCurrentRound();

      const completedEvt = runner
        .getAllTelemetry()
        .find((e) => e.event_name === "round_completed");
      expect(completedEvt?.data?.duration_ms).toBe(1000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gateOnPromptSettle: true + đường phát nội bộ, mp3 phát thành công: tự settle, hẹn giờ trợ giúp chạy", () => {
    vi.useFakeTimers();
    try {
      const audio = new AudioController(true);
      let capturedOnEnd: (() => void) | undefined;
      vi.spyOn(audio, "playPromptAudio").mockImplementation((_ref, onEnd) => {
        capturedOnEnd = onEnd;
      });

      const runner = new RoundRunner({
        rounds: [makeRound({ instruction_audio_path: "/audio/voice/x.mp3" })],
        sessionFactory: () => new StubSession(),
        audioController: audio,
        gateOnPromptSettle: true,
      });
      runner.startFirstRound();

      vi.advanceTimersByTime(5000);
      expect(runner.getState().hintCountTotal).toBe(0);

      // mp3 phát xong thật.
      capturedOnEnd?.();

      vi.advanceTimersByTime(2000);
      expect(runner.getState().hintCountTotal).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gateOnPromptSettle: true + đường phát nội bộ, mp3 lỗi rơi xuống TTS: Cấm — NEVER settle sớm khi TTS còn đang chờ", () => {
    vi.useFakeTimers();
    try {
      const audio = new AudioController(true);
      // Bậc 1 (mp3) lỗi ngay.
      vi.spyOn(audio, "playPromptAudio").mockImplementation(
        (_ref, onEnd, onError) => {
          onError?.();
          onEnd?.();
        }
      );
      // Bậc 2 (TTS) "đang nói" — chưa gọi onEnd ngay, mô phỏng phát thật cần
      // thời gian.
      let ttsOnEnd: (() => void) | undefined;
      vi.spyOn(audio, "speakPrompt").mockImplementation((_text, onEnd) => {
        ttsOnEnd = onEnd;
        return true;
      });

      const runner = new RoundRunner({
        rounds: [
          makeRound({
            instruction: "Bé tìm quả táo",
            instruction_audio_path: "/audio/voice/hong.mp3",
          }),
        ],
        sessionFactory: () => new StubSession(),
        audioController: audio,
        gateOnPromptSettle: true,
      });
      runner.startFirstRound();

      // mp3 đã báo lỗi và rơi xuống TTS, nhưng TTS CHƯA nói xong —
      // Cấm — NEVER đã settle.
      vi.advanceTimersByTime(5000);
      expect(runner.getState().hintCountTotal).toBe(0);

      // TTS nói xong thật.
      ttsOnEnd?.();
      vi.advanceTimersByTime(2000);
      expect(runner.getState().hintCountTotal).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gateOnPromptSettle: true + đường phát nội bộ: Nghe lại cắt ngang câu dẫn mở vòng thì vòng vẫn settle (Task #274 S1c)", () => {
    // `playPromptAudio` không còn báo onEnd cho clip bị `stopAll()` cắt
    // ngang (reject AbortError của clip cũ bị bỏ qua) — nên "Nghe lại" phải tự
    // settle lượt mở vòng, như bề mặt web làm trong `stopNarrationAudio()`.
    const audio = new AudioController(true);
    vi.spyOn(audio, "playPromptAudio").mockImplementation(() => {
      /* mp3 đang phát, chưa bao giờ báo xong */
    });

    const runner = new RoundRunner({
      rounds: [makeRound({ instruction_audio_path: "/audio/voice/x.mp3" })],
      sessionFactory: () => new StubSession(),
      audioController: audio,
      gateOnPromptSettle: true,
    });
    runner.startFirstRound();
    expect(runner.isPromptSettled()).toBe(false);

    runner.replayCurrentRoundNarration();

    expect(runner.isPromptSettled()).toBe(true);
  });
});
