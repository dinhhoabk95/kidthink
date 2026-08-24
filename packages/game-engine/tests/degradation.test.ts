import { describe, expect, it } from "vitest";
import { DegradationManager } from "#src/systems/degradation";

describe("Task 5 — Performance Budget Degradation (BR-PRF-03)", () => {
  it("degrades non-essential visual elements in strict order when FPS drops below 45", () => {
    const mgr = new DegradationManager();

    const normal = mgr.updateFps(60);
    expect(normal.particles_enabled).toBe(true);
    expect(normal.soft_shadows_enabled).toBe(true);
    expect(normal.bg_animation_enabled).toBe(true);

    const lowFps = mgr.updateFps(42);
    expect(lowFps.particles_enabled).toBe(false);
    expect(lowFps.soft_shadows_enabled).toBe(true);

    const vLowFps = mgr.updateFps(38);
    expect(vLowFps.particles_enabled).toBe(false);
    expect(vLowFps.soft_shadows_enabled).toBe(false);
  });

  it("BR-PRF-03: touch target size, audio channel, and font size are NEVER degraded", () => {
    const mgr = new DegradationManager();
    const state = mgr.updateFps(20); // Very low FPS

    expect(state.touch_target_size_degraded).toBe(false);
    expect(state.audio_channel_degraded).toBe(false);
    expect(state.font_size_degraded).toBe(false);
  });
});
