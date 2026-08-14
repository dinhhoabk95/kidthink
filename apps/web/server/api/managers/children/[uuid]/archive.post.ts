import { appError } from "@kidthink/auth";
import { auditLogs, childProfiles, getOwnerDb } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";
import { executeArchiveChildProfile } from "../../../../utils/child-archive-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const session = await requireSuperAdminSession(event);
    const childUuid = getRouterParam(event, "uuid");
    if (!childUuid) {
      throw appError("NOT_FOUND");
    }

    const rawBody =
      event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
    const reason =
      typeof rawBody?.reason === "string" ? rawBody.reason.trim() : "";

    // BR-CPA-07 & Task 5: reason is required (>= 10 chars per ADMIN_NOTE_REQUIRED)
    if (reason.length < 10) {
      throw appError("ADMIN_NOTE_REQUIRED");
    }

    const db = getOwnerDb();
    const [targetChild] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.uuid, childUuid))
      .limit(1);

    if (!targetChild) {
      throw appError("NOT_FOUND");
    }

    if (targetChild.status === "pending_deletion") {
      throw appError("CHILD_PENDING_DELETION");
    }

    // Reuse canonical archive execution (D-IG, P1.9)
    const result = await executeArchiveChildProfile({
      childId: targetChild.id,
      userId: targetChild.userId,
      reason,
    });

    // Record audit log
    await db.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "manager.child_profile.archived",
      entityType: "child_profile",
      entityId: targetChild.uuid,
      reason,
      ipAddress: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    });

    return {
      success: true,
      status: result.status,
      uuid: result.uuid,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
