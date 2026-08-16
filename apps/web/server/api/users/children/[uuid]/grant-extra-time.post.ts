import { AppError, isValidParentGateToken } from "@kidthink/auth";
import { childDailyStats, childProfiles, getOwnerDb } from "@kidthink/db";
import { getDateIct } from "@kidthink/shared";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  getParentGateSecret,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

const GrantExtraTimeSchema = z
  .object({
    gate_token: z.string().min(1).max(2048).optional(),
    minutes: z.number().int().min(1).max(30),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 16 * 1024);
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw new AppError("NOT_FOUND");
    }

    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const body =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};
    const parsed = GrantExtraTimeSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_FAILED");
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
      throw new AppError("INSUFFICIENT_ROLE", {
        message: "Cần xác minh cổng người lớn.",
      });
    }

    const db = getOwnerDb();
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId))
      );

    if (!child) {
      throw new AppError("NOT_FOUND");
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
      throw new AppError("VALIDATION_FAILED", {
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
