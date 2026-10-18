import type { TelemetryEvent } from "./game-session";

/** Flush once this many events have queued up. */
export const FLUSH_THRESHOLD = 20;
/** Background flush cadence while a session is open. */
export const FLUSH_INTERVAL_MS = 10_000;
/** Background IndexedDB persistence cadence while an authenticated session is open (BR-OFF-03). */
export const PERSIST_INTERVAL_MS = 10_000;
/** Events older than this are dropped unsent (BR-OFF-05). */
export const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;
/** Serialized buffer size above which the oldest non-critical half is dropped (BR-OFF-03). */
export const MAX_BUFFER_BYTES = 5 * 1024 * 1024;
/** Maximum events per HTTP batch request. */
export const MAX_EVENTS_PER_BATCH = 50;

const GUEST_ENDPOINT = "/api/guest/play-sessions";
const USER_ENDPOINT = "/api/users/play-sessions";

/** Never leave the device — score is server-computed, the rest is PII (BR-ING-08). */
const STRIPPED_PAYLOAD_KEYS = new Set(["score", "display_name", "user_id"]);

/** Events worth keeping when the buffer has to be trimmed. */
const CRITICAL_EVENT_NAMES = new Set(["game_started", "game_completed"]);

export type BufferedEventPayload = TelemetryEvent["data"];

export interface BufferedEvent {
  session_uuid: string;
  seq: number;
  event_name: string;
  occurred_at_ms?: number;
  payload?: BufferedEventPayload;
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

export interface OfflineBufferStorageAdapter {
  load(sessionUuid?: string): Promise<BufferedEvent[]>;
  save(events: readonly BufferedEvent[], sessionUuid?: string): Promise<void>;
  clear(sessionUuid?: string): Promise<void>;
}

export type SendBufferedBatchFn = (
  sessionUuid: string,
  isGuest: boolean,
  events: readonly BufferedEvent[]
) => Promise<{ accepted?: number; skipped?: number }>;

export interface OfflineEventBufferOptions {
  isGuest?: boolean;
  getCsrfToken?: () => string | null;
  storage?: OfflineBufferStorageAdapter;
  sendBatch?: SendBufferedBatchFn;
  flushIntervalMs?: number;
  persistIntervalMs?: number;
}

export interface IngestibleTelemetryEvent {
  seq?: number;
  event_name: string;
  occurred_at_ms?: number;
  client_timestamp?: string;
  payload?: BufferedEventPayload;
}

function isCritical(event: BufferedEvent): boolean {
  return event.seq === 1 || CRITICAL_EVENT_NAMES.has(event.event_name);
}

function stripSensitiveKeys(
  payload?: BufferedEventPayload
): BufferedEventPayload {
  const clean: BufferedEventPayload = {};
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

export function createInMemoryBufferStorage(): OfflineBufferStorageAdapter {
  const bySession = new Map<string, BufferedEvent[]>();

  return {
    load(sessionUuid?: string): Promise<BufferedEvent[]> {
      if (sessionUuid !== undefined) {
        const list = bySession.get(sessionUuid) ?? [];
        return Promise.resolve(list.map((e) => ({ ...e })));
      }
      const all: BufferedEvent[] = [];
      for (const list of bySession.values()) {
        for (const ev of list) {
          all.push({ ...ev });
        }
      }
      return Promise.resolve(all);
    },
    save(
      events: readonly BufferedEvent[],
      sessionUuid?: string
    ): Promise<void> {
      if (sessionUuid !== undefined) {
        if (events.length === 0) {
          bySession.delete(sessionUuid);
        } else {
          bySession.set(
            sessionUuid,
            events.map((e) => ({ ...e }))
          );
        }
        return Promise.resolve();
      }
      bySession.clear();
      for (const ev of events) {
        const list = bySession.get(ev.session_uuid) ?? [];
        list.push({ ...ev });
        bySession.set(ev.session_uuid, list);
      }
      return Promise.resolve();
    },
    clear(sessionUuid?: string): Promise<void> {
      if (sessionUuid === undefined) {
        bySession.clear();
      } else {
        bySession.delete(sessionUuid);
      }
      return Promise.resolve();
    },
  };
}

const IDB_DB_NAME = "mindkid_offline_play";
const IDB_STORE_NAME = "telemetry_events";

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function createIndexedDbBufferStorage(): OfflineBufferStorageAdapter {
  const memoryFallback = createInMemoryBufferStorage();

  return {
    async load(sessionUuid?: string): Promise<BufferedEvent[]> {
      const db = await openIndexedDb();
      if (!db) {
        return memoryFallback.load(sessionUuid);
      }
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(IDB_STORE_NAME, "readonly");
          const store = tx.objectStore(IDB_STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => {
            const rows = (req.result ?? []) as BufferedEvent[];
            const filtered =
              sessionUuid === undefined
                ? rows
                : rows.filter((e) => e.session_uuid === sessionUuid);
            resolve(filtered);
          };
          req.onerror = () => resolve(memoryFallback.load(sessionUuid));
        } catch {
          resolve(memoryFallback.load(sessionUuid));
        }
      });
    },
    async save(
      events: readonly BufferedEvent[],
      sessionUuid?: string
    ): Promise<void> {
      await memoryFallback.save(events, sessionUuid);
      const db = await openIndexedDb();
      if (!db) {
        return;
      }
      const existing = await this.load();
      const kept =
        sessionUuid === undefined
          ? []
          : existing.filter((e) => e.session_uuid !== sessionUuid);
      const merged = [...kept, ...events];
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(IDB_STORE_NAME, "readwrite");
          const store = tx.objectStore(IDB_STORE_NAME);
          store.clear();
          for (const ev of merged) {
            store.put(ev, `${ev.session_uuid}:${ev.seq}`);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    },
    async clear(sessionUuid?: string): Promise<void> {
      await memoryFallback.clear(sessionUuid);
      const db = await openIndexedDb();
      if (!db) {
        return;
      }
      if (sessionUuid === undefined) {
        await new Promise<void>((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, "readwrite");
            tx.objectStore(IDB_STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          } catch {
            resolve();
          }
        });
        return;
      }
      const remaining = (await this.load()).filter(
        (e) => e.session_uuid !== sessionUuid
      );
      await this.save(remaining);
    },
  };
}

