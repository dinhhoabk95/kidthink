import type { TelemetryEvent } from "#src/game-session";

/** Never leave the device — score is server-computed, the rest is PII (BR-ING-08). */
export const STRIPPED_PAYLOAD_KEYS = new Set([
  "score",
  "display_name",
  "user_id",
]);

/** Events worth keeping when the buffer has to be trimmed. */
export const CRITICAL_EVENT_NAMES = new Set(["game_started", "game_completed"]);

export const DANGEROUS_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

export const IDB_DB_NAME = "mindkid_offline_play";
export const IDB_STORE_NAME = "telemetry_events";

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

export interface OfflineBufferStorageAdapter {
  load(sessionUuid?: string): Promise<BufferedEvent[]>;
  save(events: readonly BufferedEvent[], sessionUuid?: string): Promise<void>;
  clear(sessionUuid?: string): Promise<void>;
}

export function isCritical(event: BufferedEvent): boolean {
  return event.seq === 1 || CRITICAL_EVENT_NAMES.has(event.event_name);
}

export function sanitizeTelemetryPayload(
  payload?: BufferedEventPayload
): BufferedEventPayload {
  const clean: BufferedEventPayload = {};
  if (!payload || typeof payload !== "object") {
    return clean;
  }
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (
      DANGEROUS_KEYS.has(key) ||
      DANGEROUS_KEYS.has(lowerKey) ||
      STRIPPED_PAYLOAD_KEYS.has(lowerKey)
    ) {
      continue;
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      clean[key] = sanitizeTelemetryPayload(value as BufferedEventPayload);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const stripSensitiveKeys = sanitizeTelemetryPayload;

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

function isBufferedEvent(
  item: object | null | undefined
): item is BufferedEvent {
  if (!item || typeof item !== "object") {
    return false;
  }
  const candidate = item as Record<
    string,
    string | number | boolean | null | undefined
  >;
  return (
    typeof candidate.seq === "number" &&
    typeof candidate.event_name === "string" &&
    typeof candidate.occurred_at_ms === "number" &&
    typeof candidate.client_timestamp === "string"
  );
}

function parseAndFilterEvents(
  rawResult: readonly BufferedEvent[] | object | null | undefined,
  sessionUuid?: string
): BufferedEvent[] {
  const rawRows = Array.isArray(rawResult) ? rawResult : [];
  const rows: BufferedEvent[] = [];
  for (const row of rawRows) {
    if (isBufferedEvent(row)) {
      rows.push(row);
    }
  }
  return sessionUuid === undefined
    ? rows
    : rows.filter((e) => e.session_uuid === sessionUuid);
}

function writeEventsToRange(
  db: IDBDatabase,
  sessionUuid: string,
  events: readonly BufferedEvent[]
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const range = IDBKeyRange.bound(
        `${sessionUuid}:`,
        `${sessionUuid}:\uffff`
      );
      const tx = db.transaction(IDB_STORE_NAME, "readwrite");
      const store = tx.objectStore(IDB_STORE_NAME);
      if (typeof store.delete !== "function") {
        resolve(false);
        return;
      }
      store.delete(range);
      for (const ev of events) {
        store.put(ev, `${ev.session_uuid}:${ev.seq}`);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function overwriteAllEventsInIdb(
  db: IDBDatabase,
  events: readonly BufferedEvent[]
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, "readwrite");
      const store = tx.objectStore(IDB_STORE_NAME);
      store.clear();
      for (const ev of events) {
        store.put(ev, `${ev.session_uuid}:${ev.seq}`);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function mergeAndOverwrite(
  db: IDBDatabase,
  loadFn: () => Promise<BufferedEvent[]>,
  events: readonly BufferedEvent[],
  sessionUuid?: string
): Promise<boolean> {
  const allEvents = sessionUuid === undefined ? [] : await loadFn();
  const kept = allEvents.filter((e) => e.session_uuid !== sessionUuid);
  const merged = kept.length > 0 ? [...kept, ...events] : events;
  return overwriteAllEventsInIdb(db, merged);
}

export function createIndexedDbBufferStorage(): OfflineBufferStorageAdapter {
  const memoryFallback = createInMemoryBufferStorage();
  let dbPromise: Promise<IDBDatabase | null> | null = null;

  function getDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") {
      dbPromise = null;
      return Promise.resolve(null);
    }
    if (!dbPromise) {
      dbPromise = openIndexedDb().then((db) => {
        if (!db) {
          dbPromise = null;
          return null;
        }
        db.onclose = () => {
          dbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        return db;
      });
    }
    return dbPromise;
  }

  return {
    async load(sessionUuid?: string): Promise<BufferedEvent[]> {
      const db = await getDb();
      if (!db) {
        return memoryFallback.load(sessionUuid);
      }
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(IDB_STORE_NAME, "readonly");
          const store = tx.objectStore(IDB_STORE_NAME);
          const req =
            sessionUuid !== undefined && typeof IDBKeyRange !== "undefined"
              ? store.getAll(
                  IDBKeyRange.bound(`${sessionUuid}:`, `${sessionUuid}:\uffff`)
                )
              : store.getAll();
          req.onsuccess = () => {
            resolve(parseAndFilterEvents(req.result, sessionUuid));
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
      const db = await getDb();
      if (!db) {
        await memoryFallback.save(events, sessionUuid);
        return;
      }
      try {
        const canUseRange =
          sessionUuid !== undefined && typeof IDBKeyRange !== "undefined";
        if (canUseRange) {
          const updatedInRange = await writeEventsToRange(
            db,
            sessionUuid,
            events
          );
          if (updatedInRange) {
            await memoryFallback.clear(sessionUuid);
            return;
          }
        }
        const success = await mergeAndOverwrite(
          db,
          () => this.load(),
          events,
          sessionUuid
        );
        if (success) {
          await memoryFallback.clear(sessionUuid);
          return;
        }
      } catch {
        // Fall back to memory on any IDB transaction error
      }
      await memoryFallback.save(events, sessionUuid);
    },
    async clear(sessionUuid?: string): Promise<void> {
      await memoryFallback.clear(sessionUuid);
      const db = await getDb();
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
            tx.onabort = () => resolve();
          } catch {
            resolve();
          }
        });
        return;
      }
      if (typeof IDBKeyRange !== "undefined") {
        const range = IDBKeyRange.bound(
          `${sessionUuid}:`,
          `${sessionUuid}:\uffff`
        );
        const deletedInRange = await new Promise<boolean>((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, "readwrite");
            const store = tx.objectStore(IDB_STORE_NAME);
            if (typeof store.delete !== "function") {
              resolve(false);
              return;
            }
            store.delete(range);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(true);
            tx.onabort = () => resolve(false);
          } catch {
            resolve(false);
          }
        });
        if (deletedInRange) {
          return;
        }
      }
      const remaining = (await this.load()).filter(
        (e) => e.session_uuid !== sessionUuid
      );
      await this.save(remaining);
    },
  };
}
