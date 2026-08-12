import { AppError } from "@kidthink/auth";
import { ingestPlayEvents } from "@kidthink/db";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
  getOrSetGuestDeviceId,
} from "../../../../utils/auth-runtime.js";

const EventsSchema = z
  .object({
    events: z
      .array(
        z
          .object({
            seq: z.number().int().positive(),
            event_name: z.string().min(1).max(64),
            occurred_at_ms: z.number().int().nonnegative().optional(),
            payload: z.record(z.unknown()).optional(),
            client_timestamp: z.string().datetime().optional(),
          })
          .strict()
      )
      .max(100)
      .default([]),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }
    assertSameOriginRequest(event);
    assertRequestBodySize(event, 64 * 1024);

    const guestDeviceId = getOrSetGuestDeviceId(event);
    const parsed = EventsSchema.safeParse((await readBody(event)) || {});
    if (!parsed.success) {
      throw new AppError("VALIDATION_FAILED");
    }
    const events = parsed.data.events;

    const result = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId,
    });

    return result;
  } catch (err) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    throw err;
  }
});
