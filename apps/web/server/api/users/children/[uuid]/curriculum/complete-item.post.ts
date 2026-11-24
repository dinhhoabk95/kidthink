import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { completeChildCurriculumItem } from "#server/services/child-curriculum-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const completeItemSchema = z.object({
  curriculum_item_id: z.coerce.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const eventBody = Reflect.get(event.context, "body");
  const raw = eventBody || (await readBody(event).catch(() => ({})));
  const parsed = completeItemSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError("curriculum_item_id là bắt buộc.");
  }

  return await completeChildCurriculumItem({
    userId: Number(user.user_id),
    childUuid: uuid,
    curriculumItemId: parsed.data.curriculum_item_id,
  });
});
