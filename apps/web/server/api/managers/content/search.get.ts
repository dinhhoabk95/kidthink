import { getOwnerDb } from "@mindkid/db";
import { z } from "zod";
import {
  SearchParamsSchema,
  searchActivities,
  searchGameLevels,
  searchLessons,
} from "#server/services/content-search.js";
import { defineApiRoute } from "#server/utils/define-api-route";

const contentSearchQuerySchema = SearchParamsSchema.extend({
  type: z
    .enum([
      "lessons",
      "game_levels",
      "activities",
      "lesson",
      "game_level",
      "activity",
    ])
    .optional()
    .default("lessons"),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export interface ContentSearchResponseItem {
  id: number;
  entity_id: number;
  code: string;
  title: string;
  estimated_minutes?: number | null;
  difficulty?: number | null;
  kind?: string;
  status: string;
  access_tier: string;
}

export interface ContentSearchResponse {
  items: ContentSearchResponseItem[];
  next_cursor: string | null;
}

export default defineApiRoute({
  auth: "manager",
  query: contentSearchQuerySchema,
  async handler({ query }): Promise<ContentSearchResponse> {
    const db = getOwnerDb();
    const viewer = { role: "manager" as const };

    if (query.type === "lessons" || query.type === "lesson") {
      const result = await searchLessons(db, query, viewer);
      return {
        items: result.items.map((item) => ({
          id: item.id,
          entity_id: item.entity_id,
          code: item.code,
          title: item.title,
          estimated_minutes: item.estimated_minutes,
          status: item.status,
          access_tier: item.access_tier,
        })),
        next_cursor: result.next_cursor,
      };
    }

    if (query.type === "game_levels" || query.type === "game_level") {
      const result = await searchGameLevels(db, query, viewer);
      return {
        items: result.items.map((item) => ({
          id: item.id,
          entity_id: item.entity_id,
          code: item.code,
          title: item.title,
          difficulty: item.difficulty,
          status: item.status,
          access_tier: item.access_tier,
        })),
        next_cursor: result.next_cursor,
      };
    }

    if (query.type === "activities" || query.type === "activity") {
      const result = await searchActivities(db, query, viewer);
      return {
        items: result.items.map((item) => ({
          id: item.id,
          entity_id: item.entity_id,
          code: item.code,
          title: item.title,
          estimated_minutes: item.estimated_minutes,
          kind: item.kind,
          status: item.status,
          access_tier: item.access_tier,
        })),
        next_cursor: result.next_cursor,
      };
    }

    return {
      items: [],
      next_cursor: null,
    };
  },
});
