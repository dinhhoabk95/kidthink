import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioController } from "#src/systems/audio-controller";
import { SpeechSynthesisAdapter } from "#src/systems/speech-synthesis-adapter";

interface FakeVoice {
  readonly name: string;
  readonly lang: string;
}

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: FakeVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

interface FakeSynth {
  voices: FakeVoice[];
  readonly spoken: FakeUtterance[];
  readonly listeners: (() => void)[];
  onvoiceschanged: (() => void) | null;
  getVoices(): FakeVoice[];
  speak(u: FakeUtterance): void;
  cancel(): void;
  addEventListener(type: string, fn: () => void): void;
}

function installFakeSynth(voices: FakeVoice[]): FakeSynth {
  const synth: FakeSynth = {
    voices,
    spoken: [],
    listeners: [],
    onvoiceschanged: null,
    getVoices() {
      return this.voices;
    },
    speak(u) {
      this.spoken.push(u);
    },
    cancel: vi.fn(),
    addEventListener(type, fn) {
      if (type === "voiceschanged") {
        this.listeners.push(fn);
      }
    },
  };
  vi.stubGlobal("window", { speechSynthesis: synth });
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  return synth;
}

const VI_VOICE: FakeVoice = { name: "Linh", lang: "vi-VN" };

/**
 * Vòng đời utterance của Web Speech (Task #274 S8). Cổng chờ đọc
 * (`BR-PNR-11`) mở cử chỉ theo `onEnd`, nên mọi lỗi ở đây thành "khoá chạm"
 * hoặc "mở cổng sớm" trên bề mặt trẻ.
 */
describe("SpeechSynthesisAdapter — vòng đời utterance (Task #274 S8)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("utterance bị speak() mới cắt ngang: onEnd đúng một lần, Cấm — NEVER onError, sự kiện trễ của trình duyệt bị bỏ qua", () => {
    const synth = installFakeSynth([VI_VOICE]);
    const adapter = new SpeechSynthesisAdapter();
    const onEndA = vi.fn();
    const onErrorA = vi.fn();

    adapter.speak("Câu hỏi vòng một", { onEnd: onEndA, onError: onErrorA });
    adapter.speak("Quả táo");
    // Chrome bắn `error: interrupted` cho utterance bị cancel(), bất đồng bộ.
    synth.spoken[0]?.onerror?.({ error: "interrupted" });

    expect(onErrorA).not.toHaveBeenCalled();
    expect(onEndA).toHaveBeenCalledTimes(1);
  });

  it("sự kiện trễ của utterance cũ Cấm — NEVER xoá hẹn giờ an toàn của utterance mới", () => {
    const synth = installFakeSynth([VI_VOICE]);
    const adapter = new SpeechSynthesisAdapter();
    const onEndB = vi.fn();

    adapter.speak("Câu hỏi vòng một");
    adapter.speak("Câu hỏi vòng hai", { onEnd: onEndB, timeoutMs: 5000 });
    synth.spoken[0]?.onerror?.({ error: "interrupted" });
    // Trình duyệt đánh rơi `onend` của utterance mới — hẹn giờ an toàn phải
    // còn để cổng chờ đọc không kẹt.
    vi.advanceTimersByTime(5000);

    expect(onEndB).toHaveBeenCalledTimes(1);
  });

  it("cancel() từ ngoài (stopAll) kết thúc utterance đang đọc bằng onEnd, không bằng onError", () => {
    installFakeSynth([VI_VOICE]);
    const adapter = new SpeechSynthesisAdapter();
    const onEnd = vi.fn();
    const onError = vi.fn();

    adapter.speak("Câu hỏi", { onEnd, onError });
    adapter.cancel();
    vi.advanceTimersByTime(20_000);

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("lỗi thật của utterance đang đọc vẫn báo onError rồi onEnd, mỗi cái một lần", () => {
    const synth = installFakeSynth([VI_VOICE]);
    const adapter = new SpeechSynthesisAdapter();
    const onEnd = vi.fn();
    const onError = vi.fn();

    adapter.speak("Câu hỏi", { onEnd, onError });
    synth.spoken[0]?.onerror?.({ error: "synthesis-failed" });
    synth.spoken[0]?.onend?.();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("AudioController.speakPrompt: lỗi thật báo tín hiệu thị giác một lần và onEnd một lần", () => {
    const synth = installFakeSynth([VI_VOICE]);
    const audio = new AudioController(true);
    const onEnd = vi.fn();
    const fallback = vi.fn();

    audio.speakPrompt("Câu hỏi", onEnd, fallback);
    synth.spoken[0]?.onerror?.({ error: "synthesis-failed" });

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("nhiều adapter cùng nghe voiceschanged — adapter tạo sau Cấm — NEVER ghi đè listener của adapter tạo trước", () => {
    const synth = installFakeSynth([]);
    const first = new SpeechSynthesisAdapter();
    const second = new SpeechSynthesisAdapter();
    expect(first.hasVietnameseVoice()).toBe(false);

    // Danh sách giọng về muộn, như Chrome lúc mới nạp trang.
    synth.voices = [VI_VOICE];
    for (const listener of synth.listeners) {
      listener();
    }

    expect(first.hasVietnameseVoice()).toBe(true);
    expect(second.hasVietnameseVoice()).toBe(true);
  });
});
