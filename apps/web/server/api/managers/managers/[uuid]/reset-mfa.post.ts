import { writeAudit } from "@mindkid/audit";
import { getOwnerDb, managers, managerTwoFactors } from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { eq, sql } from "drizzle-orm";
import { getHeader, getRouterParam } from "h3";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { revokeAllBetterAuthSessions } from "#server/utils/better-auth";
import { defineApiRoute } from "#server/utils/define-api-route";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineApiRoute({
  auth: "super_admin",
  handler: async ({ event, auth: session }) => {
    requireReauth(event);

    const targetUuid = getRouterParam(event, "uuid");
    if (!targetUuid) {
      throw new NotFoundError();
    }

    const db = getOwnerDb();
    const [target] = await db
      .select()
      .from(managers)
      .where(eq(managers.uuid, targetUuid))
      .limit(1);
    if (!target) {
      throw new NotFoundError();
    }

    if (target.id === session.manager_id) {
      throw new ValidationError(
        "Không thể tự đặt lại xác thực hai lớp của chính mình."
      );
    }

    if (!target.mfaEnabled) {
      throw new ValidationError(
        "Manager này chưa bật xác thực hai lớp, không có gì để đặt lại."
      );
    }

    await revokeAllBetterAuthSessions("manager", target.id);

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .delete(managerTwoFactors)
        .where(eq(managerTwoFactors.userId, target.id));
      await tx
        .update(managers)
        .set({
          mfaEnabled: false,
          sessionVersion: sql`${managers.sessionVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(managers.id, target.id));

      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: session.manager_id,
        action: "manager_mfa_reset",
        entity_type: "manager",
        entity_id: target.id.toString(),
        after_data: { target_manager_uuid: target.uuid },
        ip_address: getVerifiedRemoteIp(event),
        user_agent: getHeader(event, "user-agent") ?? "unknown",
      });
    });

    return { success: true, mfa_enabled: false };
  },
});
