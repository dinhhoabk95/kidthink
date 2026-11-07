import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioController } from "#src/systems/audio-controller";

/**
 * Task #313 Phase 2 (`BR-FBK-13`): câu khích lệ khi chưa đúng đi qua TTS khi có
 * giọng Việt, rơi sang mp3 khi không có giọng — không bao giờ cả hai.
 */
describe("AudioController.speakEncouragement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const clip = {
    text: "Thử lại nhé!",
    audioRef: "/audio/voice/common/feedback/retry-1.mp3",
  };

  it("có giọng Việt thì đọc bằng TTS, không phát mp3", () => {
    const audio = new AudioController(true);
    vi.spyOn(audio, "isVoiceAvailable").mockReturnValue(true);
    const speak = vi.spyOn(audio, "speakPrompt").mockReturnValue(true);
    const mp3 = vi
      .spyOn(audio, "playPromptAudio")
      .mockImplementation(() => undefined);
    const onEnd = vi.fn();
    audio.speakEncouragement(clip, onEnd);
    expect(speak).toHaveBeenCalledWith("Thử lại nhé!", onEnd);
    expect(mp3).not.toHaveBeenCalled();
  });

  it("không có giọng Việt thì phát mp3 dự phòng, không gọi TTS", () => {
    const audio = new AudioController(true);
    vi.spyOn(audio, "isVoiceAvailable").mockReturnValue(false);
    const speak = vi.spyOn(audio, "speakPrompt").mockReturnValue(false);
    const mp3 = vi
      .spyOn(audio, "playPromptAudio")
      .mockImplementation(() => undefined);
    const onEnd = vi.fn();
    audio.speakEncouragement(clip, onEnd);
    expect(mp3).toHaveBeenCalledWith(clip.audioRef, onEnd);
    expect(speak).not.toHaveBeenCalled();
  });

  it("tắt âm thanh thì im và vẫn báo xong để chuỗi đi tiếp", () => {
    const audio = new AudioController(false);
    const onEnd = vi.fn();
    audio.speakEncouragement(clip, onEnd);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
