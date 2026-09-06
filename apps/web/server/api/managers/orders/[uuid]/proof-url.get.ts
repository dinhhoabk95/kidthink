import { PROOF_SIGNED_URL_TTL_MINUTES } from "@mindkid/config";
import { auditLogs, getDb, paymentOrders } from "@mindkid/db";
import { OrderNotFoundError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import { getPrivateSignedUrl } from "@mindkid/storage";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw ValidationError.field("uuid", "Order UUID is required");
  }

  const db = getDb();
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.uuid, orderUuid))
    .limit(1);

  if (!order?.proofPath) {
    throw new OrderNotFoundError(orderUuid);
  }

  const signed = await getPrivateSignedUrl({
    path: order.proofPath,
    expiresInMinutes: PROOF_SIGNED_URL_TTL_MINUTES,
  });

  // Record audit log for proof access (BR-PQU-03, D-JK)
  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: session.manager_id,
    action: "proof_viewed",
    entityType: "payment_order",
    entityId: order.uuid,
    beforeData: null,
    afterData: {
      proof_path: order.proofPath,
      signed_url_expires_at: signed.expiresAt.toISOString(),
    },
    reason: "Manager viewed payment proof image",
    ipAddress: getManagerRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || null,
  });

  return {
    url: signed.url,
    expires_at: signed.expiresAt,
  };
});
