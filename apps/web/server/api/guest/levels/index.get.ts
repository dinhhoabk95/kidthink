import { getOwnerDb } from "@mindkid/db";
import {
  type AccessTier,
  GUEST_CTA_VIEWER,
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
    setHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate");
  }

  const items = result.items.map((item) => {
    const {
      content_pack: _contentPack,
      difficulty_params: _difficultyParams,
      ...card
    } = item as typeof item & {
      content_pack?: unknown;
      difficulty_params?: unknown;
    };

    return {
      ...card,
      cta: resolveLevelCta(
        card.code,
        card.access_tier as AccessTier,
        GUEST_CTA_VIEWER
      ),
    };
  });

  return {
    items,
    total: result.total,
    facets: result.facets,
    next_cursor: result.next_cursor,
  };
});
