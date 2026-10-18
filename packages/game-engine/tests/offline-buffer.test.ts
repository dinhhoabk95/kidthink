import { describe, expect, it, vi } from "vitest";
import {
  type BufferedEvent,
  createInMemoryBufferStorage,
  OfflineEventBuffer,
} from "#src/offline-buffer";

describe("Task P1.6 & #303 — OfflineEventBuffer (BR-OFF-01..06, BR-ING-05, BR-ING-08)", () => {
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
    buffer.destroy();
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
    buffer.destroy();
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
    (ev as { queued_at: number }).queued_at = Date.now() - 25 * 60 * 60 * 1000;

    buffer.pruneBuffer();
    expect(buffer.getPendingEvents()).toHaveLength(0);
    buffer.destroy();
  });

  it("BR-OFF-01, BR-OFF-03: persists user events to storage and flushes in seq order when back online", async () => {
    const storage = createInMemoryBufferStorage();
    let isOnline = false;
    const sentBatches: Array<{
      sessionUuid: string;
      seqs: number[];
    }> = [];

    const buffer = new OfflineEventBuffer({
      storage,
      sendBatch: (sessionUuid, _isGuest, events) => {
        if (!isOnline) {
          return Promise.reject(new Error("Network offline"));
        }
        sentBatches.push({
          sessionUuid,
          seqs: events.map((e) => e.seq),
        });
        return Promise.resolve({ accepted: events.length, skipped: 0 });
      },
    });

    buffer.initSession({
      session_uuid: "user-session-1",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: false,
      started_at: Date.now(),
    });

    buffer.pushEvent("game_started", { round_index: 0 });
    buffer.pushEvent("round_completed", { round_index: 0 });
    await buffer.persistToStorage();

    // Flush while offline -> events remain in buffer and storage
    await buffer.flush();
    expect(buffer.getPendingEvents()).toHaveLength(2);
    expect(await storage.load("user-session-1")).toHaveLength(2);

    // Reconnect and flush -> events sent in seq order and cleared from storage
    isOnline = true;
    const flushRes = await buffer.flush();
    expect(flushRes.accepted).toBe(2);
    expect(sentBatches).toEqual([
      { sessionUuid: "user-session-1", seqs: [1, 2] },
    ]);
    expect(buffer.getPendingEvents()).toHaveLength(0);
    expect(await storage.load("user-session-1")).toHaveLength(0);
    buffer.destroy();
  });

  it("BR-OFF-03, BR-OFF-04: flushes leftover persisted events from previous session before sending new session events", async () => {
    const storage = createInMemoryBufferStorage();
    const now = Date.now();
    const leftoverEvents: BufferedEvent[] = [
      {
        session_uuid: "old-session-001",
        seq: 2,
        event_name: "round_completed",
        queued_at: now - 5000,
      },
      {
        session_uuid: "old-session-001",
        seq: 1,
        event_name: "game_started",
        queued_at: now - 6000,
      },
    ];
    await storage.save(leftoverEvents, "old-session-001");

    const callOrder: Array<{ sessionUuid: string; seqs: number[] }> = [];
    const buffer = new OfflineEventBuffer({
      storage,
      sendBatch: (sessionUuid, _isGuest, events) => {
        callOrder.push({
          sessionUuid,
          seqs: events.map((e) => e.seq),
        });
        return Promise.resolve({ accepted: events.length, skipped: 0 });
      },
    });

    buffer.initSession({
      session_uuid: "new-session-002",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: false,
      started_at: now,
    });
    buffer.pushEvent("game_started", { round_index: 0 });

    await buffer.flush();

    expect(callOrder).toEqual([
      { sessionUuid: "old-session-001", seqs: [1, 2] },
      { sessionUuid: "new-session-002", seqs: [1] },
    ]);
    expect(await storage.load()).toHaveLength(0);
    buffer.destroy();
  });

  it("BR-OFF-06: guest session buffers in memory only, never writes durable storage, and clears on destroy", async () => {
    const storage = createInMemoryBufferStorage();
    const saveSpy = vi.spyOn(storage, "save");

    const buffer = new OfflineEventBuffer({
      isGuest: true,
      storage,
      sendBatch: () => Promise.reject(new Error("Network offline")),
    });

    buffer.initSession({
      session_uuid: "guest-session-99",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: true,
      started_at: Date.now(),
    });

    buffer.pushEvent("game_started", { round_index: 0 });
    await buffer.persistToStorage();
    await buffer.flush();

    // Events remain in memory during the open session
    expect(buffer.getPendingEvents()).toHaveLength(1);
    // Guest NEVER persists to storage (BR-OFF-06)
    expect(saveSpy).not.toHaveBeenCalled();
    expect(await storage.load("guest-session-99")).toHaveLength(0);

    // Leaving / closing the page wipes guest memory buffer
    buffer.destroy();
    expect(buffer.getPendingEvents()).toHaveLength(0);
  });
});
