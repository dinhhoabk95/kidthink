import { ValidationError } from "@mindkid/errors/common";
import { SessionNotFoundError } from "@mindkid/errors/play";
import { EventPayloadSchema, ingestPlayEvents } from "@mindkid/play";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  assertSameOriginRequest,
  getOrSetGuestDeviceId,
} from "#server/utils/auth-runtime";

const EventsSchema = z
  .object({
    events: z
      .array(
        z
          .object({
            seq: z.number().int().positive(),
            event_name: z.string().min(1).max(64),
            occurred_at_ms: z.number().int().nonnegative().optional(),
            payload: EventPayloadSchema.optional(),
            client_timestamp: z.string().datetime().optional(),
          })
          .strict()
      )
      .max(100)
      .default([]),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new SessionNotFoundError();
  }
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 64 * 1024);

  const guestDeviceId = getOrSetGuestDeviceId(event);
  const parsed = EventsSchema.safeParse((await readBody(event)) || {});
  if (!parsed.success) {
    throw new ValidationError();
  }
  const events = parsed.data.events;

  const result = await ingestPlayEvents(uuid, events, {
    isUserCall: false,
    guestDeviceId,
  });

  return result;
});
