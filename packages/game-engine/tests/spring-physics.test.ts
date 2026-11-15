import { describe, expect, it } from "vitest";
import {
  computeMagneticPull,
  computeSquashStretch,
  sampleTactileSpring,
} from "#src/systems/spring-physics";

describe("Spring Physics — Tactile Montessori Motion (Task #314 Phase 2)", () => {
  it("sampleTactileSpring starts at 0, overshoots gently in normal mode, and settles to 1", () => {
    expect(sampleTactileSpring(0, false)).toBe(0);
    expect(sampleTactileSpring(1, false)).toBe(1);
    const mid = sampleTactileSpring(0.45, false);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(1.25);
  });

  it("sampleTactileSpring clamps out-of-range and non-finite inputs safely", () => {
    expect(sampleTactileSpring(-0.5, false)).toBe(0);
    expect(sampleTactileSpring(2.5, false)).toBe(1);
    expect(sampleTactileSpring(Number.NaN, false)).toBe(0);
    expect(sampleTactileSpring(Number.POSITIVE_INFINITY, false)).toBe(1);
  });

  it("sampleTactileSpring respects reducedMotion with monotonic non-overshooting ease", () => {
    let prev = 0;
    for (let step = 0; step <= 20; step += 1) {
      const val = sampleTactileSpring(step / 20, true);
      expect(val).toBeGreaterThanOrEqual(prev);
      expect(val).toBeLessThanOrEqual(1);
      prev = val;
    }
    expect(prev).toBe(1);
  });

  it("computeSquashStretch preserves area approximately (~1) and flattens to 1x1 under reducedMotion", () => {
    const active = computeSquashStretch(0.35, "drop", false);
    expect(active.scaleX).not.toBe(1);
    expect(active.scaleY).not.toBe(1);
    expect(active.scaleX * active.scaleY).toBeCloseTo(1, 1);

    const settled = computeSquashStretch(1, "drop", false);
    expect(settled).toEqual({ scaleX: 1, scaleY: 1 });

    const reduced = computeSquashStretch(0.35, "drop", true);
    expect(reduced).toEqual({ scaleX: 1, scaleY: 1 });
  });

  it("computeMagneticPull smoothly attracts pointer toward target inside snap radius", () => {
    const far = computeMagneticPull(100, 100, 400, 400, 90);
    expect(far.snapped).toBe(false);
    expect(far.x).toBe(100);
    expect(far.y).toBe(100);
    expect(far.strength).toBe(0);

    const near = computeMagneticPull(120, 100, 100, 100, 90);
    expect(near.snapped).toBe(true);
    expect(near.strength).toBeGreaterThan(0);
    expect(near.x).toBeLessThan(120);
    expect(near.x).toBeGreaterThanOrEqual(100);
  });
});
