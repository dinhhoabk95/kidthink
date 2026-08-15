import { createWorksheetDraft } from "@kidthink/db";
import { worksheetFormSchema } from "@kidthink/shared";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const parsedBody = await readBody(event).catch(() => ({}));
  const fallbackBody =
    ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
    ((event.context as Record<string, unknown>)?.body as Record<
      string,
      unknown
    >) ||
    {};
  const rawBody =
    parsedBody && Object.keys(parsedBody).length > 0
      ? parsedBody
      : fallbackBody;

  const parsed = worksheetFormSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: parsed.error.issues.map((i) => i.message).join("; "),
      data: parsed.error.issues,
    });
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
