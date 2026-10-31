import {
  auditLogs,
  childProfiles,
  curricula,
  curriculumEnrollments,
  curriculumItems,
  gameLevels,
  getOwnerDb,
} from "@mindkid/db";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import { AlreadyEnrolledError } from "@mindkid/errors/curriculum";
import { type AccessTier, allowedTiers } from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";
import {
  defineEventHandler,
  getRouterParam,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";

import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

async function assertChildOwnership(
  db: ReturnType<typeof getOwnerDb>,
  uuid: string,
  userId: number,
  _event: H3Event
) {
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, uuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    );

  if (!child) {
    throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
  }
  return child;
}

async function assertNoActiveEnrollment(
  db: ReturnType<typeof getOwnerDb>,
  childId: number,
  _event: H3Event
) {
  const [existingActive] = await db
    .select({
      id: curriculumEnrollments.id,
      curriculumId: curriculumEnrollments.curriculumId,
      code: curricula.code,
    })
    .from(curriculumEnrollments)
    .innerJoin(curricula, eq(curricula.id, curriculumEnrollments.curriculumId))
    .where(
      and(
        eq(curriculumEnrollments.childId, childId),
        eq(curriculumEnrollments.status, "active")
      )
    );

  if (existingActive) {
    throw new AlreadyEnrolledError(
      "Trẻ đang tham gia một chương trình học khác."
    );
  }
}

function computeAgeGap(input: {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): number {
  const { childAge, targetAgeMin, targetAgeMax } = input;
  if (targetAgeMin != null && childAge < targetAgeMin) {
    return targetAgeMin - childAge;
  }
  if (targetAgeMax != null && childAge > targetAgeMax) {
    return childAge - targetAgeMax;
  }
  return 0;
}

function buildAgeRecommendationWarning(input: {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): string | undefined {
  if (computeAgeGap(input) === 0) {
    return;
  }
  const { childAge, targetAgeMin, targetAgeMax } = input;
  return `Chương trình này gợi ý cho trẻ ${targetAgeMin ?? 3}–${targetAgeMax ?? 6} tuổi, bé nhà bạn ${childAge} tuổi`;
}

export function computeAgeRecommendationWarning(
  child: typeof childProfiles.$inferSelect,
  curriculum: typeof curricula.$inferSelect
): string | undefined {
  const currentYear = new Date().getFullYear();
  return buildAgeRecommendationWarning({
    childAge: currentYear - child.birthYear,
    targetAgeMin: curriculum.targetAgeMin,
    targetAgeMax: curriculum.targetAgeMax,
  });
}

export function computeEnrollmentAgeGap(
  child: typeof childProfiles.$inferSelect,
  curriculum: typeof curricula.$inferSelect
): number {
  const currentYear = new Date().getFullYear();
  return computeAgeGap({
    childAge: currentYear - child.birthYear,
    targetAgeMin: curriculum.targetAgeMin,
    targetAgeMax: curriculum.targetAgeMax,
  });
}

async function assertGatingAllowance(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  childId: number,
  curriculumId: number,
  _event: H3Event
) {
  const activeKeys = await resolveUserActiveEntitlements(userId);
  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: String(childId),
    },
    activeKeys
  );

  const items = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, curriculumId));

  const mandatoryItems = items.filter((it) => it.isRequired !== false);
  if (mandatoryItems.length === 0) {
    return;
  }

  const glEntityIds = mandatoryItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  const glTiers = new Map<number, AccessTier>();
  if (glEntityIds.length > 0) {
    const glRows = await db
      .select({
        id: gameLevels.id,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(inArray(gameLevels.id, glEntityIds));
    for (const r of glRows) {
      glTiers.set(r.id, r.accessTier as AccessTier);
    }
  }

  const hasAccessibleMandatoryItem = mandatoryItems.some((item) => {
    const tier = glTiers.get(item.entityId) || "premium";
    return userAllowedTiers.includes(tier);
  });

  if (!hasAccessibleMandatoryItem) {
    throw new ValidationError(
      "Không có bài học bắt buộc nào mở được với gói tài khoản hiện tại."
    );
  }
}

import { z } from "zod";

const createEnrollmentSchema = z.object({
  curriculum_code: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify child belongs to user (BR-CPC-09 / BR-ERR-05 -> 404)
  const child = await assertChildOwnership(db, uuid, userId, event);

  const eventBody = (event.context as { body?: unknown })?.body;
  const raw = eventBody || (await readBody(event).catch(() => ({})));
  const parsed = createEnrollmentSchema.safeParse(raw);

  if (!parsed.success) {
    throw new ValidationError("Mã chương trình là bắt buộc.");
  }

  const curriculumCode = parsed.data.curriculum_code.trim();

  // 2. Check if child already has an active enrollment (D-MB -> 409 ALREADY_ENROLLED)
  await assertNoActiveEnrollment(db, child.id, event);

  // 3. Resolve curriculum by code (D-MA)
  const [curriculum] = await db
    .select()
    .from(curricula)
    .where(eq(curricula.code, curriculumCode));

  if (!curriculum) {
    throw new NotFoundError("Không tìm thấy chương trình học.");
  }

  // 4. Compute age recommendation warning & age_gap (BR-LFM-02, BR-LFM-03, BR-LFM-04 - tuổi không chặn ghi danh)
  const ageGap = computeEnrollmentAgeGap(child, curriculum);
  const ageWarning = computeAgeRecommendationWarning(child, curriculum);

  // 5. Gating pre-check: User must be able to open at least 1 mandatory item (D-ME / BR-CUR-10)
  await assertGatingAllowance(db, userId, child.id, curriculum.id, event);

  // 6. Create enrollment pinning curriculum version (D-MA, BR-CUR-04)
  const [enrollment] = await db
    .insert(curriculumEnrollments)
    .values({
      childId: child.id,
      curriculumId: curriculum.id,
      status: "active",
      enrolledAt: new Date(),
    })
    .returning();

  if (!enrollment) {
    throw new InternalError("Ghi danh lộ trình thất bại");
  }

  // 7. Audit log (INSERT-only)
  await db.insert(auditLogs).values({
    actorType: "user",
    actorId: userId,
    action: "curriculum.enrolled",
    entityType: "curriculum_enrollment",
    entityId: String(enrollment.id),
    ipAddress: getVerifiedRemoteIp(event),
    afterData: {
      child_id: child.id,
      child_uuid: child.uuid,
      curriculum_code: curriculum.code,
      curriculum_version: 1,
      age_gap: ageGap,
      age_warning: ageWarning,
    },
  });

  setResponseStatus(event, 201);
  return {
    enrollment_id: enrollment.id,
    curriculum_code: curriculum.code,
    curriculum_version: 1,
    status: enrollment.status,
    enrolled_at: enrollment.enrolledAt,
    age_gap: ageGap,
    warning: ageWarning,
  };
});
