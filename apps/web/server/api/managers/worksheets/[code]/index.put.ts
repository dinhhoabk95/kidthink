import { worksheetFormSchema } from "@mindkid/shared";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import {
  getWorksheetByCode,
  updateWorksheetDraft,
} from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "CODE_REQUIRED",
      message: "Worksheet code is required",
    });
  }

  const existing = await getWorksheetByCode(code);
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "WORKSHEET_NOT_FOUND",
      message: `Worksheet with code ${code} not found`,
    });
  }

  const rawBody = (await readBody(event).catch(() => ({}))) || {};
  const parsed = worksheetFormSchema.partial().safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  try {
    const updated = await updateWorksheetDraft(
      existing.id,
      parsed.data,
      session.manager_id
    );
    return updated;
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
