import type { EmojiCategory } from "@mindkid/emoji";
import {
  ALL_EMOJIS,
  getAllCategories,
  getEmojisByCategory,
  searchEmoji,
} from "@mindkid/emoji";
import { defineEventHandler, getQuery, setHeader } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const EmojiSearchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  age_band: z.string().optional(),
  limit: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const parsedQuery = EmojiSearchQuerySchema.safeParse(getQuery(event) || {});
  const query = parsedQuery.success ? parsedQuery.data : {};

  const q = typeof query.q === "string" ? query.q.trim() : "";
  const category =
    typeof query.category === "string" ? query.category.trim() : "";
  const ageBand =
    typeof query.age_band === "string" ? query.age_band.trim() : "";
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

  setHeader(event, "Cache-Control", "private, max-age=3600");

  let pool = ALL_EMOJIS;

  if (q) {
    pool = searchEmoji(q, ALL_EMOJIS.length);
  } else if (category) {
    pool = getEmojisByCategory(category as EmojiCategory);
  }

  // Filter based on category (when combined with q) and age_min
  const filtered = pool.filter((e) => {
    if (q && category && !e.categories.includes(category as EmojiCategory)) {
      return false;
    }
    if (ageBand) {
      const minAge = Number(ageBand.split("-")[0]) || 3;
      if (e.age_min > minAge) {
        return false;
      }
    }
    return true;
  });

  const results = filtered.slice(0, limit).map((e) => ({
    name: e.name,
    emoji: e.emoji,
    categories: e.categories,
    keywords: e.keywords,
    age_min: e.age_min,
  }));

  return {
    items: results,
    total: filtered.length,
    categories: getAllCategories(),
  };
});
