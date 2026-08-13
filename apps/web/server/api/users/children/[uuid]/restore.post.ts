import { AppError } from "@kidthink/auth";
import { childProfiles, entitlements, getOwnerDb } from "@kidthink/db";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    // Ownership check (BR-CPC-09)
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId))
      );

    if (!child) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    // BR-CPR-02: Quota check on restore
    let maxAllowedChildren = 1;
    const activeEntitlements = await db
      .select({ key: entitlements.entitlementKey })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.status, "active"),
          or(
            isNull(entitlements.expiresAt),
            gt(entitlements.expiresAt, new Date())
          )
        )
      );
    const keys = new Set(activeEntitlements.map((row) => row.key));
    if (keys.has("play_premium_games")) {
      maxAllowedChildren = 5;
    } else if (keys.has("play_standard_games")) {
      maxAllowedChildren = 3;
    }

    const [{ value: activeChildCount }] = await db
      .select({ value: count() })
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      );

    if (activeChildCount >= maxAllowedChildren) {
      setResponseStatus(event, 402);
      throw createError({
        statusCode: 402,
        statusMessage: "CHILD_LIMIT_EXCEEDED",
        data: {
          code: "CHILD_LIMIT_EXCEEDED",
          message: `Không thể khôi phục. Gói dịch vụ đã đạt hạn mức tối đa ${maxAllowedChildren} hồ sơ trẻ đang hoạt động.`,
        },
      });
    }

    const [updated] = await db
      .update(childProfiles)
      .set({
        status: "active",
        purgeAt: null,
        updatedAt: new Date(),
      })
      .where(eq(childProfiles.id, child.id))
      .returning();

    return {
      uuid: updated.uuid,
      status: updated.status,
    };
  } catch (err) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
