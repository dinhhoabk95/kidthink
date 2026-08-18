import { AppError } from "@mindkid/auth";
import { childProfiles, entitlements, getOwnerDb } from "@mindkid/db";
import { validateCustomPlayCap } from "@mindkid/shared";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new AppError("NOT_FOUND");
  }

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const body =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};
  const requestedCap = body.daily_play_cap_minutes;

  if (requestedCap === undefined || typeof requestedCap !== "number") {
    throw new AppError("VALIDATION_FAILED", {
      message: "daily_play_cap_minutes là bắt buộc.",
    });
  }

  const db = getOwnerDb();
  const userId = Number(user.user_id);
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    throw new AppError("NOT_FOUND");
  }

  // Determine user tier
  let tier: "login" | "standard" | "premium" = "login";
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
    tier = "premium";
  } else if (keys.has("play_standard_games")) {
    tier = "standard";
  }

  // Validate cap <= package max cap (BR-HPL-08 -> 422 if exceeded)
  if (!validateCustomPlayCap(requestedCap, tier)) {
    throw new AppError("VALIDATION_FAILED", {
      message: `Hạn mức ${requestedCap} phút vượt quá trần của gói (${tier}).`,
    });
  }

  const [updatedChild] = await db
    .update(childProfiles)
    .set({
      dailyPlayCapMinutes: requestedCap,
      updatedAt: new Date(),
    })
    .where(eq(childProfiles.id, child.id))
    .returning();

  return {
    uuid: updatedChild.uuid,
    daily_play_cap_minutes: updatedChild.dailyPlayCapMinutes,
  };
});