export class OfflineEventBuffer {
  private memoryEvents: BufferedEvent[] = [];
  private readonly ackedSeqs = new Set<number>();
  private estimatedBytes = 0;
  private currentSeq = 0;
  private sessionMeta: SessionMeta | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private apiEndpoint = USER_ENDPOINT;
  private readonly getCsrfToken: (() => string | null) | null;
  private readonly storage: OfflineBufferStorageAdapter;
  private readonly sendBatch: SendBufferedBatchFn | null;
  private readonly flushIntervalMs: number;
  private readonly persistIntervalMs: number;

  constructor(options?: OfflineEventBufferOptions) {
    if (options?.isGuest) {
      this.apiEndpoint = GUEST_ENDPOINT;
    }
    this.getCsrfToken = options?.getCsrfToken ?? null;
    this.storage = options?.storage ?? createInMemoryBufferStorage();
    this.sendBatch = options?.sendBatch ?? null;
    this.flushIntervalMs = options?.flushIntervalMs ?? FLUSH_INTERVAL_MS;
    this.persistIntervalMs = options?.persistIntervalMs ?? PERSIST_INTERVAL_MS;
  }

  initSession(meta: SessionMeta): void {
    this.sessionMeta = meta;
    this.currentSeq = 0;
    this.memoryEvents = [];
    this.ackedSeqs.clear();
    this.estimatedBytes = 0;
    this.apiEndpoint = meta.is_guest ? GUEST_ENDPOINT : USER_ENDPOINT;

    if (typeof window !== "undefined") {
      this.startFlushTimer();
      if (!meta.is_guest) {
        this.startPersistTimer();
      }
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("online", this.handleOnline);
    }
  }

