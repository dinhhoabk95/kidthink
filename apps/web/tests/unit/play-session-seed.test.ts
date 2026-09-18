import { describe, expect, it, vi } from "vitest";
import type { ConfigPayload } from "~/composables/play/use-play-session";
import { resolveLayoutSeed } from "~/composables/play/use-play-session";

function makePayload(layoutSeed?: number): ConfigPayload {
  return {
    level_code: "GT-001-TEST",
    code: "GT-001-TEST",
    template_code: "GT-001",
    theme_id: "default",
    layout_seed: layoutSeed,
  };
}

describe("resolveLayoutSeed (BR-RNG-06)", () => {
  it("dùng đúng layout_seed do server phát khi payload có sẵn", () => {
    expect(resolveLayoutSeed(makePayload(123_456))).toBe(123_456);
  });

  it("layout_seed = 0 hợp lệ vẫn được giữ nguyên, không bị coi là thiếu", () => {
    expect(resolveLayoutSeed(makePayload(0))).toBe(0);
  });

  it("thiếu layout_seed → dùng seed 0 và ghi một cảnh báo, Cấm — NEVER gọi Math.random", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
    const randomSpy = vi.spyOn(Math, "random");

    expect(resolveLayoutSeed(makePayload(undefined))).toBe(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(randomSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    randomSpy.mockRestore();
  });
});
