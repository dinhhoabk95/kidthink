import { describe, expect, it, vi } from "vitest";
import {
  composeRoundOpenSpeech,
  playRoundOpenNarration,
} from "~/composables/play/round-open-narration";

/** BR-FBK-16 + BR-E018-05 — lượt đọc mở vòng của Studio preview. */
describe("round-open narration", () => {
  it("khung chuyện đứng trước câu dẫn", () => {
    expect(
      composeRoundOpenSpeech({ storyLine: () => "Có chú mèo." }, "Chọn táo")
    ).toBe("Có chú mèo. Chọn táo");
  });

  it("không có chuyện: chỉ câu dẫn", () => {
    expect(composeRoundOpenSpeech({ storyLine: () => null }, "Chọn táo")).toBe(
      "Chọn táo"
    );
    expect(composeRoundOpenSpeech({}, "Chọn táo")).toBe("Chọn táo");
  });

  it("đọc câu dẫn rồi âm đề rồi settle", () => {
    const spoken: string[] = [];
    const settle = vi.fn();
    playRoundOpenNarration(
      { storyLine: () => "Chuyện.", getOpeningAudioText: () => "Con mèo" },
      "Chọn",
      (text, onEnd) => {
        spoken.push(text);
        onEnd();
      },
      { settle }
    );
    expect(spoken).toEqual(["Chuyện. Chọn", "Con mèo"]);
    expect(settle).toHaveBeenCalledTimes(1);
  });

  it("tự chơi lại: không kể lại khung chuyện, vẫn đọc câu dẫn", () => {
    const spoken: string[] = [];
    playRoundOpenNarration(
      { storyLine: () => "Chuyện." },
      "Chọn",
      (text, onEnd) => {
        spoken.push(text);
        onEnd();
      },
      { tellStory: false }
    );
    expect(spoken).toEqual(["Chọn"]);
  });

  it("câu dẫn báo onError rồi onEnd: âm đề chỉ đọc một lần", () => {
    const spoken: string[] = [];
    const settle = vi.fn();
    playRoundOpenNarration(
      { getOpeningAudioText: () => "Con mèo" },
      "Chọn",
      (text, onEnd, onError) => {
        spoken.push(text);
        if (text === "Chọn") {
          onError();
        }
        onEnd();
      },
      { settle }
    );
    expect(spoken).toEqual(["Chọn", "Con mèo"]);
    expect(settle).toHaveBeenCalledTimes(1);
  });

  it("TTS lỗi vẫn settle; không có câu dẫn vẫn đọc âm đề", () => {
    const settle = vi.fn();
    playRoundOpenNarration({}, "Chọn", (_t, _e, onError) => onError(), {
      settle,
    });
    expect(settle).toHaveBeenCalledTimes(1);
    const speak = vi.fn((_t: string, onEnd: () => void) => onEnd());
    playRoundOpenNarration({ getOpeningAudioText: () => "Âm" }, null, speak, {
      settle,
    });
    expect(speak).toHaveBeenCalledWith(
      "Âm",
      expect.any(Function),
      expect.any(Function)
    );
  });
});
