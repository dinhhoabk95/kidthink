import { InternalError } from "@mindkid/errors/common";
import { worksheetFormSchema } from "@mindkid/shared";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { createWorksheetDraft } from "#server/services/index.js";
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
  } catch (err) {
    const message = err instanceof Error ? err.message : undefined;
    throw new InternalError(message);
  }
});
