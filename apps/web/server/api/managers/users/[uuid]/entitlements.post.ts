import { appError } from "@mindkid/auth";
import { getDb, notifications, users } from "@mindkid/db";
import { PACKAGE_CATALOG } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import {
  defineEventHandler,
  getHeader,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "../../../../utils/admin-auth-runtime.ts";
import { throwValidationError } from "../../../../utils/api-error.js";
import { mutateUserEntitlements } from "../../../../utils/entitlements-runtime.ts";

/**
 * D-JN: Schema receives ONLY package_code, duration_days, grant_reason, notify_user.
 * Rejects extra properties (like entitlement_key) with 422.
 */
const grantEntitlementSchema = z
  .object({
    package_code: z.string({ required_error: "Mã gói là bắt buộc." }),
    duration_days: z
      .number({ required_error: "Thời hạn là bắt buộc." })
      .int("Thời hạn phải là số nguyên ngày.")
      .min(1, "Thời hạn tối thiểu là 1 ngày.")
      .max(365, "Thời hạn tối đa là 365 ngày một lần cấp (BR-EGR-04)."),
    grant_reason: z
      .string({ required_error: "Lý do cấp là bắt buộc." })
      .min(20, "Lý do cấp bắt buộc tối thiểu 20 ký tự (BR-EGR-02)."),
    notify_user: z.boolean().optional().default(true),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw appError("NOT_FOUND", "User UUID is required");
  }

  const customEvent = event as unknown as {
    _body?: unknown;
    context?: { body?: unknown };
  };
  const rawBody =
    (await readBody(event).catch(() => undefined)) ??
    customEvent._body ??
    customEvent.context?.body;

  const parsed = grantEntitlementSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const { package_code, duration_days, grant_reason, notify_user } =
    parsed.data;

  // Check package in catalog (gồm cả add-on chưa bán is_public: false)
  const pkg = PACKAGE_CATALOG[package_code];
  if (!pkg) {
    throw appError("PACKAGE_NOT_FOUND", "Gói không tồn tại trong catalog.");
  }

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, uuid: users.uuid })
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!user) {
    throw appError("NOT_FOUND", "Không tìm thấy người dùng.");
  }

  // Mutate entitlements using shared helper (D-JM, BR-EGR-08: no payment_orders created)
  const granted = await mutateUserEntitlements({
    userId: user.id,
    packageCode: package_code,
    durationDays: duration_days,
    source: "manual_grant",
    reason: grant_reason,
    actor: {
      type: "manager",
      id: session.manager_id,
      ip: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") || null,
    },
  });

  // Notify user if requested (BR-EGR-03: do NOT leak internal grant_reason to user)
  if (notify_user) {
    await db.insert(notifications).values({
      recipientType: "user",
      recipientId: user.id,
      templateCode: "entitlement_granted",
      payload: {
        package_code,
        package_name: pkg.name,
        duration_days,
      },
    });
  }

  setResponseStatus(event, 201);
  return {
    entitlements: granted.map((g) => ({
      key: g.key,
      expires_at: g.expires_at ? g.expires_at.toISOString() : null,
    })),
  };
});
