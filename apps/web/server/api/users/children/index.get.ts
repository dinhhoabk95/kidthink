import { AppError } from "@kidthink/auth";
import { childProfiles, getOwnerDb } from "@kidthink/db";
import { deriveAgeBand } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, setResponseStatus } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const db = getOwnerDb();

    const childrenList = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.userId, userId));

    const currentYear = new Date().getFullYear();

    return {
      children: childrenList.map((child) => ({
        uuid: child.uuid,
        display_name: child.displayName,
        birth_year: child.birthYear,
        age_band: deriveAgeBand(child.birthYear, currentYear),
        avatar_id: child.avatarId,
        relationship: child.relationship,
        status: child.status,
        daily_play_cap_minutes: child.dailyPlayCapMinutes,
      })),
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
