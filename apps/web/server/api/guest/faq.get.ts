import { getOwnerDb } from "@mindkid/db";
import { setHeader } from "h3";
import { listPublishedFaqItems } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";

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

    const items = await listPublishedFaqItems(getOwnerDb());
    return { items };
  },
});
