import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParams } from "h3";
import { z } from "zod";
import { getManagerTaxonomySkillDetail } from "#server/services/taxonomy-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const SkillCodeParamsSchema = z.object({
  code: z.string().trim().min(1).max(40),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const parsedParams = SkillCodeParamsSchema.safeParse(getRouterParams(event));
  if (!parsedParams.success) {
    throw new ValidationError();
  }

  return await getManagerTaxonomySkillDetail(parsedParams.data.code);
});
