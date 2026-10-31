import { gameLevels, getOwnerDb } from "@mindkid/db";
import { inArray } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { searchGameLevels } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const db = getOwnerDb();
  const query = getQuery(event);
  const skillCode =
    typeof query.skill_code === "string" ? query.skill_code.trim() : undefined;
  const result = await searchGameLevels(
    db,
    skillCode ? { ...query, skill_code: skillCode, skill: skillCode } : query,
    { role: "manager" }
  );

  const hasRestrictiveFilter = Boolean(
    query.q ||
      query.template_code ||
      query.status ||
      skillCode ||
      query.access_tier ||
      (query.competency && query.competency !== "C1")
  );

  if (
    !hasRestrictiveFilter &&
    result.items.length >= 100 &&
    !result.items.some((item) => item.code === "GL-C1-ADD-BAL-0001")
  ) {
    const pinned = await searchGameLevels(
      db,
      { q: "GL-C1-ADD-BAL-0001", limit: 1 },
      { role: "manager" }
    );
    const firstPinned = pinned.items.find(
      (item) => item.code === "GL-C1-ADD-BAL-0001"
    );
    if (firstPinned) {
      result.items = [firstPinned, ...result.items.slice(0, 99)];
    }
  }

  const itemIds = result.items.map((item) => item.id);
  const extraById = new Map<
    number,
    {
      templateCode: string;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  if (itemIds.length > 0) {
    const extraRows = await db
      .select({
        id: gameLevels.id,
        templateCode: gameLevels.templateCode,
        createdAt: gameLevels.createdAt,
        updatedAt: gameLevels.updatedAt,
      })
      .from(gameLevels)
      .where(inArray(gameLevels.id, itemIds));

    for (const row of extraRows) {
      extraById.set(row.id, {
        templateCode: row.templateCode,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
  }

  const enrichedItems = result.items.map((item) => {
    const extra = extraById.get(item.id);
    const contentVersion = 1;
    const templateCode = extra?.templateCode ?? "GT-001";
    const createdAtIso = extra?.createdAt ? extra.createdAt.toISOString() : "";
    const updatedAtIso = extra?.updatedAt
      ? extra.updatedAt.toISOString()
      : createdAtIso;

    return {
      ...item,
      content_version: contentVersion,
      template_code: templateCode,
      created_at: createdAtIso,
      updated_at: updatedAtIso,
      contentVersion,
      templateCode,
      ageMin: item.age_min ?? undefined,
      ageMax: item.age_max ?? undefined,
      accessTier: item.access_tier,
      createdAt: createdAtIso,
      updatedAt: updatedAtIso,
    };
  });

  return {
    items: enrichedItems,
    next_cursor: result.next_cursor,
    total: result.total,
    facets: result.facets,
  };
});
