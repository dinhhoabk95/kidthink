import type { EmojiCategory } from "@kidthink/emoji";
import {
  ALL_EMOJIS,
  getAllCategories,
  getEmojisByCategory,
  searchEmoji,
} from "@kidthink/emoji";
import { defineEventHandler, getQuery, setHeader } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    await requireManagerSession(event);

    const rawQuery = (getQuery(event) || {}) as Record<string, unknown>;
    const contextQuery = ((event as Record<string, unknown>).query ||
      {}) as Record<string, unknown>;

    const query: Record<string, unknown> = {
      ...rawQuery,
      ...contextQuery,
    };

    const q = typeof query.q === "string" ? query.q.trim() : "";
    const category =
      typeof query.category === "string" ? query.category.trim() : "";
    const ageBand =
      typeof query.age_band === "string" ? query.age_band.trim() : "";
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

    const responseNode = event.node?.res as
      | { setHeader?: (name: string, value: string) => void }
      | undefined;
    if (typeof responseNode?.setHeader === "function") {
      setHeader(event, "Cache-Control", "private, max-age=3600");
    }

    let pool = ALL_EMOJIS;

    if (q) {
      pool = searchEmoji(q, 100);
    } else if (category) {
      pool = getEmojisByCategory(category as EmojiCategory);
    }

    // Filter out blocked suitability and deprecated items
    const filtered = pool.filter((e) => {
      const entryRecord = e as unknown as Record<string, unknown>;
      if (entryRecord.deprecated) {
        return false;
      }
      if (
        e.age_suitability &&
        (e.age_suitability as unknown as string) === "blocked"
      ) {
        return false;
      }
      if (
        ageBand &&
        e.age_suitability &&
        typeof e.age_suitability === "object" &&
        (e.age_suitability as Record<string, string>)[ageBand] === "blocked"
      ) {
        return false;
      }
      return true;
    });

    const results = filtered.slice(0, limit).map((e) => ({
      name: e.name,
      emoji: e.emoji,
      category: e.category,
      group: e.group,
      keywords: e.keywords,
      code: e.code,
    }));

    return {
      items: results,
      total: filtered.length,
      categories: getAllCategories(),
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
