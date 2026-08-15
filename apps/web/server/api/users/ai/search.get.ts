import { appError } from "@kidthink/auth";
import { performSemanticSearch } from "@kidthink/db";
import { AiSearchQuerySchema } from "@kidthink/shared";
import { defineEventHandler, getQuery, setHeader } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.ts";

export default defineEventHandler(async (event) => {
  try {
    const session = await requireWebUserSession(event);
    const userId = Number(session.user_id);
    const query = getQuery(event);

    const parsed = AiSearchQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    setHeader(event, "Cache-Control", "no-store, private");

    const result = await performSemanticSearch(
      userId,
      parsed.data.q,
      parsed.data.limit
    );

    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
