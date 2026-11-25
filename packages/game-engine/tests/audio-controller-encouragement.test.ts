import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioController } from "#src/systems/audio-controller";

/**
 * Task #313 Phase 2 (`BR-FBK-13`) + Task #316 (`BR-PNR-05`): câu khích lệ khi
 * chưa đúng phát mp3 giọng cô băm từ `text` — không còn TTS, không trộn kho cũ.
 */
describe("AudioController.speakEncouragement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const clip = {
    text: "Thử lại nhé!",
    audioRef: "/audio/voice/common/feedback/retry-1.mp3",
  };

  it("đọc câu bằng giọng cô qua speakPrompt, không phát mp3 kho cũ", () => {
    const audio = new AudioController(true);
    const speak = vi.spyOn(audio, "speakPrompt").mockReturnValue(true);
    const mp3 = vi
      .spyOn(audio, "playPromptAudio")
      .mockImplementation(() => undefined);
    const onEnd = vi.fn();
    audio.speakEncouragement(clip, onEnd);
    expect(speak).toHaveBeenCalledWith("Thử lại nhé!", onEnd);
    expect(mp3).not.toHaveBeenCalled();
  });

  it("tắt âm thanh thì im và vẫn báo xong để chuỗi đi tiếp", () => {
    const audio = new AudioController(false);
    const onEnd = vi.fn();
    audio.speakEncouragement(clip, onEnd);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