  getSessionMeta(): SessionMeta | null {
    return this.sessionMeta;
  }

  getNextSeq(): number {
    this.currentSeq++;
    return this.currentSeq;
  }

  pushEvent(
    eventName: string,
    payload?: BufferedEventPayload,
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

    this.appendBufferedEvent(ev);

    if (this.memoryEvents.length >= FLUSH_THRESHOLD) {
      this.flush().catch(() => undefined);
    }

    return ev;
  }

  ingestEvents(
    events: readonly IngestibleTelemetryEvent[]
  ): readonly BufferedEvent[] {
    if (!this.sessionMeta) {
      throw new Error("Session not initialized in OfflineEventBuffer");
    }
    const added: BufferedEvent[] = [];
    const now = Date.now();

    for (const item of events) {
      const seq = item.seq ?? this.getNextSeq();
      if (seq > this.currentSeq) {
        this.currentSeq = seq;
      }
      if (
        this.ackedSeqs.has(seq) ||
        this.memoryEvents.some((existing) => existing.seq === seq)
      ) {
        continue;
      }
      const ev: BufferedEvent = {
        session_uuid: this.sessionMeta.session_uuid,
        seq,
        event_name: item.event_name,
        occurred_at_ms:
          item.occurred_at_ms ?? now - this.sessionMeta.started_at,
        payload: stripSensitiveKeys(item.payload),
        client_timestamp: item.client_timestamp ?? new Date(now).toISOString(),
        queued_at: now,
      };
      this.appendBufferedEvent(ev);
      added.push(ev);
    }

    return added;
  }

  private appendBufferedEvent(ev: BufferedEvent): void {
    this.memoryEvents.push(ev);
    this.estimatedBytes += JSON.stringify(ev).length + 1;

    if (
      this.memoryEvents.length % FLUSH_THRESHOLD === 0 ||
      this.estimatedBytes > MAX_BUFFER_BYTES
    ) {
      this.pruneBuffer();
    }
  }

  private recalcEstimatedBytes(): void {
    let bytes = 2;
    for (const e of this.memoryEvents) {
      bytes += JSON.stringify(e).length + 1;
    }
    this.estimatedBytes = bytes;
  }

