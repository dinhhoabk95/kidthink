import { gameLevels, getOwnerDb } from "@mindkid/db";
import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { and, desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";
import { checkLevelIntroRequired } from "#server/utils/concept-intro-runtime";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new GameLevelNotFoundError();
  }

  const db = getOwnerDb();
  const [level] = await db
    .select()
    .from(gameLevels)
    .where(and(eq(gameLevels.code, code), eq(gameLevels.status, "published")))
    .orderBy(desc(gameLevels.contentVersion))
    .limit(1);

  if (!level) {
    throw new GameLevelNotFoundError(code);
  }

  const guestDeviceId = getOrSetGuestDeviceId(event);
  const introStatus = await checkLevelIntroRequired(
    level,
    { kind: "guest" },
    { guestDeviceId }
  );

  return {
    code: level.code,
    ready: !introStatus.intro_required,
    intro_required: introStatus.intro_required,
    intro_queue: introStatus.intro_queue ?? [],
    intro_remaining: introStatus.intro_remaining ?? 0,
    return_level_code: introStatus.return_level_code ?? level.code,
    primary_skill_code: introStatus.primary_skill_code ?? "",
    intro_level_code:
      introStatus.intro_level_code ??
      introStatus.intro_queue?.[0]?.intro_level_code ??
      null,
  };
});
