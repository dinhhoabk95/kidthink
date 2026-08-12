export interface BufferedEvent {
  session_uuid: string;
  seq: number;
  event_name: string;
  occurred_at_ms?: number;
  payload?: Record<string, unknown>;
  client_timestamp?: string;
  queued_at: number;
}

export interface SessionMeta {
  session_uuid: string;
  level_code: string;
  content_version: number;
  is_guest: boolean;
  started_at: number;
}

export class OfflineEventBuffer {
  private memoryEvents: BufferedEvent[] = [];
  private currentSeq = 0;
  private sessionMeta: SessionMeta | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private apiEndpoint = "/api/users/play-sessions";

  constructor(options?: { isGuest?: boolean }) {
    if (options?.isGuest) {
      this.apiEndpoint = "/api/guest/play-sessions";
    }
  }

  initSession(meta: SessionMeta) {
    this.sessionMeta = meta;
    this.currentSeq = 0;
    this.memoryEvents = [];
    if (meta.is_guest) {
      this.apiEndpoint = "/api/guest/play-sessions";
    }

    if (typeof window !== "undefined") {
      this.startFlushTimer();
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  getNextSeq(): number {
    this.currentSeq++;
    return this.currentSeq;
  }

  pushEvent(
    eventName: string,
    payload?: Record<string, unknown>,
    occurredAtMs?: number
  ): BufferedEvent {
    if (!this.sessionMeta) {
      throw new Error("Session not initialized in OfflineEventBuffer");
    }

    const seq = this.getNextSeq();
    const now = Date.now();

    // Strip score & PII fields if present (BR-ING-08)
    const cleanPayload: Record<string, unknown> = {};
    if (payload && typeof payload === "object") {
      for (const [key, value] of Object.entries(payload)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey !== "score" &&
          lowerKey !== "display_name" &&
          lowerKey !== "user_id"
        ) {
          cleanPayload[key] = value;
        }
      }
    }

    const ev: BufferedEvent = {
      session_uuid: this.sessionMeta.session_uuid,
      seq,
      event_name: eventName,
      occurred_at_ms: occurredAtMs ?? now - this.sessionMeta.started_at,
      payload: cleanPayload,
      client_timestamp: new Date(now).toISOString(),
      queued_at: now,
    };

    this.memoryEvents.push(ev);
    this.pruneBuffer();

    // Flush if reached threshold (20 events)
    if (this.memoryEvents.length >= 20) {
      this.flush();
    }

    return ev;
  }

  pruneBuffer() {
    const now = Date.now();
    const maxAgeMs = 24 * 60 * 60 * 1000;

    // 1. Drop events older than 24h (BR-OFF-05)
    this.memoryEvents = this.memoryEvents.filter((e) => {
      const age = now - e.queued_at;
      if (age > maxAgeMs) {
        console.warn(
          `[OFFLINE_BUFFER] Dropped event seq ${e.seq} (${e.event_name}) older than 24 hours`
        );
        return false;
      }
      return true;
    });

    // 2. Limit buffer size (5 MB threshold)
    const jsonLen = JSON.stringify(this.memoryEvents).length;
    if (jsonLen > 5 * 1024 * 1024) {
      // Drop oldest non-critical events, keeping game_started and game_completed
      const criticalEvents = this.memoryEvents.filter(
        (e) =>
          e.seq === 1 ||
          e.event_name === "game_started" ||
          e.event_name === "game_completed"
      );
      const otherEvents = this.memoryEvents.filter(
        (e) =>
          e.seq !== 1 &&
          e.event_name !== "game_started" &&
          e.event_name !== "game_completed"
      );
      otherEvents.splice(0, Math.floor(otherEvents.length / 2));
      this.memoryEvents = [...criticalEvents, ...otherEvents].sort(
        (a, b) => a.seq - b.seq
      );
    }
  }

  async flush(): Promise<{ accepted: number; skipped: number }> {
    if (
      this.isFlushing ||
      this.memoryEvents.length === 0 ||
      !this.sessionMeta
    ) {
      return { accepted: 0, skipped: 0 };
    }

    this.isFlushing = true;
    const batch = [...this.memoryEvents].sort((a, b) => a.seq - b.seq);
    const url = `${this.apiEndpoint}/${this.sessionMeta.session_uuid}/events`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
      });

      if (res.ok) {
        const data = await res.json();
        const sentSeqs = new Set(batch.map((e) => e.seq));
        this.memoryEvents = this.memoryEvents.filter(
          (e) => !sentSeqs.has(e.seq)
        );
        return {
          accepted: data.accepted ?? batch.length,
          skipped: data.skipped ?? 0,
        };
      }
      console.warn(
        `[OFFLINE_BUFFER] Flush failed with status ${res.status}. Keeping events in buffer.`
      );
    } catch (err) {
      // Network error or offline -> Keep events in buffer (BR-ING-05 / BR-OFF-01)
      console.warn("[OFFLINE_BUFFER] Network error flushing events:", err);
    } finally {
      this.isFlushing = false;
    }

    return { accepted: 0, skipped: 0 };
  }

  flushBeacon(): boolean {
    if (this.memoryEvents.length === 0 || !this.sessionMeta) {
      return false;
    }
    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      return false;
    }

    const batch = [...this.memoryEvents].sort((a, b) => a.seq - b.seq);
    const url = `${this.apiEndpoint}/${this.sessionMeta.session_uuid}/events`;
    const blob = new Blob([JSON.stringify({ events: batch })], {
      type: "application/json",
    });

    const sent = navigator.sendBeacon(url, blob);
    if (sent) {
      this.memoryEvents = [];
    }
    return sent;
  }

  private readonly handleVisibilityChange = () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      this.flushBeacon();
    }
  };

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 10_000);
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }
  }

  getPendingEvents(): readonly BufferedEvent[] {
    return this.memoryEvents;
  }
}
