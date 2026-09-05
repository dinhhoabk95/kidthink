import { AppError } from "@mindkid/auth";
import { ALLOWED_EVENT_NAMES } from "./catalog.js";

export interface IngestEventItem {
  readonly seq: number;
  readonly event_name: string;
  readonly occurred_at_ms?: number;
  readonly payload?: Record<string, unknown>;
  readonly client_timestamp?: string;
}

export function validateBatchPayload(events: readonly IngestEventItem[]): void {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  if (events.length > 100) {
    throw new AppError("BATCH_TOO_LARGE");
  }

  const payloadSize = JSON.stringify(events).length;
  if (payloadSize > 64 * 1024) {
    throw new AppError("PAYLOAD_TOO_LARGE");
  }

  for (const ev of events) {
    if (!ALLOWED_EVENT_NAMES.has(ev.event_name)) {
      throw new AppError("UNKNOWN_EVENT_NAME");
    }
  }
}

export function validateSequenceNumbers(
  events: readonly IngestEventItem[],
  currentMaxSeq: number,
  existingSeqs: ReadonlySet<number>
): void {
  for (const ev of events) {
    if (ev.seq < 1) {
      throw new AppError("INVALID_SEQUENCE");
    }
    if (ev.seq < currentMaxSeq && !existingSeqs.has(ev.seq)) {
      throw new AppError("EVENT_OUT_OF_ORDER");
    }
  }
}
