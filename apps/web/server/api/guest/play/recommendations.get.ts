import { getOwnerDb } from "@mindkid/db";
import { defineEventHandler, getQuery } from "h3";
import { getGuestRecommendations } from "#server/services/index.js";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawLimit = Number(query.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 5))
    : 5;

  const validAgeBands = ["3-4", "4-5", "5-6"] as const;
  const rawAgeBand = query.age_band as string | undefined;
  const ageBand =
    rawAgeBand && (validAgeBands as readonly string[]).includes(rawAgeBand)
      ? (rawAgeBand as "3-4" | "4-5" | "5-6")
      : undefined;

  const db = getOwnerDb();

  // P3.6 (D-MW, BR-REC-04, BR-REC-06): Guest recommendations purely from allow-list 'free'
  const recommendations = await getGuestRecommendations(db, {
    ageBand,
    limit,
  });

  return recommendations;
});
