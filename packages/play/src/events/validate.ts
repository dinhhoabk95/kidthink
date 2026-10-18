import { PayloadTooLargeError, ValidationError } from "@mindkid/errors/common";
import {
  BatchTooLargeError,
  EventOutOfOrderError,
  InvalidSequenceError,
  UnknownEventNameError,
} from "@mindkid/errors/play";
import { z } from "zod";
import { ALLOWED_EVENT_NAMES } from "#src/events/catalog";

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
  readonly content_version?: number;
  readonly occurred_at_ms?: number;
  readonly payload?: EventPayload;
  readonly client_timestamp?: string;
}

export const TelemetryEventRecordSchema = z.object({
  session_uuid: z.string().uuid(),
  seq: z.number().int().positive(),
  event_name: z
    .string()
    .min(1)
    .max(100)
    .refine((name) => ALLOWED_EVENT_NAMES.has(name), {
      message: "event_name must be registered in ALLOWED_EVENT_NAMES",
    }),
  content_version: z.number().int().positive(),
  occurred_at_ms: z.number().int().nonnegative().nullable().optional(),
  payload: EventPayloadSchema.optional(),
  client_timestamp: z.date().nullable().optional(),
});
export type TelemetryEventRecord = z.infer<typeof TelemetryEventRecordSchema>;

export const TelemetryEventSchema = TelemetryEventRecordSchema;
export type TelemetryEvent = TelemetryEventRecord;

export function validateTelemetryEventRecord(
  record: TelemetryEventRecord
): TelemetryEventRecord {
  const parsed = TelemetryEventRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new ValidationError();
  }
  return parsed.data;
}

export const validateTelemetryEvent = validateTelemetryEventRecord;

export function validateBatchPayload(events: readonly IngestEventItem[]): void {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  if (events.length > 100) {
    throw new BatchTooLargeError();
  }

  const payloadSize = JSON.stringify(events).length;
  if (payloadSize > 64 * 1024) {
    throw new PayloadTooLargeError();
  }

  for (const ev of events) {
    if (!ALLOWED_EVENT_NAMES.has(ev.event_name)) {
      throw new UnknownEventNameError();
    }
    if (
      ev.content_version !== undefined &&
      (!Number.isInteger(ev.content_version) || ev.content_version < 1)
    ) {
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
      throw new InvalidSequenceError();
    }
    if (ev.seq < currentMaxSeq && !existingSeqs.has(ev.seq)) {
      throw new EventOutOfOrderError();
    }
  }
}
