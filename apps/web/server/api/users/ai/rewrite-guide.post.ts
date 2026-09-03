import { rewriteGuideInputSchema } from "@mindkid/shared";
import { defineEventHandler, readBody, setHeader } from "h3";
import { aiAssistantService } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = Number(session.user_id);

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};

  const parsed = rewriteGuideInputSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  setHeader(event, "Cache-Control", "no-store, private");

  const result = await aiAssistantService.rewriteGuide(
    userId,
    parsed.data.guide_text,
    parsed.data.target_audience
  );

  return result;
});
