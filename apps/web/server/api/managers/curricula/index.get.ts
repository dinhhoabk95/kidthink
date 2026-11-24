import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listManagerCurriculaCatalog } from "#server/services/curriculum-showcase-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const CurriculaListQuerySchema = z.object({
  search: z.string().optional(),
  program_type: z.enum(["age_based", "journey"]).optional(),
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
  is_koguma: z.enum(["true", "false"]).optional(),
  koguma_track: z.enum(["core_12w", "year_36w"]).optional(),
  koguma_stage: z.coerce.number().int().min(1).max(2).optional(),
  koguma_variant: z.enum(["01", "02", "year-01", "year-02"]).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const parsedQuery = CurriculaListQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};

  return await listManagerCurriculaCatalog({
    search: query.search,
    programType: query.program_type,
    accessTier: query.access_tier,
    isKoguma:
      query.is_koguma === undefined ? undefined : query.is_koguma === "true",
    kogumaTrack: query.koguma_track,
    kogumaStage:
      query.koguma_stage === 1 || query.koguma_stage === 2
        ? query.koguma_stage
        : undefined,
    kogumaVariant: query.koguma_variant,
    page: query.page,
    limit: query.limit,
  });
});
