import { describe, expect, it } from "vitest";
import { OfflineEventBuffer } from "#src/offline-buffer";

describe("Task P1.6 — OfflineEventBuffer (BR-OFF-01..06, BR-ING-05, BR-ING-08)", () => {
  it("BR-OFF-03: initializes session and generates sequential seq numbers starting from 1", () => {
    const buffer = new OfflineEventBuffer();
    buffer.initSession({
      session_uuid: "test-session-123",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: true,
      started_at: Date.now(),
    });

    const ev1 = buffer.pushEvent("game_started", { device: "tablet" });
    const ev2 = buffer.pushEvent("round_started", { round_index: 0 });

    expect(ev1.seq).toBe(1);
    expect(ev2.seq).toBe(2);
    expect(buffer.getPendingEvents()).toHaveLength(2);
  });

  it("BR-ING-08: score and PII fields are stripped when pushing events to buffer", () => {
    const buffer = new OfflineEventBuffer();
    buffer.initSession({
      session_uuid: "test-session-strip",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: false,
      started_at: Date.now(),
    });

    const ev = buffer.pushEvent("answer_correct", {
      score: 100,
      display_name: "Kid Name",
      elapsed_ms: 1500,
    });

    expect(ev.payload?.score).toBeUndefined();
    expect(ev.payload?.display_name).toBeUndefined();
    expect(ev.payload?.elapsed_ms).toBe(1500);
  });

  it("BR-OFF-05: events older than 24 hours are pruned from buffer", () => {
    const buffer = new OfflineEventBuffer();
    buffer.initSession({
      session_uuid: "test-session-prune",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: true,
      started_at: Date.now() - 25 * 60 * 60 * 1000,
    });

    const ev = buffer.pushEvent("game_started", { device: "tablet" });
    // Manually set queued_at to 25 hours ago
    (ev as { queued_at: number }).queued_at = Date.now() - 25 * 60 * 60 * 1000;

    buffer.pruneBuffer();
    expect(buffer.getPendingEvents()).toHaveLength(0);
  });
});