  pruneBuffer(): void {
    const now = Date.now();
    const beforeLen = this.memoryEvents.length;

    this.memoryEvents = this.memoryEvents.filter((e) => {
      if (now - e.queued_at > MAX_EVENT_AGE_MS) {
        console.warn(
          `[OFFLINE_BUFFER] Dropped event seq ${e.seq} (${e.event_name}) older than 24 hours`
        );
        return false;
      }
      return true;
    });

    if (this.memoryEvents.length !== beforeLen) {
      this.recalcEstimatedBytes();
    }

    if (this.estimatedBytes <= MAX_BUFFER_BYTES) {
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
    this.recalcEstimatedBytes();
  }

  async persistToStorage(): Promise<void> {
    if (!this.sessionMeta || this.sessionMeta.is_guest) {
      return;
    }
    this.pruneBuffer();
    await this.storage.save(this.memoryEvents, this.sessionMeta.session_uuid);
  }

  private partitionPersistedEvents(
    fresh: readonly BufferedEvent[]
  ): Map<string, BufferedEvent[]> {
    const activeSessionUuid = this.sessionMeta?.session_uuid;
    const bySession = new Map<string, BufferedEvent[]>();

    for (const ev of fresh) {
      if (activeSessionUuid && ev.session_uuid === activeSessionUuid) {
        const isKnown =
          this.ackedSeqs.has(ev.seq) ||
          this.memoryEvents.some((m) => m.seq === ev.seq);
        if (!isKnown) {
          this.memoryEvents.push(ev);
        }
        continue;
      }
      const list = bySession.get(ev.session_uuid) ?? [];
      list.push(ev);
      bySession.set(ev.session_uuid, list);
    }

    if (activeSessionUuid) {
      this.recalcEstimatedBytes();
    }

    return bySession;
  }

  /**
   * Khi mở lại ứng dụng hoặc bắt đầu phiên mới của User đã đăng nhập:
   * đọc mọi sự kiện còn tồn đọng trong storage bền, loại sự kiện >24h
   * (BR-OFF-05) và gửi theo thứ tự `seq` tăng dần trước khi gửi sự kiện phiên
   * mới (BR-OFF-03, BR-OFF-04).
   */
  async restoreAndFlushPersisted(): Promise<{
    accepted: number;
    skipped: number;
    allFlushed: boolean;
  }> {
    if (this.sessionMeta?.is_guest) {
      return { accepted: 0, skipped: 0, allFlushed: true };
    }

    const persisted = await this.storage.load();
    if (persisted.length === 0) {
      return { accepted: 0, skipped: 0, allFlushed: true };
    }

    const now = Date.now();
    const fresh = persisted.filter(
      (e) => now - e.queued_at <= MAX_EVENT_AGE_MS
    );
    if (fresh.length !== persisted.length) {
      await this.storage.save(fresh);
    }

    const bySession = this.partitionPersistedEvents(fresh);
    let totalAccepted = 0;
    let totalSkipped = 0;

    for (const [oldSessionUuid, sessionEvents] of bySession.entries()) {
      const sorted = [...sessionEvents].sort((a, b) => a.seq - b.seq);
      const outcome = await this.sendEventsForSession(
        oldSessionUuid,
        false,
        sorted
      );
      if (!outcome.ok) {
        await this.storage.save(
          sorted.filter((e) => !outcome.sentSeqs.has(e.seq)),
          oldSessionUuid
        );
        return {
          accepted: totalAccepted + outcome.accepted,
          skipped: totalSkipped + outcome.skipped,
          allFlushed: false,
        };
      }
      totalAccepted += outcome.accepted;
      totalSkipped += outcome.skipped;
      await this.storage.clear(oldSessionUuid);
    }

    return {
      accepted: totalAccepted,
      skipped: totalSkipped,
      allFlushed: true,
    };
  }

  async flush(): Promise<{ accepted: number; skipped: number }> {
    if (this.isFlushing) {
      return { accepted: 0, skipped: 0 };
    }

    this.isFlushing = true;
    try {
      const restored = await this.restoreAndFlushPersisted();
      if (!restored.allFlushed) {
        return { accepted: restored.accepted, skipped: restored.skipped };
      }

      if (this.memoryEvents.length === 0 || !this.sessionMeta) {
        return { accepted: restored.accepted, skipped: restored.skipped };
      }

      this.pruneBuffer();
      const batch = this.sortedBatch();
      if (batch.length === 0) {
        return { accepted: restored.accepted, skipped: restored.skipped };
      }

      const outcome = await this.sendEventsForSession(
        this.sessionMeta.session_uuid,
        this.sessionMeta.is_guest,
        batch
      );

      if (outcome.sentSeqs.size > 0) {
        for (const seq of outcome.sentSeqs) {
          this.ackedSeqs.add(seq);
        }
        this.memoryEvents = this.memoryEvents.filter(
          (e) => !outcome.sentSeqs.has(e.seq)
        );
        this.recalcEstimatedBytes();
      }

      if (!this.sessionMeta.is_guest) {
        await this.storage.save(
          this.memoryEvents,
          this.sessionMeta.session_uuid
        );
      }

      return {
        accepted: restored.accepted + outcome.accepted,
        skipped: restored.skipped + outcome.skipped,
      };
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendSingleChunk(
    sessionUuid: string,
    isGuest: boolean,
    chunk: readonly BufferedEvent[]
  ): Promise<{ accepted: number; skipped: number } | null> {
    try {
      if (this.sendBatch) {
        const data = await this.sendBatch(sessionUuid, isGuest, chunk);
        return {
          accepted: data.accepted ?? chunk.length,
          skipped: data.skipped ?? 0,
        };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const csrfToken = this.getCsrfToken?.();
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      const endpoint = `${isGuest ? GUEST_ENDPOINT : USER_ENDPOINT}/${sessionUuid}/events`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ events: chunk }),
      });

      if (!res.ok) {
        console.warn(
          `[OFFLINE_BUFFER] Flush failed with status ${res.status}. Keeping events in buffer.`
        );
        return null;
      }

      const data = (await res.json()) as {
        accepted?: number;
        skipped?: number;
      };
      return {
        accepted: data.accepted ?? chunk.length,
        skipped: data.skipped ?? 0,
      };
    } catch (err) {
      // Network error or offline -> Keep events in buffer (BR-ING-05 / BR-OFF-01)
      console.warn("[OFFLINE_BUFFER] Network error flushing events:", err);
      return null;
    }
  }

