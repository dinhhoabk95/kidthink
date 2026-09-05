import { getOwnerDb } from "@mindkid/db";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import {
  searchActivities,
  searchGameLevels,
  searchLessons,
} from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const contentSearchQuerySchema = z.object({
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
  limit: z.coerce.number().min(1).max(100).optional().default(100),
  q: z.string().optional(),
  status: z.string().optional(),
  competency: z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]).optional(),
  cursor: z.string().optional(),
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

export default defineEventHandler(
  async (event): Promise<ContentSearchResponse> => {
    await requireManagerSession(event);

    const db = getOwnerDb();
    const rawQuery = getQuery(event);
    const parsed = contentSearchQuerySchema.parse(rawQuery);

    const viewer = { role: "manager" as const };

    if (parsed.type === "lessons" || parsed.type === "lesson") {
      const result = await searchLessons(db, rawQuery, viewer);
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

    if (parsed.type === "game_levels" || parsed.type === "game_level") {
      const result = await searchGameLevels(db, rawQuery, viewer);
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

    if (parsed.type === "activities" || parsed.type === "activity") {
      const result = await searchActivities(db, rawQuery, viewer);
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
  }
);
