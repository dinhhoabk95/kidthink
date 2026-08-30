import {
  childProfiles,
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import {
  type AccessTier,
  allowedTiers,
  type CurriculumPlayerItemRef,
  type CurriculumPlayerWeekGoal,
} from "@mindkid/shared";
import { and, desc, eq, inArray } from "drizzle-orm";
import { createError, type H3Event, setResponseStatus } from "h3";
import { resolveUserActiveEntitlements } from "./entitlements-runtime.js";

export interface ResolvedCurriculumData {
  child: typeof childProfiles.$inferSelect;
  enrollment: {
    id: number;
    childId: number;
    curriculumId: number;
    enrolledAt: Date;
    status: (typeof curriculumEnrollments.$inferSelect)["status"];
    curriculum_code: string;
    curriculum_version: number;
    curriculum_title: string;
    duration_weeks: number;
    sessions_per_week: number;
  };
  items: CurriculumPlayerItemRef[];
  weeks: CurriculumPlayerWeekGoal[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
}

export async function resolveEnrolledChildCurriculum(
  event: H3Event,
  userId: number,
  childUuid: string,
  options: { requireActive?: boolean } = { requireActive: true }
): Promise<ResolvedCurriculumData> {
  const db = getOwnerDb();

  // 1. Verify child belongs to user (BR-ERR-05 / BR-ACT-03 -> 404)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    );

  if (!child) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ trẻ." },
    });
  }

  // 2. Find enrollment (active or most recent)
  const enrollmentQuery = db
    .select({
      id: curriculumEnrollments.id,
      childId: curriculumEnrollments.childId,
      curriculumId: curriculumEnrollments.curriculumId,
      enrolledAt: curriculumEnrollments.enrolledAt,
      status: curriculumEnrollments.status,
      curriculum_code: curricula.code,
      curriculum_version: curricula.contentVersion,
      curriculum_title: curricula.title,
      duration_weeks: curricula.durationWeeks,
      sessions_per_week: curricula.sessionsPerWeek,
    })
    .from(curriculumEnrollments)
    .innerJoin(curricula, eq(curricula.id, curriculumEnrollments.curriculumId))
    .where(
      options.requireActive
        ? and(
            eq(curriculumEnrollments.childId, child.id),
            eq(curriculumEnrollments.status, "active")
          )
        : eq(curriculumEnrollments.childId, child.id)
    )
    .orderBy(
      desc(curriculumEnrollments.enrolledAt),
      desc(curriculumEnrollments.id)
    );

  const [enrollment] = await enrollmentQuery;

  if (!enrollment) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: {
        code: "NOT_FOUND",
        message: "Bé chưa ghi danh chương trình nào.",
      },
    });
  }

  // 3. Batch load curriculum items & weeks (D-MA: pinned curriculum_id)
  const rawItems = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, enrollment.curriculumId));

  const rawWeeks = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, enrollment.curriculumId));

  // 4. Batch resolve latest published entities for items (D-MA & D-AE)
  const gameLevelEntityIds = rawItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  const lessonEntityIds = rawItems
    .filter((i) => i.entityType === "lesson")
    .map((i) => i.entityId);

  const gameLevelsMap = new Map<
    number,
    { code: string; title: string; access_tier: AccessTier }
  >();
  if (gameLevelEntityIds.length > 0) {
    const glRows = await db
      .select({
        entityId: gameLevels.entityId,
        code: gameLevels.code,
        title: gameLevels.title,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(
        and(
          inArray(gameLevels.entityId, gameLevelEntityIds),
          eq(gameLevels.status, "published")
        )
      );

    for (const gl of glRows) {
      gameLevelsMap.set(gl.entityId, {
        code: gl.code,
        title: gl.title,
        access_tier: gl.accessTier as AccessTier,
      });
    }
  }

  const lessonsMap = new Map<
    number,
    { code: string; title: string; access_tier: AccessTier }
  >();
  if (lessonEntityIds.length > 0) {
    const lesRows = await db
      .select({
        entityId: lessons.entityId,
        code: lessons.code,
        title: lessons.title,
        accessTier: lessons.accessTier,
      })
      .from(lessons)
      .where(
        and(
          inArray(lessons.entityId, lessonEntityIds),
          eq(lessons.status, "published")
        )
      );

    for (const les of lesRows) {
      lessonsMap.set(les.entityId, {
        code: les.code,
        title: les.title,
        access_tier: les.accessTier as AccessTier,
      });
    }
  }

  const items: CurriculumPlayerItemRef[] = rawItems.map((item) => {
    let resolvedCode = `${item.entityType}_${item.entityId}`;
    let resolvedTitle = item.entityType === "lesson" ? "Bài học" : "Trò chơi";
    let resolvedTier: AccessTier = "free";

    if (item.entityType === "game_level") {
      const gl = gameLevelsMap.get(item.entityId);
      if (gl) {
        resolvedCode = gl.code;
        resolvedTitle = gl.title;
        resolvedTier = gl.access_tier;
      }
    } else if (item.entityType === "lesson") {
      const les = lessonsMap.get(item.entityId);
      if (les) {
        resolvedCode = les.code;
        resolvedTitle = les.title;
        resolvedTier = les.access_tier;
      }
    }

    return {
      id: item.id,
      curriculum_id: item.curriculumId,
      week_no: item.weekNo,
      session_no: item.sessionNo,
      position: item.position,
      entity_type: item.entityType as "lesson" | "game_level",
      entity_id: item.entityId,
      code: resolvedCode,
      title: resolvedTitle,
      is_required: item.isRequired,
      access_tier: resolvedTier,
    };
  });

  const weeks: CurriculumPlayerWeekGoal[] = rawWeeks.map((w) => ({
    week_no: w.weekNo,
    goal: w.goal,
  }));

  // 5. Load progress for this enrollment
  const progressRows = await db
    .select({
      curriculumItemId: curriculumItemProgress.curriculumItemId,
      status: curriculumItemProgress.status,
      completedAt: curriculumItemProgress.completedAt,
    })
    .from(curriculumItemProgress)
    .where(
      and(
        eq(curriculumItemProgress.enrollmentId, enrollment.id),
        eq(curriculumItemProgress.status, "completed")
      )
    );

  const completedItemIds = new Set<number>(
    progressRows.map((p) => p.curriculumItemId)
  );

  // 6. User allowed tiers in batch
  const activeKeys = await resolveUserActiveEntitlements(userId);
  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: String(child.id),
    },
    activeKeys
  );

  return {
    child,
    enrollment,
    items,
    weeks,
    completedItemIds,
    userAllowedTiers,
  };
}
