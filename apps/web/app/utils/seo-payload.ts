import type { GameDetailResponse } from "~/composables/use-game-detail-seo";
import type {
  CatalogItem,
  CatalogResponse,
} from "~/composables/use-games-catalog-page";

export function trimCatalogItem(raw: CatalogItem): CatalogItem {
  return {
    code: raw.code,
    title: raw.title,
    competency: raw.competency,
    age_band: raw.age_band,
    difficulty: raw.difficulty,
    access_tier: raw.access_tier,
    thumbnail_emoji: raw.thumbnail_emoji,
    locked: raw.locked,
    cta: {
      action: raw.cta.action,
      text: raw.cta.text,
      href: raw.cta.href,
    },
  };
}

export function trimCatalogPayload(raw: CatalogResponse): CatalogResponse {
  return {
    items: raw.items.map(trimCatalogItem),
    total: raw.total,
    facets: raw.facets,
    next_cursor: raw.next_cursor,
  };
}

export function trimGameDetailPayload(
  raw: GameDetailResponse
): GameDetailResponse {
  return {
    code: raw.code,
    title: raw.title,
    description: raw.description,
    competency: raw.competency,
    strand_code: raw.strand_code,
    strand_name: raw.strand_name,
    age_min: raw.age_min,
    age_max: raw.age_max,
    age_band: raw.age_band,
    difficulty: raw.difficulty,
    theme_id: raw.theme_id,
    template_code: raw.template_code,
    template_name: raw.template_name,
    mechanic_type: raw.mechanic_type,
    access_tier: raw.access_tier,
    locked: raw.locked,
    scoring: raw.scoring,
    rounds: [],
    cta: raw.cta,
    preview_images: raw.preview_images,
    related_games: raw.related_games,
    thumbnail_emoji: raw.thumbnail_emoji,
  };
}
