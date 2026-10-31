import {
  createIndexedDbBufferStorage,
  type OfflineBufferStorageAdapter,
  OfflineEventBuffer,
  type RoundRunner,
  type SessionMeta,
  type TelemetryEvent,
} from "@mindkid/game-engine";
import { useApi } from "~/composables/use-api";

export type CelebrationTier = "great" | "good" | "nice_try";

export interface SessionCompleteResponse {
  readonly rounds_correct?: number;
  readonly rounds_total?: number;
  readonly celebration?: CelebrationTier;
  readonly stars?: number;
}

export type FinishSessionResult =
  | { readonly ok: true; readonly data: SessionCompleteResponse }
  | { readonly ok: false; readonly error: string };

export interface UsePlayTelemetryOptions {
  readonly storage?: OfflineBufferStorageAdapter;
  readonly flushIntervalMs?: number;
  readonly persistIntervalMs?: number;
}

export type ParentGateTelemetryEventName =
  | "parent_gate_shown"
  | "parent_gate_passed"
  | "parent_gate_failed";

export interface ParentGateTelemetryRecord {
  readonly event_name: ParentGateTelemetryEventName;
  readonly payload: Readonly<Record<string, string | number>>;
  readonly timestamp_ms: number;
}

const FORBIDDEN_PARENT_GATE_KEYS = new Set<string>([
  "answer",
  "factor_a",
  "factor_b",
  "challenge_payload",
  "expected_answer",
]);

const parentGateTelemetryRecords: ParentGateTelemetryRecord[] = [];
let activeTelemetryBuffer: OfflineEventBuffer | null = null;
let activeRoundRunner: RoundRunner | null = null;

export function setActiveRoundRunner(runner: RoundRunner | null): void {
  activeRoundRunner = runner;
}

export function sanitizeParentGatePayload(
  eventName: ParentGateTelemetryEventName,
  rawPayload: Readonly<Record<string, string | number>>
): Readonly<Record<string, string | number>> {
  const safe: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (FORBIDDEN_PARENT_GATE_KEYS.has(key)) {
      continue;
    }
    if (eventName === "parent_gate_shown" && key === "trigger") {
      safe.trigger = String(value);
    } else if (
      (eventName === "parent_gate_passed" ||
        eventName === "parent_gate_failed") &&
      key === "attempts"
    ) {
      safe.attempts = Number(value);
    }
  }
  return safe;
}

export function recordParentGateTelemetry(
  eventName: ParentGateTelemetryEventName,
  rawPayload: Readonly<Record<string, string | number>>
): ParentGateTelemetryRecord {
  const payload = sanitizeParentGatePayload(eventName, rawPayload);
  const timestampMs = Date.now();
  const record: ParentGateTelemetryRecord = {
    event_name: eventName,
    payload,
    timestamp_ms: timestampMs,
  };
  parentGateTelemetryRecords.push(record);

  if (
    activeRoundRunner &&
    typeof activeRoundRunner.recordExternalEvent === "function"
  ) {
    activeRoundRunner.getAllTelemetry();
    activeRoundRunner.recordExternalEvent({
      event_name: eventName,
      timestamp_ms: timestampMs,
      data: payload,
    });
  }

  const meta = activeTelemetryBuffer?.getSessionMeta();
  if (activeTelemetryBuffer && meta) {
    if (
      activeRoundRunner &&
      typeof activeRoundRunner.recordExternalEvent === "function"
    ) {
      const events = formatTelemetryPayload(
        activeRoundRunner.getAllTelemetry(),
        new Date(meta.started_at).toISOString()
      );
      activeTelemetryBuffer.ingestEvents(events);
    } else {
      const occurredAtMs = Math.max(
        0,
        Math.min(2_147_483_647, Math.round(timestampMs - meta.started_at))
      );
      activeTelemetryBuffer.ingestEvents([
        {
          seq: activeTelemetryBuffer.getNextSeq(),
          event_name: eventName,
          occurred_at_ms: occurredAtMs,
          client_timestamp: new Date(timestampMs).toISOString(),
          payload,
        },
      ]);
    }
  }

  return record;
}

export function getParentGateTelemetryRecords(): readonly ParentGateTelemetryRecord[] {
  return [...parentGateTelemetryRecords];
}

export function clearParentGateTelemetryRecords(): void {
  parentGateTelemetryRecords.length = 0;
}

interface StatusHolder {
  status: string | number;
}

function extractErrorDetails(err: object | null): {
  status: string;
  message: string;
} {
  const status =
    err !== null && "status" in err
      ? String((err as StatusHolder).status)
      : "unknown_status";
  const message = err instanceof Error ? err.message : String(err);
  return { status, message };
}

export function formatTelemetryPayload(
  rawEvents: readonly TelemetryEvent[],
  sessionStartedAt?: string | null
): {
  seq: number;
  event_name: string;
  occurred_at_ms: number;
  client_timestamp: string;
  payload: TelemetryEvent["data"];
}[] {
  const baseTimeMs = sessionStartedAt
    ? new Date(sessionStartedAt).getTime()
    : (rawEvents[0]?.timestamp_ms ?? Date.now());

  return rawEvents.map((e, index) => ({
    seq: index + 1,
    event_name: e.event_name,
    occurred_at_ms: Math.max(
      0,
      Math.min(2_147_483_647, Math.round(e.timestamp_ms - baseTimeMs))
    ),
    client_timestamp: new Date(e.timestamp_ms).toISOString(),
    payload: e.data,
  }));
}

