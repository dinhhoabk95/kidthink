import { appError } from "@mindkid/auth";
import {
  activeSessions,
  auditLogs,
  childProfiles,
  entitlements,
  getOwnerDb,
  managers,
  mfaSettings,
  paymentOrders,
  users,
} from "@mindkid/db";
import { projectChildForAdmin } from "@mindkid/shared";
import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, setHeader } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw appError("NOT_FOUND");
  }

  // D-JD: Cache-Control: no-store on user detail endpoint
  setHeader(event, "Cache-Control", "no-store");

  const db = getOwnerDb();
  const [targetUser] = await db
    .select({
      id: users.id,
      uuid: users.uuid,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
      suspendedReason: users.suspendedReason,
      purgeAt: users.purgeAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!targetUser) {
    throw appError("NOT_FOUND");
  }

  const now = new Date();

  // 1. Active sessions count & last active
  const sessionRows = await db
    .select({
      activeCount: count(activeSessions.id),
      lastUsedAt: sql<Date>`max(${activeSessions.lastUsedAt})`.as(
        "last_used_at"
      ),
    })
    .from(activeSessions)
    .where(
      and(
        eq(activeSessions.accountType, "user"),
        eq(activeSessions.accountId, targetUser.id),
        isNull(activeSessions.revokedAt),
        gt(activeSessions.expiresAt, now)
      )
    );

  const activeSessionCount = Number(sessionRows[0]?.activeCount ?? 0);
  let lastActiveAt: string | null = null;
  if (sessionRows[0]?.lastUsedAt) {
    lastActiveAt = new Date(sessionRows[0].lastUsedAt).toISOString();
  } else if (targetUser.updatedAt) {
    lastActiveAt = targetUser.updatedAt.toISOString();
  }

  // Query MFA status
  const [mfaSetting] = await db
    .select({ id: mfaSettings.id, confirmedAt: mfaSettings.confirmedAt })
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, targetUser.id)
      )
    );

  const account = {
    id: targetUser.id,
    uuid: targetUser.uuid,
    email: targetUser.email,
    display_name: targetUser.displayName,
    status: targetUser.status,
    email_verified: targetUser.emailVerifiedAt !== null,
    email_verified_at: targetUser.emailVerifiedAt
      ? targetUser.emailVerifiedAt.toISOString()
      : null,
    mfa_enabled: Boolean(mfaSetting?.confirmedAt),
    suspended_reason: targetUser.suspendedReason ?? null,
    purge_at: targetUser.purgeAt ? targetUser.purgeAt.toISOString() : null,
    active_session_count: activeSessionCount,
    created_at: targetUser.createdAt.toISOString(),
    last_active_at: lastActiveAt,
  };

  // 2. Child profiles (BR-USD-02, BR-CPA-02, D-JF: strictly 4 projected fields)
  const childRows = await db
    .select({
      uuid: childProfiles.uuid,
      displayName: childProfiles.displayName,
      birthYear: childProfiles.birthYear,
      status: childProfiles.status,
      createdAt: childProfiles.createdAt,
      purgeAt: childProfiles.purgeAt,
    })
    .from(childProfiles)
    .where(eq(childProfiles.userId, targetUser.id))
    .orderBy(desc(childProfiles.id));

  const projectedChildren = childRows.map((c) => projectChildForAdmin(c));

  // D-JD & BR-USD-05: Audit synchronously on reading user detail with >=1 child profile
  if (projectedChildren.length > 0) {
    await db.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "manager.child_profiles.viewed",
      entityType: "user",
      entityId: targetUser.uuid,
      reason: "Manager viewed user details containing child profiles",
      ipAddress: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    });
  }

  // 3. Entitlements (Active & History)
  const userEntitlements = await db
    .select({
      id: entitlements.id,
      key: entitlements.entitlementKey,
      source: entitlements.source,
      status: entitlements.status,
      expiresAt: entitlements.expiresAt,
      grantedAt: entitlements.grantedAt,
      grantReason: entitlements.grantReason,
      grantedByManagerId: entitlements.grantedByManagerId,
      grantedByName: managers.displayName,
      grantedByEmail: managers.email,
    })
    .from(entitlements)
    .leftJoin(managers, eq(entitlements.grantedByManagerId, managers.id))
    .where(eq(entitlements.userId, targetUser.id))
    .orderBy(desc(entitlements.id));

  const activeEntitlements = userEntitlements
    .filter(
      (e) =>
        (e.status === "active" || e.status === "soft_unlock") &&
        (!e.expiresAt || new Date(e.expiresAt) > now)
    )
    .map((e) => ({
      id: e.id,
      key: e.key,
      source: e.source,
      status: e.status,
      expires_at: e.expiresAt ? new Date(e.expiresAt).toISOString() : null,
      granted_at: new Date(e.grantedAt).toISOString(),
      grant_reason: e.grantReason ?? null,
      granted_by:
        e.grantedByName ||
        e.grantedByEmail ||
        (e.grantedByManagerId
          ? `Manager #${e.grantedByManagerId}`
          : "Hệ thống"),
    }));

  const historyEntitlements = userEntitlements
    .filter(
      (e) =>
        (e.status !== "active" && e.status !== "soft_unlock") ||
        (e.expiresAt && new Date(e.expiresAt) <= now)
    )
    .map((e) => ({
      id: e.id,
      key: e.key,
      source: e.source,
      status: e.status,
      expires_at: e.expiresAt ? new Date(e.expiresAt).toISOString() : null,
      granted_at: new Date(e.grantedAt).toISOString(),
      grant_reason: e.grantReason ?? null,
      granted_by:
        e.grantedByName ||
        e.grantedByEmail ||
        (e.grantedByManagerId
          ? `Manager #${e.grantedByManagerId}`
          : "Hệ thống"),
    }));

  // 4. Payments (BR-USD-06: return all orders including approved, rejected, submitted)
  const orders = await db
    .select({
      id: paymentOrders.id,
      uuid: paymentOrders.uuid,
      packageCode: paymentOrders.packageCode,
      offerCode: paymentOrders.offerCode,
      amountVnd: paymentOrders.amountVnd,
      status: paymentOrders.status,
      transferNote: paymentOrders.transferNote,
      bankTxnRef: paymentOrders.bankTxnRef,
      createdAt: paymentOrders.createdAt,
      submittedAt: paymentOrders.submittedAt,
      reviewedAt: paymentOrders.reviewedAt,
      adminNote: paymentOrders.adminNote,
    })
    .from(paymentOrders)
    .where(eq(paymentOrders.userId, targetUser.id))
    .orderBy(desc(paymentOrders.id));

  const payments = orders.map((o) => ({
    id: o.id,
    uuid: o.uuid,
    package_code: o.packageCode,
    offer_code: o.offerCode,
    amount_vnd: Number(o.amountVnd),
    status: o.status,
    transfer_note: o.transferNote ?? null,
    bank_txn_ref: o.bankTxnRef ?? null,
    created_at: o.createdAt.toISOString(),
    submitted_at: o.submittedAt ? o.submittedAt.toISOString() : null,
    reviewed_at: o.reviewedAt ? o.reviewedAt.toISOString() : null,
    admin_note: o.adminNote ?? null,
  }));

  return {
    account,
    child_profiles: projectedChildren,
    entitlements: {
      active: activeEntitlements,
      history: historyEntitlements,
    },
    payments,
  };
});
