/** Flush once this many events have queued up. */
const FLUSH_THRESHOLD = 20;
/** Background flush cadence while a session is open. */
const FLUSH_INTERVAL_MS = 10_000;
/** Events older than this are dropped unsent (BR-OFF-05). */
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;
/** Serialized buffer size above which the oldest non-critical half is dropped. */
const MAX_BUFFER_BYTES = 5 * 1024 * 1024;

const GUEST_ENDPOINT = "/api/guest/play-sessions";
const USER_ENDPOINT = "/api/users/play-sessions";

/** Never leave the device — score is server-computed, the rest is PII (BR-ING-08). */
const STRIPPED_PAYLOAD_KEYS = new Set(["score", "display_name", "user_id"]);

/** Events worth keeping when the buffer has to be trimmed. */
const CRITICAL_EVENT_NAMES = new Set(["game_started", "game_completed"]);

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

function isCritical(event: BufferedEvent): boolean {
  return event.seq === 1 || CRITICAL_EVENT_NAMES.has(event.event_name);
}

function stripSensitiveKeys(
  payload?: Record<string, unknown>
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (!payload || typeof payload !== "object") {
    return clean;
  }
  for (const [key, value] of Object.entries(payload)) {
    if (!STRIPPED_PAYLOAD_KEYS.has(key.toLowerCase())) {
      clean[key] = value;
    }
  }
  return clean;
}

export class OfflineEventBuffer {
  private memoryEvents: BufferedEvent[] = [];
  private currentSeq = 0;
  private sessionMeta: SessionMeta | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private apiEndpoint = USER_ENDPOINT;
  private readonly getCsrfToken: (() => string | null) | null;

  constructor(options?: {
    isGuest?: boolean;
    getCsrfToken?: () => string | null;
  }) {
    if (options?.isGuest) {
      this.apiEndpoint = GUEST_ENDPOINT;
    }
    this.getCsrfToken = options?.getCsrfToken ?? null;
  }

  initSession(meta: SessionMeta) {
    this.sessionMeta = meta;
    this.currentSeq = 0;
    this.memoryEvents = [];
    if (meta.is_guest) {
      this.apiEndpoint = GUEST_ENDPOINT;
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

    const now = Date.now();
    const ev: BufferedEvent = {
      session_uuid: this.sessionMeta.session_uuid,
      seq: this.getNextSeq(),
      event_name: eventName,
      occurred_at_ms: occurredAtMs ?? now - this.sessionMeta.started_at,
      payload: stripSensitiveKeys(payload),
      client_timestamp: new Date(now).toISOString(),
      queued_at: now,
    };

    this.memoryEvents.push(ev);
    this.pruneBuffer();

    if (this.memoryEvents.length >= FLUSH_THRESHOLD) {
      this.flush();
    }

    return ev;
  }

  pruneBuffer() {
    const now = Date.now();

    this.memoryEvents = this.memoryEvents.filter((e) => {
      if (now - e.queued_at > MAX_EVENT_AGE_MS) {
        console.warn(
          `[OFFLINE_BUFFER] Dropped event seq ${e.seq} (${e.event_name}) older than 24 hours`
        );
        return false;
      }
      return true;
    });

    if (JSON.stringify(this.memoryEvents).length <= MAX_BUFFER_BYTES) {
      return;
    }

    // Over budget: keep every critical event, drop the oldest half of the rest.
    const critical: BufferedEvent[] = [];
    const other: BufferedEvent[] = [];
    for (const e of this.memoryEvents) {
      (isCritical(e) ? critical : other).push(e);
    }
    other.splice(0, Math.floor(other.length / 2));
    this.memoryEvents = [...critical, ...other].sort((a, b) => a.seq - b.seq);
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
    const batch = this.sortedBatch();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const csrfToken = this.getCsrfToken?.();
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      const res = await fetch(this.eventsUrl(this.sessionMeta), {
        method: "POST",
        headers,
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

    const blob = new Blob([JSON.stringify({ events: this.sortedBatch() })], {
      type: "application/json",
    });

    const sent = navigator.sendBeacon(this.eventsUrl(this.sessionMeta), blob);
    if (sent) {
      this.memoryEvents = [];
    }
    return sent;
  }

  getPendingEvents(): readonly BufferedEvent[] {
    return this.memoryEvents;
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

  private eventsUrl(meta: SessionMeta): string {
    return `${this.apiEndpoint}/${meta.session_uuid}/events`;
  }

  private sortedBatch(): BufferedEvent[] {
    return [...this.memoryEvents].sort((a, b) => a.seq - b.seq);
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
    }, FLUSH_INTERVAL_MS);
  }
}
