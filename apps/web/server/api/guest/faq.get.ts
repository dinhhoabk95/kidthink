import type { FaqItem } from "@mindkid/shared";
import { setHeader } from "h3";
import { listPublishedFaqItems } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";
import {
  GUEST_SEO_TTL,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";

/**
 * `BR-FAQ-04` — nội dung FAQ đọc từ `seo_pages` (`page_type = 'faq'`, `status = 'published'`),
 * fallback an toàn về `FAQ_ITEMS` từ `@mindkid/shared` khi DB chưa seed hàng `faq`.
 */
export default defineApiRoute({
  auth: "guest",
  handler: async ({ event }) => {
    setHeader(
      event,
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600"
    );

    const items = await withGuestSeoCache<FaqItem[]>({
      namespace: "faq",
      key: "published",
      ttlSeconds: GUEST_SEO_TTL.SHORT,
      fetcher: () => listPublishedFaqItems(),
    });
    return { items };
  },
});
