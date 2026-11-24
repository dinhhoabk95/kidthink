import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import {
  invalidateTaxonomyManagerCache as clearTaxonomyManagerCache,
  getManagerTaxonomySummary,
  TAXONOMY_SUFFICIENT_THRESHOLD as SUFFICIENT_THRESHOLD,
} from "#server/services/taxonomy-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export const TAXONOMY_SUFFICIENT_THRESHOLD = SUFFICIENT_THRESHOLD;

export function invalidateTaxonomyManagerCache(): void {
  clearTaxonomyManagerCache();
}

const ManagerTaxonomyQuerySchema = z.object({
  gaps_only: z.union([z.string(), z.boolean()]).optional(),
  depth: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const parsedQuery = ManagerTaxonomyQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};
  const gapsOnly = query.gaps_only === "true" || query.gaps_only === true;
  const depth = query.depth || "skill";

  return await getManagerTaxonomySummary({ gapsOnly, depth });
});
