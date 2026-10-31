import { ValidationError } from "@mindkid/errors/common";
import { SessionNotFoundError } from "@mindkid/errors/play";
import { EventPayloadSchema, ingestPlayEvents } from "@mindkid/play";
import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import {
  enforceTwoAxisRateLimit,
  getOrSetGuestDeviceId,
} from "#server/utils/auth-runtime";
import { readJsonBodyWithLimit } from "#server/utils/request-body";

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

  await enforceTwoAxisRateLimit(event, "play:events", uuid);

  const guestDeviceId = getOrSetGuestDeviceId(event);
  const rawBody = await readJsonBodyWithLimit(event);
  const parsed = EventsSchema.safeParse(rawBody);
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
