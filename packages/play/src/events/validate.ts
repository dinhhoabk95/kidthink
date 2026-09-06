import { PayloadTooLargeError, ValidationError } from "@mindkid/errors/common";

import { z } from "zod";
import { ALLOWED_EVENT_NAMES } from "./catalog.js";

const JsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const EventPayloadValueSchema = z.union([
  JsonPrimitiveSchema,
  z.array(JsonPrimitiveSchema),
  z.record(JsonPrimitiveSchema),
]);
export type EventPayloadValue = z.infer<typeof EventPayloadValueSchema>;

export const EventPayloadSchema = z.record(EventPayloadValueSchema);
export type EventPayload = z.infer<typeof EventPayloadSchema>;

export interface IngestEventItem {
  readonly seq: number;
  readonly event_name: string;
  readonly occurred_at_ms?: number;
  readonly payload?: EventPayload;
  readonly client_timestamp?: string;
}

export function validateBatchPayload(events: readonly IngestEventItem[]): void {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  if (events.length > 100) {
    throw new ValidationError();
  }

  const payloadSize = JSON.stringify(events).length;
  if (payloadSize > 64 * 1024) {
    throw new PayloadTooLargeError();
  }

  for (const ev of events) {
    if (!ALLOWED_EVENT_NAMES.has(ev.event_name)) {
      throw new ValidationError();
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
      throw new ValidationError();
    }
    if (ev.seq < currentMaxSeq && !existingSeqs.has(ev.seq)) {
      throw new ValidationError();
    }
  }
}
