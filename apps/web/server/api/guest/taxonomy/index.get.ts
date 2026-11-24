import { defineEventHandler, getQuery, setHeader } from "h3";
import { z } from "zod";
import { getPublicTaxonomyTree } from "#server/services/taxonomy-service";

const GuestTaxonomyQuerySchema = z.object({
  depth: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // BR-TAX-10: Public max-age 3600 cache
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const parsedQuery = GuestTaxonomyQuerySchema.safeParse(getQuery(event));
  const depth = (parsedQuery.success && parsedQuery.data.depth) || "skill";

  return await getPublicTaxonomyTree(depth);
});
