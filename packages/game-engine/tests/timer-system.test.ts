import { describe, expect, it } from "vitest";
import {
  FlashTimer,
  MAX_FLASH_MS,
  MIN_FLASH_MS,
} from "../src/systems/timer-system.js";

describe("timerSystem (BR-MTB-15)", () => {
  it("enforces floor of 800ms and ceiling of 3000ms", () => {
    const tooFast = new FlashTimer({ flashMs: 400 });
    expect(tooFast.getDurationMs()).toBe(MIN_FLASH_MS);

    const tooSlow = new FlashTimer({ flashMs: 5000 });
    expect(tooSlow.getDurationMs()).toBe(MAX_FLASH_MS);

    const standard = new FlashTimer({ flashMs: 1500 });
    expect(standard.getDurationMs()).toBe(1500);
  });

  it("handles timer lifecycle: idle -> running -> expired", () => {
    const timer = new FlashTimer({ flashMs: 1000 });
    expect(timer.getState()).toBe("idle");
    expect(timer.isVisible()).toBe(false);

    timer.start();
    expect(timer.getState()).toBe("running");
    expect(timer.isVisible()).toBe(true);

    timer.tick(500);
    expect(timer.getState()).toBe("running");
    expect(timer.getElapsedMs()).toBe(500);
    expect(timer.isExpired()).toBe(false);

    timer.tick(600); // 500 + 600 = 1100 >= 1000
    expect(timer.getState()).toBe("expired");
    expect(timer.isVisible()).toBe(false);
    expect(timer.isExpired()).toBe(true);
  });

  it("supports single replay when allowReplay is true", () => {
    const timer = new FlashTimer({ flashMs: 1000, allowReplay: true });
    timer.start();
    timer.tick(1000);

    expect(timer.canReplay()).toBe(true);
    expect(timer.replay()).toBe(true);
    expect(timer.getState()).toBe("running");
    expect(timer.hasUsedReplay()).toBe(true);

    timer.tick(1000);
    expect(timer.getState()).toBe("expired");
    // Cannot replay a second time
    expect(timer.canReplay()).toBe(false);
    expect(timer.replay()).toBe(false);
  });
});
