import { explainReportInputSchema } from "@mindkid/shared";
import { defineEventHandler, setHeader } from "h3";
import { aiAssistantService } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = Number(session.user_id);

  const body = await readRequestBody(event);

  const parsed = explainReportInputSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  setHeader(event, "Cache-Control", "no-store, private");

  const result = await aiAssistantService.explainReport(
    userId,
    parsed.data.child_uuid,
    parsed.data.period_days
  );

  return result;
});
