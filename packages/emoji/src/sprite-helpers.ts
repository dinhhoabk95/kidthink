/**
 * @mindkid/emoji — Sprite factory helpers
 */

import type { EmojiSpriteMeta } from "#src/types";

export function sprite(
  emoji: string,
  slug: string,
  nameVi: string
): EmojiSpriteMeta {
  return {
    emoji,
    slug,
    nameVi,
    svgPath: `/sprites/emoji/${slug}.svg`,
    tier: "vector_craft",
  };
}

export function hero(
  emoji: string,
  slug: string,
  nameVi: string
): EmojiSpriteMeta {
  return {
    emoji,
    slug,
    nameVi,
    svgPath: `/sprites/emoji/${slug}.svg`,
    heroWebpPath: `/sprites/hero/${slug}.webp`,
    tier: "hero_webp",
  };
}
