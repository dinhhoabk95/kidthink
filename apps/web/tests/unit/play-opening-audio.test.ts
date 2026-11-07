import { describe, expect, it, vi } from "vitest";
import { playOpeningAudioThenSettle } from "~/composables/play/opening-audio";

/** BR-E018-05 — âm đề tự phát sau câu dẫn, rồi mới mở cử chỉ. */
describe("playOpeningAudioThenSettle", () => {
  it("có âm đề: đọc trước, settle chỉ sau khi đọc xong, đúng một lần", () => {
    const settle = vi.fn();
    let end: () => void = () => undefined;
    const speak = vi.fn((_text: string, onEnd: () => void) => {
      end = onEnd;
    });
    playOpeningAudioThenSettle(
      { getOpeningAudioText: () => "Con mèo" },
      speak,
      settle
    );
    expect(speak).toHaveBeenCalledWith(
      "Con mèo",
      expect.any(Function),
      expect.any(Function)
    );
    expect(settle).not.toHaveBeenCalled();
    end();
    end();
    expect(settle).toHaveBeenCalledTimes(1);
  });

  it("TTS lỗi vẫn settle, không kẹt cổng", () => {
    const settle = vi.fn();
    playOpeningAudioThenSettle(
      { getOpeningAudioText: () => "Con mèo" },
      (_t, _end, onError) => onError(),
      settle
    );
    expect(settle).toHaveBeenCalledTimes(1);
  });

  it("cờ tắt (null) hoặc engine không có hook: settle ngay, không đọc", () => {
    const speak = vi.fn();
    const settle = vi.fn();
    playOpeningAudioThenSettle(
      { getOpeningAudioText: () => null },
      speak,
      settle
    );
    playOpeningAudioThenSettle({}, speak, settle);
    playOpeningAudioThenSettle(null, speak, settle);
    expect(speak).not.toHaveBeenCalled();
    expect(settle).toHaveBeenCalledTimes(3);
  });
});
