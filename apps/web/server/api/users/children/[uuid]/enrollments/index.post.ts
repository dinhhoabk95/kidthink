import {
  auditLogs,
  childProfiles,
  curricula,
  curriculumEnrollments,
  curriculumItems,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import { type AccessTier, allowedTiers } from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";

import {
  assertRequestBodySize,
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "../../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../../utils/entitlements-runtime.js";

async function assertChildOwnership(
  db: ReturnType<typeof getOwnerDb>,
  uuid: string,
  userId: number,
  event: H3Event
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
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ trẻ." },
    });
  }
  return child;
}

async function assertNoActiveEnrollment(
  db: ReturnType<typeof getOwnerDb>,
  childId: number,
  event: H3Event
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
    setResponseStatus(event, 409);
    throw createError({
      statusCode: 409,
      statusMessage: "ALREADY_ENROLLED",
      data: {
        code: "ALREADY_ENROLLED",
        message: "Trẻ đang tham gia một chương trình học khác.",
        details: { curriculum_code: existingActive.code },
      },
    });
  }
}

function assertChildAgeMatchesCurriculum(
  child: typeof childProfiles.$inferSelect,
  curriculum: typeof curricula.$inferSelect,
  event: H3Event
) {
  const currentYear = new Date().getFullYear();
  const childAge = currentYear - child.birthYear;
  if (
    (curriculum.targetAgeMin && childAge < curriculum.targetAgeMin) ||
    (curriculum.targetAgeMax && childAge > curriculum.targetAgeMax)
  ) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "CHILD_AGE_OUT_OF_RANGE",
      data: {
        code: "CHILD_AGE_OUT_OF_RANGE",
        message: `Chương trình dành cho độ tuổi ${curriculum.targetAgeMin ?? 3}–${curriculum.targetAgeMax ?? 6} tuổi.`,
      },
    });
  }
}

async function assertGatingAllowance(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  childId: number,
  curriculumId: number,
  event: H3Event
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
  const lesEntityIds = mandatoryItems
    .filter((i) => i.entityType === "lesson")
    .map((i) => i.entityId);

  const glTiers = new Map<number, AccessTier>();
  if (glEntityIds.length > 0) {
    const glRows = await db
      .select({
        entityId: gameLevels.entityId,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(
        and(
          inArray(gameLevels.entityId, glEntityIds),
          eq(gameLevels.status, "published")
        )
      );
    for (const r of glRows) {
      glTiers.set(r.entityId, r.accessTier as AccessTier);
    }
  }

  const lesTiers = new Map<number, AccessTier>();
  if (lesEntityIds.length > 0) {
    const lesRows = await db
      .select({
        entityId: lessons.entityId,
        accessTier: lessons.accessTier,
      })
      .from(lessons)
      .where(
        and(
          inArray(lessons.entityId, lesEntityIds),
          eq(lessons.status, "published")
        )
      );
    for (const r of lesRows) {
      lesTiers.set(r.entityId, r.accessTier as AccessTier);
    }
  }

  const hasAccessibleMandatoryItem = mandatoryItems.some((item) => {
    const tier =
      item.entityType === "game_level"
        ? glTiers.get(item.entityId) || "premium"
        : lesTiers.get(item.entityId) || "premium";
    return userAllowedTiers.includes(tier);
  });

  if (!hasAccessibleMandatoryItem) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message:
          "Không có bài học bắt buộc nào mở được với gói tài khoản hiện tại.",
      },
    });
  }
}

import { z } from "zod";

const createEnrollmentSchema = z.object({
  curriculum_code: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify child belongs to user (BR-CPC-09 / BR-ERR-05 -> 404)
  const child = await assertChildOwnership(db, uuid, userId, event);

  const eventBody = (event.context as { body?: unknown })?.body;
  const raw = eventBody || (await readBody(event).catch(() => ({})));
  const parsed = createEnrollmentSchema.safeParse(raw);

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Mã chương trình là bắt buộc.",
      },
    });
  }

  const curriculumCode = parsed.data.curriculum_code.trim();

  // 2. Check if child already has an active enrollment (D-MB -> 409 ALREADY_ENROLLED)
  await assertNoActiveEnrollment(db, child.id, event);

  // 3. Resolve published curriculum by code (D-MA)
  const [curriculum] = await db
    .select()
    .from(curricula)
    .where(
      and(eq(curricula.code, curriculumCode), eq(curricula.status, "published"))
    );

  if (!curriculum) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: {
        code: "NOT_FOUND",
        message: "Không tìm thấy chương trình học.",
      },
    });
  }

  // 4. Validate child's age against target_age_min / target_age_max
  assertChildAgeMatchesCurriculum(child, curriculum, event);

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

  // 7. Audit log (INSERT-only)
  await db.insert(auditLogs).values({
    actorType: "user",
    actorId: userId,
    action: "curriculum.enrolled",
    entityType: "curriculum_enrollment",
    entityId: enrollment.id,
    ipAddress: getVerifiedRemoteIp(event),
    metadata: {
      child_id: child.id,
      child_uuid: child.uuid,
      curriculum_code: curriculum.code,
      curriculum_version: curriculum.contentVersion,
    },
  });

  setResponseStatus(event, 201);
  return {
    enrollment_id: enrollment.id,
    curriculum_code: curriculum.code,
    curriculum_version: curriculum.contentVersion,
    status: enrollment.status,
    enrolled_at: enrollment.enrolledAt,
  };
});
