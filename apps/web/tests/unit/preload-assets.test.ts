// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preloadPlayAssets } from "~/composables/play/use-play-audio";

describe("preloadPlayAssets (Task #260 I12)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("Ca âm: asset treo (không load, không error) thì kêu đúng 1 dòng warn và vẫn vào game", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    const pending = preloadPlayAssets([
      { ref: "img-1", kind: "image", url: "https://example.invalid/never.png" },
    ]);

    await vi.advanceTimersByTimeAsync(3000);
    await expect(pending).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("never.png");
  });

  it("vào game trong ≤5s kể cả khi asset không bao giờ trả lời", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    let settled = false;
    const pending = preloadPlayAssets([
      { ref: "aud-1", kind: "audio", url: "https://example.invalid/never.mp3" },
    ]).then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(5000);
    await pending;
    expect(settled).toBe(true);
  });

  it("asset không có url thì bỏ qua, không warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    await preloadPlayAssets([{ ref: "emoji-1", kind: "emoji", glyph: "🐻" }]);
    expect(warn).not.toHaveBeenCalled();
  });
});
