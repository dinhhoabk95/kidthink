import type { z } from "zod";
import type { EventPayload } from "../types.js";
import { EVENT_PAYLOAD_FIELDS, PII_FIELDS } from "./catalog.js";
import { EVENT_PAYLOAD_SCHEMAS } from "./schemas.js";

export const EVENT_PAYLOAD_PARTIAL_SCHEMAS: Readonly<
  Record<string, z.ZodTypeAny>
> = Object.fromEntries(
  Object.entries(EVENT_PAYLOAD_SCHEMAS).map(([name, schema]) => [
    name,
    schema.partial(),
  ])
);

export function cleanEventPayload(
  eventName: string,
  payload?: EventPayload
): EventPayload {
  const cleaned: EventPayload = {};
  const allowed = EVENT_PAYLOAD_FIELDS[eventName] ?? new Set<string>();
  if (payload && typeof payload === "object") {
    for (const [key, value] of Object.entries(payload)) {
      if (allowed.has(key) && !PII_FIELDS.has(key.toLowerCase())) {
        cleaned[key] = value;
      }
    }
  }
  const partialSchema = EVENT_PAYLOAD_PARTIAL_SCHEMAS[eventName];
  if (!partialSchema) {
    return {};
  }
  const parsed = partialSchema.safeParse(cleaned);
  return parsed.success ? (parsed.data as EventPayload) : {};
}
