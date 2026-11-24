import type { FaqItem } from "@mindkid/shared";
import { defineEventHandler, setHeader } from "h3";
import { buildHomeShowcasePayload } from "#server/services/catalog-service";
import {
  countPublishedLevels,
  listPublishedFaqItems,
  type PublishedLevelCounts,
} from "#server/services/index.js";
import {
  GUEST_SEO_TTL,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";

interface CachedHomeData {
  counts: PublishedLevelCounts;
  faqItems: FaqItem[];
}

function resolveHomeData(): Promise<CachedHomeData> {
  return withGuestSeoCache<CachedHomeData>({
    namespace: "home",
    key: "data",
    ttlSeconds: GUEST_SEO_TTL.SHORT,
    fetcher: async () => {
      const [counts, faqItems] = await Promise.all([
        countPublishedLevels(),
        listPublishedFaqItems(),
      ]);
      return { counts, faqItems };
    },
  });
}

export default defineEventHandler(async (event) => {
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=600"
  );

  const data = await resolveHomeData();
  return buildHomeShowcasePayload(data);
});
