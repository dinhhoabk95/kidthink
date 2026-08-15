import { appError } from "@kidthink/auth";
import { aiAssistantService } from "@kidthink/db";
import { summarizeReportInputSchema } from "@kidthink/shared";
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

    const parsed = summarizeReportInputSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    setHeader(event, "Cache-Control", "no-store, private");

    const result = await aiAssistantService.summarizeReport(
      userId,
      parsed.data.child_uuid,
      parsed.data.period_days
    );

    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
