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

  it("BR-PRF-03: GameEngine periodically emits fps_sample every 30s with p50, p95, min, sample_count", async () => {
    const { FPS_SAMPLE_INTERVAL_MS, GameEngine } = await import("#src/core");
    const engine = new GameEngine();
    const samples: Array<{
      event_name: string;
      data?: Record<string, number>;
    }> = [];
    engine.on("fps_sample", (ev) => {
      samples.push({
        event_name: ev.event_name,
        data: ev.data as Record<string, number> | undefined,
      });
    });

    // Chưa đủ 30s thì chưa phát (299 × 100ms = 29_900ms)
    for (let i = 0; i < 299; i += 1) {
      engine.advanceFrame(100);
    }
    expect(samples).toHaveLength(0);

    // Đủ 30_000 ms (thêm 80ms + 20ms = 30_000ms)
    engine.advanceFrame(80);
    engine.advanceFrame(20);
    expect(FPS_SAMPLE_INTERVAL_MS).toBe(30_000);
    expect(samples).toHaveLength(1);
    const payload = samples[0]?.data;
    expect(payload).toBeDefined();
    expect(payload?.sample_count).toBe(301);
    expect(payload?.min).toBe(10);
    expect(payload?.p50).toBe(10);
    expect(payload?.p95).toBe(10);

    // Chu kỳ tiếp theo bắt đầu từ 0
    engine.advanceFrame(16.67);
    expect(samples).toHaveLength(1);
    engine.destroy();
  });
});
