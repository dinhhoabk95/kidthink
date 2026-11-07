import {
  isCritical as checkIsCritical,
  sanitizeTelemetryPayload as cleanTelemetryPayload,
  createIndexedDbBufferStorage as makeIdbStorage,
  createInMemoryBufferStorage as makeMemStorage,
  stripSensitiveKeys as removeSensitiveKeys,
  type BufferedEvent as StoredBufferedEvent,
  type BufferedEventPayload as StoredBufferedEventPayload,
  type OfflineBufferStorageAdapter as StoredOfflineBufferStorageAdapter,
} from "#src/offline-buffer-storage";

export type BufferedEvent = StoredBufferedEvent;
export type BufferedEventPayload = StoredBufferedEventPayload;
export type OfflineBufferStorageAdapter = StoredOfflineBufferStorageAdapter;

export const createIndexedDbBufferStorage = makeIdbStorage;
export const createInMemoryBufferStorage = makeMemStorage;
export const isCritical = checkIsCritical;
export const sanitizeTelemetryPayload = cleanTelemetryPayload;
export const stripSensitiveKeys = removeSensitiveKeys;

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

export interface SessionMeta {
  session_uuid: string;
  level_code: string;
  content_version: number;
  is_guest: boolean;
  started_at: number;
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

function findBeaconBatchPrefix(
  sorted: readonly BufferedEvent[],
  maxBytes: number
): { bestCount: number; bestPayload: string } {
  if (sorted.length === 0) {
    return { bestCount: 0, bestPayload: "" };
  }
  const serializedList = sorted.map((e) => JSON.stringify(e));
  let accumulatedBytes = 12; // base {"events":[]}
  let count = 0;

  for (let i = 0; i < serializedList.length; i++) {
    const item = serializedList[i];
    if (!item) {
      continue;
    }
    const itemBytes = new Blob([item]).size + (i > 0 ? 1 : 0);
    if (accumulatedBytes + itemBytes <= maxBytes) {
      accumulatedBytes += itemBytes;
      count++;
    } else {
      break;
    }
  }

  if (count === 0) {
    return { bestCount: 0, bestPayload: "" };
  }

  const bestPayload = `{"events":[${serializedList.slice(0, count).join(",")}]}`;
  return { bestCount: count, bestPayload };
}

export class OfflineEventBuffer {
  private memoryEvents: BufferedEvent[] = [];
  private readonly ackedSeqs = new Set<number>();
  private readonly seenSeqs = new Set<number>();
  private hasUnflushedPersistedData = true;
  private estimatedBytes = 0;
  private currentSeq = 0;
  private sessionMeta: SessionMeta | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private activeFlushPromise: Promise<{
    accepted: number;
    skipped: number;
  }> | null = null;
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
    this.seenSeqs.clear();
    this.hasUnflushedPersistedData = true;
    this.estimatedBytes = 0;
    this.apiEndpoint = meta.is_guest ? GUEST_ENDPOINT : USER_ENDPOINT;

    if (typeof window !== "undefined") {
      this.startFlushTimer();
      if (this.persistTimer) {
        clearInterval(this.persistTimer);
        this.persistTimer = null;
      }
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
    const seq = this.getNextSeq();
    this.seenSeqs.add(seq);
    const ev: BufferedEvent = {
      session_uuid: this.sessionMeta.session_uuid,
      seq,
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
    const existingSeqs = new Set(this.memoryEvents.map((e) => e.seq));

    for (const item of events) {
      const seq = item.seq ?? this.getNextSeq();
      if (seq > this.currentSeq) {
        this.currentSeq = seq;
      }
      if (
        this.ackedSeqs.has(seq) ||
        this.seenSeqs.has(seq) ||
        existingSeqs.has(seq)
      ) {
        continue;
      }
      this.seenSeqs.add(seq);
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
      existingSeqs.add(seq);
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
    const snapshot = [...this.memoryEvents];
    await this.storage.save(snapshot, this.sessionMeta.session_uuid);
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
    if (this.sessionMeta?.is_guest || !this.hasUnflushedPersistedData) {
      return { accepted: 0, skipped: 0, allFlushed: true };
    }

    const persisted = await this.storage.load();
    if (persisted.length === 0) {
      this.hasUnflushedPersistedData = false;
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

    this.hasUnflushedPersistedData = false;
    return {
      accepted: totalAccepted,
      skipped: totalSkipped,
      allFlushed: true,
    };
  }

  flush(): Promise<{ accepted: number; skipped: number }> {
    if (this.activeFlushPromise) {
      return this.activeFlushPromise;
    }

    this.activeFlushPromise = this.executeFlush().finally(() => {
      this.activeFlushPromise = null;
    });
    return this.activeFlushPromise;
  }

  private async executeFlush(): Promise<{ accepted: number; skipped: number }> {
    const restored = await this.restoreAndFlushPersisted();
    if (!restored.allFlushed) {
      return { accepted: restored.accepted, skipped: restored.skipped };
    }

    let totalAccepted = restored.accepted;
    let totalSkipped = restored.skipped;

    while (this.memoryEvents.length > 0 && this.sessionMeta) {
      this.pruneBuffer();
      const batch = this.sortedBatch();
      if (batch.length === 0) {
        break;
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

      totalAccepted += outcome.accepted;
      totalSkipped += outcome.skipped;

      if (!outcome.ok || outcome.sentSeqs.size === 0) {
        break;
      }
    }

    return {
      accepted: totalAccepted,
      skipped: totalSkipped,
    };
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

    const MAX_BEACON_BYTES = 60 * 1024;
    const sorted = this.sortedBatch();
    const { bestCount, bestPayload } = findBeaconBatchPrefix(
      sorted,
      MAX_BEACON_BYTES
    );

    if (bestCount === 0) {
      return false;
    }

    const sentBatch = sorted.slice(0, bestCount);
    const blob = new Blob([bestPayload], {
      type: "application/json",
    });

    const sent = navigator.sendBeacon(this.eventsUrl(this.sessionMeta), blob);
    if (sent && this.sessionMeta.is_guest) {
      const sentSeqSet = new Set(sentBatch.map((e) => e.seq));
      for (const ev of sentBatch) {
        this.ackedSeqs.add(ev.seq);
      }
      this.memoryEvents = this.memoryEvents.filter(
        (e) => !sentSeqSet.has(e.seq)
      );
      this.recalcEstimatedBytes();
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
    this.ackedSeqs.clear();
    this.seenSeqs.clear();
    if (this.sessionMeta?.is_guest) {
      // BR-OFF-06: Guest buffer only lives in the open session and is wiped on close/leave.
      const guestSessionUuid = this.sessionMeta.session_uuid;
      this.memoryEvents = [];
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
