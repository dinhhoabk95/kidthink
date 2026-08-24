import { performSemanticSearch } from "@mindkid/db";
import { AiSearchQuerySchema } from "@mindkid/shared";
import { defineEventHandler, getQuery, setHeader } from "h3";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = Number(session.user_id);
  const query = getQuery(event);

  const parsed = AiSearchQuerySchema.safeParse(query);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  setHeader(event, "Cache-Control", "no-store, private");

  const result = await performSemanticSearch(
    userId,
    parsed.data.q,
    parsed.data.limit
  );

  return result;
});