  private async sendEventsForSession(
    sessionUuid: string,
    isGuest: boolean,
    sortedEvents: readonly BufferedEvent[]
  ): Promise<{
    ok: boolean;
    accepted: number;
    skipped: number;
    sentSeqs: Set<number>;
  }> {
    let accepted = 0;
    let skipped = 0;
    const sentSeqs = new Set<number>();

    for (
      let from = 0;
      from < sortedEvents.length;
      from += MAX_EVENTS_PER_BATCH
    ) {
      const chunk = sortedEvents.slice(from, from + MAX_EVENTS_PER_BATCH);
      const res = await this.sendSingleChunk(sessionUuid, isGuest, chunk);
      if (!res) {
        return { ok: false, accepted, skipped, sentSeqs };
      }
      for (const ev of chunk) {
        sentSeqs.add(ev.seq);
      }
      accepted += res.accepted;
      skipped += res.skipped;
    }

    return { ok: true, accepted, skipped, sentSeqs };
  }

  flushBeacon(): boolean {
    if (this.memoryEvents.length === 0 || !this.sessionMeta) {
      return false;
    }
    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      return false;
    }

    const batch = this.sortedBatch();
    const blob = new Blob([JSON.stringify({ events: batch })], {
      type: "application/json",
    });

    const sent = navigator.sendBeacon(this.eventsUrl(this.sessionMeta), blob);
    if (sent) {
      for (const ev of batch) {
        this.ackedSeqs.add(ev.seq);
      }
      this.memoryEvents = [];
      this.estimatedBytes = 0;
      if (!this.sessionMeta.is_guest) {
        this.storage
          .clear(this.sessionMeta.session_uuid)
          .catch(() => undefined);
      }
    }
    return sent;
  }

  getPendingEvents(): readonly BufferedEvent[] {
    return this.memoryEvents;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
      window.removeEventListener("online", this.handleOnline);
    }
    if (this.sessionMeta?.is_guest) {
      // BR-OFF-06: Guest buffer only lives in the open session and is wiped on close/leave.
      const guestSessionUuid = this.sessionMeta.session_uuid;
      this.memoryEvents = [];
      this.ackedSeqs.clear();
      this.estimatedBytes = 0;
      this.storage.clear(guestSessionUuid).catch(() => undefined);
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
      if (!this.sessionMeta?.is_guest) {
        this.persistToStorage().catch(() => undefined);
      }
      this.flushBeacon();
    }
  };

  private readonly handleOnline = () => {
    this.flush().catch(() => undefined);
  };

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => undefined);
    }, this.flushIntervalMs);
  }

  private startPersistTimer(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
    }
    this.persistTimer = setInterval(() => {
      this.persistToStorage().catch(() => undefined);
    }, this.persistIntervalMs);
  }
}
