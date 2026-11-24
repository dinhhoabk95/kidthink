import { type AgeBand, isAgeBand } from "@mindkid/shared";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { getCatalogGuestRecommendations } from "#server/services/catalog-service";

const GuestRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  age_band: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const parsedQuery = GuestRecommendationsQuerySchema.safeParse(
    getQuery(event)
  );
  const query = parsedQuery.success ? parsedQuery.data : {};
  const rawLimit = Number(query.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 5))
    : 5;

  const rawAgeBand =
    typeof query.age_band === "string" ? query.age_band : undefined;
  const ageBand: AgeBand | undefined =
    rawAgeBand && isAgeBand(rawAgeBand) ? rawAgeBand : undefined;

  return await getCatalogGuestRecommendations({
    ageBand,
    limit,
  });
});
