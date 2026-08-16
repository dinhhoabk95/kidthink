import { AppError, isValidParentGateToken } from "@kidthink/auth";
import { childProfiles, getOwnerDb, playSessions } from "@kidthink/db";
import { deriveAgeBand } from "@kidthink/shared";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getCookie,
  getRouterParam,
  readBody,
  setCookie,
  setResponseStatus,
} from "h3";
import {
  assertRequestBodySize,
  getParentGateSecret,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 16 * 1024);
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    // Verify ownership & active status at DB level (BR-CPS-02 & BR-CPS-05)
    const [targetChild] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, uuid),
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      );

    if (!targetChild) {
      setResponseStatus(event, 404);
      throw createError({
        statusCode: 404,
        statusMessage: "NOT_FOUND",
        data: {
          code: "NOT_FOUND",
          message: "Không tìm thấy hồ sơ trẻ hoặc hồ sơ đã bị lưu trữ.",
        },
      });
    }

    const currentActiveUuid = getCookie(event, "active_child_id");
    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const body =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

    // BR-CPS-01 & BR-PEN-01: Switching between children requires Parent Gate
    if (currentActiveUuid && currentActiveUuid !== uuid) {
      const gateToken = String(body.gate_token || "");
      if (
        !(
          gateToken &&
          isValidParentGateToken(gateToken, userId, getParentGateSecret(event))
        )
      ) {
        setResponseStatus(event, 403);
        throw createError({
          statusCode: 403,
          statusMessage: "PARENT_GATE_REQUIRED",
          data: {
            code: "PARENT_GATE_REQUIRED",
            message: "Cần xác nhận cổng người lớn khi đổi hồ sơ trẻ.",
          },
        });
      }

      // BR-CPS-04: Mark previous child's active play sessions as abandoned
      const [previousChild] = await db
        .select()
        .from(childProfiles)
        .where(
          and(
            eq(childProfiles.uuid, currentActiveUuid),
            eq(childProfiles.userId, userId)
          )
        );

      if (previousChild) {
        await db
          .update(playSessions)
          .set({
            completionStatus: "abandoned",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(playSessions.childProfileId, previousChild.id),
              eq(playSessions.completionStatus, "in_progress")
            )
          );
      }
    }

    // BR-CPS-03: Set active_child_id cookie (context only, SameSite=Lax, 30 days)
    setCookie(event, "active_child_id", targetChild.uuid, {
      httpOnly: false,
      maxAge: 30 * 86_400,
      path: "/",
      sameSite: "lax",
      secure: !import.meta.dev,
    });

    const currentYear = new Date().getFullYear();

    return {
      child: {
        uuid: targetChild.uuid,
        display_name: targetChild.displayName,
        avatar_id: targetChild.avatarId,
        age_band: deriveAgeBand(targetChild.birthYear, currentYear),
      },
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
