import { describe, expect, it } from "vitest";
import { runAdaptiveReplay } from "#scripts/replay-adaptive";

describe("scripts/replay-adaptive — Offline BKT Replay (BR-ADP-07, D-MP)", () => {
  it("executes without throwing and returns structured ReplayReport", async () => {
    const report = await runAdaptiveReplay({ sampleLimit: 10, dryRun: true });

    expect(report).toBeDefined();
    expect(typeof report.total_sessions_replayed).toBe("number");
    expect(typeof report.skills_evaluated).toBe("number");
    expect(typeof report.mean_absolute_error).toBe("number");
    expect(typeof report.max_divergence).toBe("number");
    expect(Array.isArray(report.discrepancies)).toBe(true);
  });
});
