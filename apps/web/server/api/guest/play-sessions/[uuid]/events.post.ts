import { AppError } from "@kidthink/auth";
import { ingestPlayEvents } from "@kidthink/db";
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";

export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const guestDeviceId =
      getHeader(event, "x-guest-device-id") || "guest-device";
    const body = (await readBody(event)) || {};
    const events = body.events || [];

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
