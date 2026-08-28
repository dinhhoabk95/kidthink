import { activities, getOwnerDb } from "@mindkid/db";
import { desc, inArray } from "drizzle-orm";

const ACTIVITY_FIELDS = {
  id: activities.id,
  entityId: activities.entityId,
  code: activities.code,
  contentVersion: activities.contentVersion,
  kind: activities.kind,
  title: activities.title,
  instruction: activities.instruction,
  materials: activities.materials,
  estimatedMinutes: activities.estimatedMinutes,
  accessTier: activities.accessTier,
  status: activities.status,
} as const;

export type LatestActivity = {
  [K in keyof typeof ACTIVITY_FIELDS]: (typeof activities.$inferSelect)[K];
};

/**
 * Lấy bản mới nhất của từng `entity_id` trong **một** query.
 *
 * Hai route chi tiết bài học trước đây chạy một query cho mỗi activity đính
 * kèm, bọc trong `Promise.all`. Pool của `packages/db/src/client.ts` là
 * `max: 1`, nên `Promise.all` không song song được gì — N activity là N vòng
 * tuần tự trên đúng một connection.
 */
export async function loadLatestActivitiesByEntityId(
  entityIds: readonly number[]
): Promise<Map<number, LatestActivity>> {
  const unique = [...new Set(entityIds)];
  if (unique.length === 0) {
    return new Map();
  }

  const db = getOwnerDb();
  const rows = await db
    .selectDistinctOn([activities.entityId], ACTIVITY_FIELDS)
    .from(activities)
    .where(inArray(activities.entityId, unique))
    .orderBy(activities.entityId, desc(activities.contentVersion));

  return new Map(rows.map((row) => [row.entityId, row]));
}
