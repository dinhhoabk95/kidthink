import {
  childProfiles,
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  getOwnerDb,
} from "@mindkid/db";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  allowedTiers,
  type CurriculumPlayerItemRef,
  type CurriculumPlayerWeekGoal,
} from "@mindkid/shared";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { H3Event } from "h3";
import { resolveUserActiveEntitlements } from "./entitlements-runtime.js";

export interface EnrolledChildCurriculumDetails {
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
}

export interface ResolvedCurriculumData {
  child: typeof childProfiles.$inferSelect;
  enrollment: EnrolledChildCurriculumDetails;
  items: CurriculumPlayerItemRef[];
  weeks: CurriculumPlayerWeekGoal[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
}

export interface OptionalEnrollmentCurriculumData {
  child: typeof childProfiles.$inferSelect;
  enrollment: EnrolledChildCurriculumDetails | null;
  items: CurriculumPlayerItemRef[];
  weeks: CurriculumPlayerWeekGoal[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
}

export async function resolveEnrolledChildCurriculum(
  _event: H3Event,
  userId: number,
  childUuid: string,
  options: { requireActive?: boolean; requireEnrollment: false }
): Promise<OptionalEnrollmentCurriculumData>;
export async function resolveEnrolledChildCurriculum(
  _event: H3Event,
  userId: number,
  childUuid: string,
  options?: { requireActive?: boolean; requireEnrollment?: true }
): Promise<ResolvedCurriculumData>;
export async function resolveEnrolledChildCurriculum(
  _event: H3Event,
  userId: number,
  childUuid: string,
  options: { requireActive?: boolean; requireEnrollment?: boolean } = {
    requireActive: true,
    requireEnrollment: true,
  }
): Promise<ResolvedCurriculumData | OptionalEnrollmentCurriculumData> {
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
    throw new ChildNotFoundError(childUuid);
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

  const [rawEnrollment] = await enrollmentQuery;

  if (!rawEnrollment) {
    if (options.requireEnrollment === false) {
      const allowed = await resolveUserActiveEntitlements(userId);
      const userAllowedTiers = await allowedTiers(
        {
          kind: "user",
          user_id: String(userId),
          active_child_id: String(child.id),
        },
        allowed
      );
      return {
        child,
        enrollment: null,
        items: [],
        weeks: [],
        completedItemIds: new Set<number>(),
        userAllowedTiers,
      };
    }
    throw new CurriculumNotFoundError();
  }

  const enrollment: EnrolledChildCurriculumDetails = {
    ...rawEnrollment,
    curriculum_version: 1,
  };

  // 3. Batch load curriculum items & weeks (D-MA: pinned curriculum_id)
  const rawItems = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, enrollment.curriculumId));

  const rawWeeks = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, enrollment.curriculumId));

  // 4. Batch resolve entities for items (D-MA & D-AE)
  const gameLevelEntityIds = rawItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  const gameLevelsMap = new Map<
    number,
    { code: string; title: string; access_tier: AccessTier }
  >();
  if (gameLevelEntityIds.length > 0) {
    const glRows = await db
      .select({
        id: gameLevels.id,
        code: gameLevels.code,
        title: gameLevels.title,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(inArray(gameLevels.id, gameLevelEntityIds));

    for (const gl of glRows) {
      gameLevelsMap.set(gl.id, {
        code: gl.code,
        title: gl.title,
        access_tier: gl.accessTier as AccessTier,
      });
    }
  }

  const items: CurriculumPlayerItemRef[] = rawItems.map((item) => {
    let resolvedCode = `${item.entityType}_${item.entityId}`;
    let resolvedTitle = "Trò chơi";
    let resolvedTier: AccessTier = "free";

    const gl = gameLevelsMap.get(item.entityId);
    if (gl) {
      resolvedCode = gl.code;
      resolvedTitle = gl.title;
      resolvedTier = gl.access_tier;
    }

    return {
      id: item.id,
      curriculum_id: item.curriculumId,
      week_no: item.weekNo,
      session_no: item.sessionNo,
      position: item.position,
      entity_type: "game_level",
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
