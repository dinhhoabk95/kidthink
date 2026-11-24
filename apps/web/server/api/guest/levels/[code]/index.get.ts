import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { defineEventHandler, getRouterParam, setHeader } from "h3";
import { getPublicLevelDetail } from "#server/services/catalog-service";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new GameLevelNotFoundError();
  }

  const resolved = await getPublicLevelDetail(code, event);

  if (resolved.isPublicCacheable) {
    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
  } else {
    setHeader(event, "Cache-Control", "private, no-store");
  }

  return resolved.payload;
});
