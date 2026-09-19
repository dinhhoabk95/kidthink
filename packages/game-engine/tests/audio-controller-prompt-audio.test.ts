import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioController } from "#src/systems/audio-controller";

interface FakeAudioElement {
  volume: number;
  currentTime: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  pause: () => void;
  play: () => Promise<void>;
}

function stubFailingAudio(instances: FakeAudioElement[]): void {
  class FailingAudio implements FakeAudioElement {
    volume = 1;
    currentTime = 0;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readonly pause = vi.fn();
    readonly play = vi.fn(() => Promise.reject(new Error("NotSupportedError")));
    constructor() {
      instances.push(this);
    }
  }
  vi.stubGlobal("Audio", FailingAudio);
}

/**
 * `playPromptAudio(ref, onEnd, onError)`: file hỏng phát CẢ sự kiện `error`
 * LẪN reject `play()`. Người gọi dùng `onError` để rơi xuống bậc TTS
 * (`BR-PNR-06`) — gọi hai lần là đọc TTS hai lần, lần hai cắt lần một
 * (Task #274, E3).
 */
describe("AudioController.playPromptAudio — mp3 lỗi báo đúng một lần (Task #274 S1c)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("onerror và reject play() cùng bắn: onError và onEnd mỗi cái gọi đúng một lần", async () => {
    const instances: FakeAudioElement[] = [];
    stubFailingAudio(instances);
    const audio = new AudioController(true);
    const onEnd = vi.fn();
    const onError = vi.fn();

    audio.playPromptAudio("/audio/404.mp3", onEnd, onError);
    instances[0]?.onerror?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
