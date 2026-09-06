import {
  auditLogs,
  childProfiles,
  curricula,
  curriculumEnrollments,
  getOwnerDb,
} from "@mindkid/db";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";

import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  const idParam = getRouterParam(event, "id");
  const enrollmentId = idParam ? Number(idParam) : undefined;

  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify child belongs to user (BR-CPC-09 / BR-ERR-05 -> 404)
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

  // 2. Find target enrollment
  const whereConditions = [
    eq(curriculumEnrollments.childId, child.id),
    eq(curriculumEnrollments.status, "active"),
  ];
  if (enrollmentId && !Number.isNaN(enrollmentId)) {
    whereConditions.push(eq(curriculumEnrollments.id, enrollmentId));
  }

  const [activeEnrollment] = await db
    .select({
      id: curriculumEnrollments.id,
      curriculumId: curriculumEnrollments.curriculumId,
      code: curricula.code,
      contentVersion: curricula.contentVersion,
    })
    .from(curriculumEnrollments)
    .innerJoin(curricula, eq(curricula.id, curriculumEnrollments.curriculumId))
    .where(and(...whereConditions));

  if (!activeEnrollment) {
    throw new NotFoundError("Bé không có lộ trình học nào đang hoạt động.");
  }

  // 3. Mark enrollment as withdrawn (progress is retained)
  const [updated] = await db
    .update(curriculumEnrollments)
    .set({ status: "withdrawn" })
    .where(eq(curriculumEnrollments.id, activeEnrollment.id))
    .returning();

  if (!updated) {
    throw new InternalError("WITHDRAW_FAILED");
  }

  // 4. Audit log
  await db.insert(auditLogs).values({
    actorType: "user",
    actorId: userId,
    action: "curriculum.withdrawn",
    entityType: "curriculum_enrollment",
    entityId: String(activeEnrollment.id),
    ipAddress: getVerifiedRemoteIp(event),
    afterData: {
      child_id: child.id,
      child_uuid: child.uuid,
      curriculum_code: activeEnrollment.code,
      curriculum_version: activeEnrollment.contentVersion,
    },
  });

  return {
    status: updated.status,
    enrollment_id: updated.id,
  };
});
