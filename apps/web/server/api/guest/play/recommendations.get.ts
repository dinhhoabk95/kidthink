import { getOwnerDb } from "@mindkid/db";
import { type AgeBand, isAgeBand } from "@mindkid/shared";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { getGuestRecommendations } from "#server/services/index.js";

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

  const db = getOwnerDb();

  // P3.6 (D-MW, BR-REC-04, BR-REC-06): Guest recommendations purely from allow-list 'free'
  const recommendations = await getGuestRecommendations(db, {
    ageBand,
    limit,
  });

  return recommendations;
});
