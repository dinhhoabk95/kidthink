import { appError } from "@kidthink/auth";
import { aiAssistantService } from "@kidthink/db";
import { suggestContentInputSchema } from "@kidthink/shared";
import { defineEventHandler, readBody, setHeader } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.ts";

export default defineEventHandler(async (event) => {
  try {
    const session = await requireWebUserSession(event);
    const userId = Number(session.user_id);

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};

    const parsed = suggestContentInputSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    setHeader(event, "Cache-Control", "no-store, private");

    const result = await aiAssistantService.suggestContent(userId, {
      childUuid: parsed.data.child_uuid,
      targetSkillCode: parsed.data.target_skill_code,
      contentType: parsed.data.content_type,
      limit: parsed.data.limit,
    });

    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
