import { writeAudit } from "@mindkid/audit";
import {
  activities,
  contentAssetRefs,
  contentAudio,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { ContentInUseError } from "@mindkid/errors/content";
import { deletePublicAudio } from "@mindkid/storage";
import { and, eq, inArray, or } from "drizzle-orm";
import { getHeader, getRouterParam } from "h3";
import { z } from "zod";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const idParamSchema = z.string().uuid();

// biome-ignore lint/style/useConsistentTypeDefinitions: type alias để thoả ràng buộc JsonValue
type ReferencingEntity = {
  entity_type: string;
  entity_id: number;
  code: string;
  status: string;
};

async function findPublishedAudioUsages(
  db: ReturnType<typeof getOwnerDb>,
  audioId: string,
  audioPath: string
): Promise<ReferencingEntity[]> {
  const refs = await db
    .select()
    .from(contentAssetRefs)
    .where(
      or(
        eq(contentAssetRefs.assetRef, audioPath),
        eq(contentAssetRefs.assetRef, audioId)
      )
    );

  if (refs.length === 0) {
    return [];
  }

  const levelIds = refs
    .filter((r) => r.entityType === "game_level")
    .map((r) => r.entityId);
  const lessonIds = refs
    .filter((r) => r.entityType === "lesson")
    .map((r) => r.entityId);
  const activityIds = refs
    .filter((r) => r.entityType === "activity")
    .map((r) => r.entityId);

  const publishedUsages: ReferencingEntity[] = [];

  if (levelIds.length > 0) {
    const rows = await db
      .select({
        id: gameLevels.id,
        code: gameLevels.code,
        status: gameLevels.status,
      })
      .from(gameLevels)
      .where(
        and(
          inArray(gameLevels.id, levelIds),
          eq(gameLevels.status, "published")
        )
      );
    for (const r of rows) {
      publishedUsages.push({
        entity_type: "game_level",
        entity_id: r.id,
        code: r.code,
        status: r.status,
      });
    }
  }

  if (lessonIds.length > 0) {
    const rows = await db
      .select({ id: lessons.id, code: lessons.code, status: lessons.status })
      .from(lessons)
      .where(
        and(inArray(lessons.id, lessonIds), eq(lessons.status, "published"))
      );
    for (const r of rows) {
      publishedUsages.push({
        entity_type: "lesson",
        entity_id: r.id,
        code: r.code,
        status: r.status,
      });
    }
  }

  if (activityIds.length > 0) {
    const rows = await db
      .select({
        id: activities.id,
        code: activities.code,
        status: activities.status,
      })
      .from(activities)
      .where(
        and(
          inArray(activities.id, activityIds),
          eq(activities.status, "published")
        )
      );
    for (const r of rows) {
      publishedUsages.push({
        entity_type: "activity",
        entity_id: r.id,
        code: r.code,
        status: r.status,
      });
    }
  }

  return publishedUsages;
}

export default defineApiRoute({
  auth: "manager",
  handler: async ({ event, auth }) => {
    const rawId = getRouterParam(event, "id");
    const parsedId = idParamSchema.safeParse(rawId);
    if (!parsedId.success) {
      throw new ValidationError("ID file âm thanh không hợp lệ.");
    }

    const audioId = parsedId.data;
    const db = getOwnerDb();

    const [audio] = await db
      .select()
      .from(contentAudio)
      .where(eq(contentAudio.id, audioId))
      .limit(1);

    if (!audio) {
      throw new NotFoundError("Không tìm thấy file âm thanh.");
    }

    const publishedUsages = await findPublishedAudioUsages(
      db,
      audio.id,
      audio.path
    );
    if (publishedUsages.length > 0) {
      throw new ContentInUseError(
        "Không thể xoá file âm thanh đang được sử dụng bởi nội dung đã xuất bản.",
        { usages: publishedUsages }
      );
    }

    const ipAddress = getVerifiedRemoteIp(event);
    const userAgent = getHeader(event, "user-agent") ?? null;

    await db.transaction(async (tx) => {
      await tx
        .delete(contentAssetRefs)
        .where(
          or(
            eq(contentAssetRefs.assetRef, audio.path),
            eq(contentAssetRefs.assetRef, audio.id)
          )
        );

      await tx.delete(contentAudio).where(eq(contentAudio.id, audio.id));

      // BR-AST-08: Record audit log synchronously in transaction
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: auth.manager_id,
        action: "content_archived",
        entity_type: "content_audio",
        entity_id: audio.id,
        before_data: {
          path: audio.path,
          owner_type: audio.ownerType,
          owner_id: audio.ownerId,
          mime_type: audio.mimeType,
          duration_ms: audio.durationMs,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    });

    deletePublicAudio(audio.path);

    return {
      success: true,
      id: audio.id,
    };
  },
});
