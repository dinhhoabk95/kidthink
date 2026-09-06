import {
  getOwnerDb,
  notificationDeliveries,
  notifications,
  users,
} from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { and, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

/**
 * Mask email for privacy (BR-NTA-06, BR-LOG-04): j***@example.com
 */
function redactEmail(email: string): string {
  const parts = email.split("@");
  const name = parts[0];
  const domain = parts[1];
  if (!(name && domain) || parts.length !== 2) {
    return email;
  }
  const firstChar = name.charAt(0) || "u";
  return `${firstChar}***@${domain}`;
}

/**
 * Strips raw OTP / token fields from payload display (BR-NTA-06)
 */
function sanitizeNotificationPayload(
  payload: Record<string, unknown> | null,
  templateCode: string
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const clean = { ...payload };

  if (clean.otp) {
    clean.otp = "******";
  }
  if (clean.code) {
    clean.code = "******";
  }
  if (clean.token) {
    clean.token = "******";
  }
  if (
    (templateCode.includes("otp") || templateCode.includes("verify")) &&
    clean.password
  ) {
    clean.password = undefined;
  }

  return clean;
}

function parseRecipientCondition(recipient?: unknown): SQL | undefined {
  if (typeof recipient !== "string" || !recipient.trim()) {
    return undefined;
  }
  const term = recipient.trim();
  const num = Number(term);
  if (!Number.isNaN(num) && num > 0) {
    return or(
      eq(notifications.recipientId, num),
      ilike(users.email, `%${term}%`)
    );
  }
  return ilike(users.email, `%${term}%`);
}

function parseDateCondition(
  field: typeof notificationDeliveries.createdAt,
  value: unknown,
  operator: "gte" | "lte"
): SQL | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) {
    return undefined;
  }
  return operator === "gte" ? gte(field, d) : lte(field, d);
}

function buildQueryConditions(query: Record<string, unknown>): SQL[] {
  const conditions: SQL[] = [];

  if (typeof query.code === "string" && query.code.trim()) {
    conditions.push(eq(notifications.templateCode, query.code.trim()));
  }

  if (typeof query.status === "string" && query.status.trim()) {
    conditions.push(
      eq(
        notificationDeliveries.status,
        query.status.trim() as (typeof notificationDeliveries.$inferSelect)["status"]
      )
    );
  }

  const fromCond = parseDateCondition(
    notificationDeliveries.createdAt,
    query.from,
    "gte"
  );
  if (fromCond) {
    conditions.push(fromCond);
  }

  const toCond = parseDateCondition(
    notificationDeliveries.createdAt,
    query.to,
    "lte"
  );
  if (toCond) {
    conditions.push(toCond);
  }

  const recipientCond = parseRecipientCondition(query.recipient);
  if (recipientCond) {
    conditions.push(recipientCond);
  }

  return conditions;
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem lịch sử thông báo (BR-NTA-05)"
    );
  }

  const query = getQuery(event);
  const limit = Math.min(Number(query.limit) || 50, 100);
  const conditions = buildQueryConditions(query);

  const db = getOwnerDb();
  let queryBuilder = db
    .select({
      id: notificationDeliveries.id,
      uuid: notificationDeliveries.uuid,
      notificationId: notificationDeliveries.notificationId,
      channel: notificationDeliveries.channel,
      status: notificationDeliveries.status,
      providerMessageId: notificationDeliveries.providerMessageId,
      error: notificationDeliveries.error,
      suppressedReason: notificationDeliveries.suppressedReason,
      dispatchedAt: notificationDeliveries.dispatchedAt,
      createdAt: notificationDeliveries.createdAt,
      templateCode: notifications.templateCode,
      recipientType: notifications.recipientType,
      recipientId: notifications.recipientId,
      payload: notifications.payload,
      recipientEmail: users.email,
    })
    .from(notificationDeliveries)
    .innerJoin(
      notifications,
      eq(notificationDeliveries.notificationId, notifications.id)
    )
    .leftJoin(users, eq(notifications.recipientId, users.id))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(limit);

  if (conditions.length > 0) {
    queryBuilder = queryBuilder.where(
      and(...conditions)
    ) as typeof queryBuilder;
  }

  const rows = await queryBuilder;

  const sanitizedRows = rows.map((r) => ({
    ...r,
    recipientEmailMasked: r.recipientEmail
      ? redactEmail(r.recipientEmail)
      : null,
    payload: sanitizeNotificationPayload(
      r.payload as Record<string, unknown> | null,
      r.templateCode
    ),
  }));

  return {
    items: sanitizedRows,
    total: sanitizedRows.length,
  };
});
