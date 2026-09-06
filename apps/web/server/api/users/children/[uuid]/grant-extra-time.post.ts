import { isValidParentGateToken } from "@mindkid/auth";
import { childDailyStats, childProfiles, getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { getDateIct } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const GrantExtraTimeSchema = z
  .object({
    gate_token: z.string().min(1).max(2048).optional(),
    minutes: z.number().int().min(1).max(30),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError();
  }

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const body =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};
  const parsed = GrantExtraTimeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError();
  }
  const { minutes, gate_token: gateToken } = parsed.data;
  const userId = Number(user.user_id);

  // BR-HPL-06: Missing or invalid gate_token returns 403
  if (
    !(
      gateToken &&
      isValidParentGateToken(gateToken, userId, getParentGateSecret(event))
    )
  ) {
    throw new InsufficientRoleError({
      message: "Cần xác minh cổng người lớn.",
    });
  }

  const db = getOwnerDb();
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    throw new NotFoundError();
  }

  const dateIct = getDateIct();
  const [stats] = await db
    .select()
    .from(childDailyStats)
    .where(
      and(
        eq(childDailyStats.childProfileId, child.id),
        eq(childDailyStats.dateIct, dateIct)
      )
    );

  const alreadyGranted = stats?.extraTimeGrantedMinutes || 0;
  if (alreadyGranted + minutes > 30) {
    throw new ValidationError({
      message: `Đã cấp ${alreadyGranted} phút hôm nay; tối đa 30 phút/ngày.`,
    });
  }

  const currentSeconds = stats?.totalPlayTimeSeconds || 0;
  const newSeconds = Math.max(0, currentSeconds - minutes * 60);

  if (stats) {
    await db
      .update(childDailyStats)
      .set({
        totalPlayTimeSeconds: newSeconds,
        extraTimeGrantedMinutes: alreadyGranted + minutes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(childDailyStats.childProfileId, child.id),
          eq(childDailyStats.dateIct, dateIct)
        )
      );
  } else {
    await db.insert(childDailyStats).values({
      childProfileId: child.id,
      dateIct,
      totalPlayTimeSeconds: newSeconds,
      extraTimeGrantedMinutes: minutes,
    });
  }

  return {
    success: true,
    granted_minutes: minutes,
    daily_granted_total: alreadyGranted + minutes,
  };
});
