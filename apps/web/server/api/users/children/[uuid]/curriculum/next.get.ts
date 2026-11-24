import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { getNextChildCurriculumStep } from "#server/services/child-curriculum-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const NextQuerySchema = z.object({
  optional: z.enum(["0", "1", "true", "false"]).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const parsedQuery = NextQuerySchema.safeParse(getQuery(event));
  const isOptional =
    parsedQuery.success &&
    (parsedQuery.data.optional === "1" || parsedQuery.data.optional === "true");

  return await getNextChildCurriculumStep({
    event,
    userId: Number(user.user_id),
    childUuid: uuid,
    isOptional,
  });
});
