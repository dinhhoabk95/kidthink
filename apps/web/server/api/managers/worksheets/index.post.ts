import { createWorksheetDraft } from "@mindkid/db";
import { worksheetFormSchema } from "@mindkid/shared";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const rawBody = (await readBody(event).catch(() => ({}))) || {};

  const parsed = worksheetFormSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  try {
    const created = await createWorksheetDraft(parsed.data, session.manager_id);
    setResponseStatus(event, 201);
    return created;
  } catch (err: unknown) {
    const errorObj = err as {
      statusCode?: number;
      message?: string;
      details?: unknown;
    };
    throw createError({
      statusCode: errorObj.statusCode || 500,
      statusMessage: errorObj.message || "INTERNAL_SERVER_ERROR",
      message: errorObj.message,
      data: errorObj.details,
    });
  }
});
