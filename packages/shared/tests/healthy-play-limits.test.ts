import { describe, expect, it } from "vitest";
import {
  computeAbandonedSessionDurationSeconds,
  computePausedDurationMs,
  computeRemainingPlaySeconds,
  computeSessionResult,
} from "#src/index";

describe("Task #293 S1-S3 — Pure Healthy Play Limits & Pause/Abandoned Duration (BR-HPL-02, BR-HPL-07)", () => {
  it("computeRemainingPlaySeconds: returns full budget when stats is null, 0 when exhausted, and adds extra_time_granted_minutes", () => {
    expect(computeRemainingPlaySeconds(null, 30)).toBe(1800);
    expect(
      computeRemainingPlaySeconds(
        { totalPlayTimeSeconds: 1800, extraTimeGrantedMinutes: 0 },
        30
      )
    ).toBe(0);
    expect(
      computeRemainingPlaySeconds(
        { totalPlayTimeSeconds: 1800, extraTimeGrantedMinutes: 15 },
        30
      )
    ).toBe(900);
  });

  it("BR-HPL-07: computeSessionResult and computePausedDurationMs subtract paused_ms from game_resumed", () => {
    const events = [
      {
        sessionUuid: "sess-1",
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: "sess-1",
        seq: 2,
        eventName: "game_paused",
        occurredAtMs: 120_000,
        payload: { reason: "tab_hidden" },
      },
      {
        sessionUuid: "sess-1",
        seq: 3,
        eventName: "game_resumed",
        occurredAtMs: 360_000,
        payload: { paused_ms: 240_000 },
      },
      {
        sessionUuid: "sess-1",
        seq: 4,
        eventName: "game_completed",
        occurredAtMs: 600_000,
      },
    ];

    expect(computePausedDurationMs(events)).toBe(240_000);
    const result = computeSessionResult(events);
    // 10 phút (600_000ms) - 4 phút tạm dừng (240_000ms) = 6 phút (360_000ms)
    expect(result.metrics.duration_ms).toBe(360_000);
  });

  it("Task #293 S3: computeAbandonedSessionDurationSeconds returns 0s when no events and exact seconds up to last event", () => {
    expect(computeAbandonedSessionDurationSeconds([])).toBe(0);

    const events = [
      {
        sessionUuid: "sess-abandoned",
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: "sess-abandoned",
        seq: 2,
        eventName: "round_started",
        occurredAtMs: 45_000,
      },
    ];
    expect(computeAbandonedSessionDurationSeconds(events)).toBe(45);
  });
});
