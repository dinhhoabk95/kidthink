import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayAudio } from "~/composables/play/use-play-audio";

interface MockAudioInstance {
  src: string;
  currentTime: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  pause: () => void;
  play: () => Promise<void>;
}

/**
 * `playInstructionNarration(promptText, onSettled)` phải gọi `onSettled`
 * đúng một lần khi câu dẫn thật sự đọc xong (mp3 hoặc TTS), và Cấm — NEVER
 * treo vô hạn nếu cả hai bậc phát đều không báo xong (`BR-PNR-09`, Task
 * #273). Đây là tín hiệu bề mặt chơi dùng để mở lại `engine.acceptingInput`
 * và gọi `RoundRunner.notePromptSettled()`.
 */
describe("usePlayAudio — playInstructionNarration onSettled (BR-PNR-09, BR-PNR-11)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function makeMockAudioClass(instances: MockAudioInstance[]) {
    return class MockAudio {
      src: string;
      currentTime = 0;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readonly pause = vi.fn();
      readonly play = vi.fn().mockResolvedValue(undefined);

      constructor(src: string) {
        this.src = src;
        instances.push(this);
      }
    };
  }

  it("mp3 phát xong (onended) → onSettled gọi đúng một lần", () => {
    const instances: MockAudioInstance[] = [];
    vi.stubGlobal("Audio", makeMockAudioClass(instances));
    const onSettled = vi.fn();
    const mockEngine = { audio: { speakPrompt: vi.fn() } };

    const { setInstructionAudio, playInstructionNarration } = usePlayAudio({
      getEngine: () => mockEngine as never,
      onFallbackCue: vi.fn(),
    });
    setInstructionAudio("/audio/test.mp3");

    playInstructionNarration("Bé tìm quả táo", onSettled);
    expect(onSettled).not.toHaveBeenCalled();
    expect(instances).toHaveLength(1);

    instances[0]?.onended?.();

    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("không có mp3 và không có promptText/engine → settle ngay, không treo (BR-PNR-09)", () => {
    const onSettled = vi.fn();
    const { playInstructionNarration } = usePlayAudio({
      getEngine: () => null,
      onFallbackCue: vi.fn(),
    });

    playInstructionNarration(undefined, onSettled);

    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("không có mp3, rơi xuống TTS: onSettled chỉ gọi khi TTS thật sự đọc xong, không gọi sớm", () => {
    let ttsOnEnd: (() => void) | undefined;
    const speakPrompt = vi.fn((_text: string, onEnd?: () => void) => {
      ttsOnEnd = onEnd;
      return true;
    });
    const mockEngine = { audio: { speakPrompt } };
    const onSettled = vi.fn();

    const { playInstructionNarration } = usePlayAudio({
      getEngine: () => mockEngine as never,
      onFallbackCue: vi.fn(),
    });

    playInstructionNarration("Bé tìm quả táo", onSettled);

    expect(speakPrompt).toHaveBeenCalledTimes(1);
    expect(onSettled).not.toHaveBeenCalled();

    ttsOnEnd?.();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("cả mp3 và TTS đều không báo xong: quá hạn dự phòng vẫn settle đúng một lần (Cấm — NEVER treo vô hạn)", () => {
    const speakPrompt = vi.fn(() => true); // không bao giờ gọi onEnd — mô phỏng treo
    const mockEngine = { audio: { speakPrompt } };
    const onSettled = vi.fn();

    const { playInstructionNarration } = usePlayAudio({
      getEngine: () => mockEngine as never,
      onFallbackCue: vi.fn(),
    });

    playInstructionNarration("Bé tìm quả táo", onSettled);
    expect(onSettled).not.toHaveBeenCalled();

    vi.advanceTimersByTime(30_000);

    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("mp3 lỗi bắn CẢ onerror LẪN reject play(): rơi xuống TTS đúng một lần, settle khi TTS đọc xong (Task #274, E3)", async () => {
    const instances: MockAudioInstance[] = [];
    const FailingAudio = class extends makeMockAudioClass(instances) {
      override readonly play = vi
        .fn()
        .mockRejectedValue(new Error("NotSupportedError"));
    };
    vi.stubGlobal("Audio", FailingAudio);
    let ttsOnEnd: (() => void) | undefined;
    const speakPrompt = vi.fn((_text: string, onEnd?: () => void) => {
      ttsOnEnd = onEnd;
      return true;
    });
    const mockEngine = { audio: { speakPrompt } };
    const onSettled = vi.fn();

    const { setInstructionAudio, playInstructionNarration } = usePlayAudio({
      getEngine: () => mockEngine as never,
      onFallbackCue: vi.fn(),
    });
    setInstructionAudio("/audio/404.mp3");

    playInstructionNarration("Bé tìm quả táo", onSettled);
    // Trình duyệt thật: file 404 phát sự kiện `error` VÀ promise `play()` reject.
    instances[0]?.onerror?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(speakPrompt).toHaveBeenCalledTimes(1);
    expect(onSettled).not.toHaveBeenCalled();

    ttsOnEnd?.();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("Nghe lại cắt ngang khi play() còn chờ: AbortError của mp3 cũ Cấm — NEVER đọc TTS đè lượt mới (Task #274, E3)", async () => {
    const instances: MockAudioInstance[] = [];
    let rejectFirstPlay: ((err: Error) => void) | undefined;
    const PendingAudio = class extends makeMockAudioClass(instances) {
      override readonly play = vi.fn(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectFirstPlay ??= reject;
          })
      );
    };
    vi.stubGlobal("Audio", PendingAudio);
    const speakPrompt = vi.fn(() => true);
    const mockEngine = { audio: { speakPrompt } };

    const { setInstructionAudio, playInstructionNarration } = usePlayAudio({
      getEngine: () => mockEngine as never,
      onFallbackCue: vi.fn(),
    });
    setInstructionAudio("/audio/test.mp3");

    playInstructionNarration("Bé tìm quả táo", vi.fn());
    playInstructionNarration("Bé tìm quả táo");
    rejectFirstPlay?.(new Error("AbortError"));
    await Promise.resolve();
    await Promise.resolve();

    expect(speakPrompt).not.toHaveBeenCalled();
  });

  it("Nghe lại cắt ngang mp3 mở vòng chưa phát xong vẫn settle lượt trước — Cấm — NEVER kẹt acceptingInput mãi (BR-PNR-11)", () => {
    const instances: MockAudioInstance[] = [];
    vi.stubGlobal("Audio", makeMockAudioClass(instances));
    const onSettledRoundOpen = vi.fn();
    const mockEngine = { audio: { speakPrompt: vi.fn() } };

    const { setInstructionAudio, playInstructionNarration } = usePlayAudio({
      getEngine: () => mockEngine as never,
      onFallbackCue: vi.fn(),
    });
    setInstructionAudio("/audio/test.mp3");

    // Nhịp mở vòng: mp3 đang phát, CHƯA kết thúc tự nhiên.
    playInstructionNarration("Bé tìm quả táo", onSettledRoundOpen);
    expect(instances).toHaveLength(1);
    expect(onSettledRoundOpen).not.toHaveBeenCalled();

    // Trẻ bấm "Nghe lại" giữa lúc mp3 mở vòng còn đang phát — gọi lại
    // playInstructionNarration KHÔNG kèm onSettled, đúng như
    // use-play-session.ts làm cho trigger "replay" (BR-PNR-08).
    playInstructionNarration("Bé tìm quả táo");

    // mp3 cũ chỉ bị pause() (không tự nhiên kết thúc, không bao giờ gọi
    // onended) — settle của LƯỢT MỞ VÒNG vẫn phải được gọi, nếu không
    // engine.acceptingInput không bao giờ được nâng lại true.
    expect(onSettledRoundOpen).toHaveBeenCalledTimes(1);
    expect(instances[0]?.pause).toHaveBeenCalledTimes(1);
  });
});