const defaultPersistentStorage = createIndexedDbBufferStorage();

export function usePlayTelemetry(options?: UsePlayTelemetryOptions) {
  const api = useApi();
  const storage = options?.storage ?? defaultPersistentStorage;

  function playSessionApiBase(loggedIn: boolean): string {
    return loggedIn ? "/api/users" : "/api/guest";
  }

  const buffer = new OfflineEventBuffer({
    storage,
    flushIntervalMs: options?.flushIntervalMs,
    persistIntervalMs: options?.persistIntervalMs,
    sendBatch: async (targetSessionUuid, isGuest, batch) => {
      const endpoint = `${playSessionApiBase(!isGuest)}/play-sessions/${targetSessionUuid}/events`;
      const resp = await api<{ accepted?: number; skipped?: number }>(
        endpoint,
        {
          method: "POST",
          body: {
            events: batch.map((ev) => ({
              seq: ev.seq,
              event_name: ev.event_name,
              occurred_at_ms: ev.occurred_at_ms,
              client_timestamp: ev.client_timestamp,
              payload: ev.payload,
            })),
          },
        }
      );
      return {
        accepted: resp?.accepted ?? batch.length,
        skipped: resp?.skipped ?? 0,
      };
    },
  });

  function initTelemetrySession(meta: SessionMeta): void {
    buffer.initSession(meta);
    activeTelemetryBuffer = buffer;
    if (!meta.is_guest) {
      buffer.restoreAndFlushPersisted().catch(() => undefined);
    }
  }

  function ensureSessionInitialized(
    sessionUuid: string,
    loggedIn: boolean,
    sessionStartedAt?: string | null
  ): void {
    const active = buffer.getSessionMeta();
    if (
      active &&
      active.session_uuid === sessionUuid &&
      active.is_guest === !loggedIn
    ) {
      activeTelemetryBuffer = buffer;
      return;
    }
    buffer.initSession({
      session_uuid: sessionUuid,
      level_code: active?.level_code ?? "UNKNOWN",
      content_version: active?.content_version ?? 1,
      is_guest: !loggedIn,
      started_at: sessionStartedAt
        ? new Date(sessionStartedAt).getTime()
        : Date.now(),
    });
    activeTelemetryBuffer = buffer;
  }

  async function uploadTelemetry(
    sessionUuid: string,
    roundRunner: RoundRunner,
    loggedIn: boolean,
    sessionStartedAt?: string | null,
    precollectedEvents?: readonly TelemetryEvent[]
  ): Promise<void> {
    ensureSessionInitialized(sessionUuid, loggedIn, sessionStartedAt);

    const rawEvents = precollectedEvents ?? roundRunner.getAllTelemetry();
    const events = formatTelemetryPayload(rawEvents, sessionStartedAt);

    buffer.ingestEvents(events);
    if (loggedIn) {
      await buffer.persistToStorage();
    }
    await buffer.flush();
  }

  async function finishSession(
    sessionUuid: string,
    roundRunner: RoundRunner,
    loggedIn: boolean
  ): Promise<FinishSessionResult> {
    const state = roundRunner.getState();
    const telemetryEvents = roundRunner.getAllTelemetry();
    const lastSeq =
      telemetryEvents.length > 0 ? telemetryEvents.length : undefined;
    const payload = {
      last_seq: lastSeq,
      rounds_completed: state.roundsCompleted,
      rounds_total: state.roundsTotal,
      rounds_skipped: state.roundsSkipped,
      hint_count: state.hintCountTotal,
    };

    const endpoint = `${playSessionApiBase(loggedIn)}/play-sessions/${sessionUuid}/complete`;
    try {
      const resp = await api<SessionCompleteResponse>(endpoint, {
        method: "POST",
        body: payload,
      });
      return { ok: true, data: resp };
    } catch (err) {
      const { status, message } = extractErrorDetails(
        err instanceof Object ? err : null
      );
      console.error(
        `[play-telemetry] finishSession thất bại — session: ${sessionUuid}, endpoint: ${endpoint}, status: ${status}, error: ${message}`
      );
      return { ok: false, error: message };
    }
  }

  function destroyTelemetrySession(): void {
    if (activeTelemetryBuffer === buffer) {
      activeTelemetryBuffer = null;
      activeRoundRunner = null;
    }
    parentGateTelemetryRecords.length = 0;
    buffer.destroy();
  }

  function getOfflineBuffer(): OfflineEventBuffer {
    return buffer;
  }

  return {
    initTelemetrySession,
    setActiveRoundRunner,
    uploadTelemetry,
    finishSession,
    destroyTelemetrySession,
    getOfflineBuffer,
    recordParentGateTelemetry,
  };
}
