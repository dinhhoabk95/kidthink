import { defineEventHandler, getQuery, setHeader } from "h3";
import { toPublicCatalogPayload } from "#server/services/catalog-service";
import { searchGameLevels } from "#server/services/index.js";
import {
  buildCanonicalQueryCacheKey,
  GUEST_SEO_TTL,
  hasUncacheableSearchQuery,
  normalizeQueryRecord,
  type QueryRecordInput,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";

/**
 * Danh mục công khai — `docs/specs/02-public/game-catalog-public.md`.
 *
 * `BR-GCP-02` §9 & `BR-GCP-09`: route này giữ hợp đồng cache công khai và
 * không đọc session.
 */
export default defineEventHandler(async (event) => {
  const query = normalizeQueryRecord(getQuery(event) as QueryRecordInput);

  const cachedResult = await withGuestSeoCache({
    namespace: "levels-catalog",
    key: buildCanonicalQueryCacheKey(query),
    ttlSeconds: GUEST_SEO_TTL.SHORT,
    bypass: hasUncacheableSearchQuery(query),
    fetcher: async () => {
      const result = await searchGameLevels(query, { role: "guest" });
      return toPublicCatalogPayload(result);
    },
  });

  if (cachedResult.noStore) {
    setHeader(
      event,
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate"
    );
  } else {
    setHeader(
      event,
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600"
    );
  }

  return cachedResult.payload;
});
