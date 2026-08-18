import { aiAssistantService } from "@mindkid/db";
import { suggestContentInputSchema } from "@mindkid/shared";
import { defineEventHandler, readBody, setHeader } from "h3";
import { throwValidationError } from "../../../utils/api-error.js";
import { requireWebUserSession } from "../../../utils/auth-runtime.ts";

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = Number(session.user_id);

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};

  const parsed = suggestContentInputSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  setHeader(event, "Cache-Control", "no-store, private");

  const result = await aiAssistantService.suggestContent(userId, {
    childUuid: parsed.data.child_uuid,
    targetSkillCode: parsed.data.target_skill_code,
    contentType: parsed.data.content_type,
    limit: parsed.data.limit,
  });

  return result;
});
