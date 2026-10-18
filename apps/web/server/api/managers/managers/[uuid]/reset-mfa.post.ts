import { writeAudit } from "@mindkid/audit";
import { getBrowserSessionService } from "@mindkid/auth";
import {
  activeSessions,
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
} from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getHeader, getRouterParam } from "h3";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";
import { requireReauth } from "#server/utils/reauth-runtime";

/**
 * UC-010: Super Admin đặt lại xác thực hai lớp của một Manager khác.
 * BR-001 chỉ Super Admin + kiểm toán; BR-002 vai trò kiểm ở máy chủ;
 * BR-003 xác minh lại trong 5 phút trên đúng phiên đang dùng.
 */
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

    // Precondition: "một Manager khác với Manager cần khôi phục".
    if (target.id === session.manager_id) {
      throw new ValidationError(
        "Không thể tự đặt lại xác thực hai lớp của chính mình."
      );
    }

    // Precondition: Manager cần khôi phục đã bật xác thực hai lớp.
    if (!target.mfaEnabled) {
      throw new ValidationError(
        "Manager này chưa bật xác thực hai lớp, không có gì để đặt lại."
      );
    }

    // "Phải thiết lập lại trước khi vào bất kỳ trang nào": thu hồi phiên và remember token cũ
    // của Manager đó (UC-009 BR-010) trước khi xoá MFA, để lỗi Redis không để lại phiên sống
    // sau khi MFA đã mất. Phiên của Super Admin không bị đụng.
    await getBrowserSessionService().revokeAll({
      account_type: "manager",
      account_id: target.id,
    });

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .delete(mfaSettings)
        .where(
          and(
            eq(mfaSettings.accountType, "manager"),
            eq(mfaSettings.accountId, target.id)
          )
        );
      await tx
        .delete(mfaRecoveryCodes)
        .where(
          and(
            eq(mfaRecoveryCodes.accountType, "manager"),
            eq(mfaRecoveryCodes.accountId, target.id)
          )
        );
      await tx
        .update(managers)
        .set({
          mfaEnabled: false,
          sessionVersion: sql`${managers.sessionVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(managers.id, target.id));
      await tx
        .update(activeSessions)
        .set({ revokedAt: now })
        .where(
          and(
            eq(activeSessions.accountType, "manager"),
            eq(activeSessions.accountId, target.id),
            isNull(activeSessions.revokedAt)
          )
        );

      // Nêu ai đặt lại cho ai (Postconditions).
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
