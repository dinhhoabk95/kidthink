import { InternalError, ValidationError } from "@mindkid/errors/common";
import { WorksheetNotFoundError } from "@mindkid/errors/content";
import { worksheetFormSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
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
    throw new ValidationError("Worksheet code is required");
  }

  const existing = await getWorksheetByCode(code);
  if (!existing) {
    throw new WorksheetNotFoundError(`Worksheet with code ${code} not found`);
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
    throw new InternalError(errorObj.message);
  }
});
