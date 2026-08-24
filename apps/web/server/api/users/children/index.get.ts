import { childProfiles, getOwnerDb } from "@mindkid/db";
import { deriveAgeBand } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { defineEventHandler } from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
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
});
