import { AppError } from "@mindkid/auth";
import { childDailyStats, childProfiles, getOwnerDb } from "@mindkid/db";
import { getDateIct, parseDateIct } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";

import { requireWebUserSession } from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new AppError("NOT_FOUND");
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

  const usedSeconds = stats?.totalPlayTimeSeconds || 0;
  const usedMinutes = Math.floor(usedSeconds / 60);
  const capMinutes = child.dailyPlayCapMinutes;
  const remainingMinutes = Math.max(0, capMinutes - usedMinutes);

  // Resets at next ICT midnight
  const tomorrowIct = getDateIct(Date.now() + 86_400_000);
  const resetsAt = parseDateIct(tomorrowIct).toISOString();

  return {
    cap_minutes: capMinutes,
    used_minutes: usedMinutes,
    remaining_minutes: remainingMinutes,
    resets_at: resetsAt,
  };
});
