import { getOwnerDb } from "@mindkid/db";
import {
  type AccessTier,
  GUEST_CTA_VIEWER,
  getEffectiveTier,
  resolveLevelCta,
} from "@mindkid/shared";
import { defineEventHandler, getQuery, setHeader } from "h3";
import { searchGameLevels } from "#server/services/index.js";

/**
 * Danh mục công khai — `docs/specs/02-public/game-catalog-public.md`.
 *
 * `BR-GCP-02` §9: **không item nào** trong response catalog được mang
 * `content_pack` hay `difficulty_params`. `searchGameLevels` trả hai trường đó
 * cho item không khoá vì `/api/users/levels` cần chúng; bề mặt guest thì không,
 * và mỗi byte nội dung lọt ra đây là một game chơi được mà không cần tài khoản.
 *
 * `BR-GCP-09`: route này Cấm — NEVER đọc session. `locked` và `cta` dựng theo
 * **góc nhìn guest** để response giống nhau với mọi người gọi — điều kiện để
 * prerender và cache được (`BR-GCP-04`). Client đọc ngữ cảnh quyền một lần qua
 * `/api/users/access-context` rồi tự dựng lại CTA sau khi hydrate.
 */
export default defineEventHandler(async (event) => {
  const db = getOwnerDb();
  const query = getQuery(event);
  const result = await searchGameLevels(db, query, { role: "guest" });

  if (result.no_store) {
    setHeader(
      event,
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate"
    );
  }

  const items = result.items.map((item) => {
    const effectiveTier = getEffectiveTier(
      item.access_tier as AccessTier,
      null,
      {
        code: item.code,
        callerKind: "guest",
      }
    );
    return {
      id: item.id,
      entity_id: item.entity_id,
      code: item.code,
      title: item.title,
      description: item.description,
      instruction: item.instruction,
      thumbnail_emoji: item.thumbnail_emoji,
      theme_id: item.theme_id,
      competency: item.competency,
      age_band: item.age_band,
      age_min: item.age_min,
      age_max: item.age_max,
      difficulty: item.difficulty,
      access_tier: item.access_tier,
      status: item.status,
      locked: effectiveTier !== "free",
      cta: resolveLevelCta(item.code, effectiveTier, GUEST_CTA_VIEWER),
    };
  });

  return {
    items,
    total: result.total,
    facets: result.facets,
    next_cursor: result.next_cursor,
  };
});
