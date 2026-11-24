/**
 * @mindkid/emoji
 * Hệ sinh thái emoji & SVG minh hoạ thực tế cho giáo dục mầm non Việt Nam.
 *
 * 950+ emoji phân loại theo 36 nhóm chủ đề học, mapping 12 chủ đề giáo trình,
 * 100% có bộ SVG 2.5D thực tế, hỗ trợ tìm kiếm tiếng Việt + tiếng Anh.
 */

export {
  ALL_CATEGORIES,
  CURRICULUM_THEME_CATEGORIES,
  EMOJI_GROUPS,
} from "#src/constants";
export {
  getAllCategories,
  getByGlyph,
  getEmojisByCategory,
  getEmojisByCurriculumTheme,
  getEmojisByGroup,
  getRandomEmojis,
  getTotalEmojiCount,
  isInCatalog,
} from "#src/query";
export {
  ALL_EMOJIS,
  CURRICULUM_EMOJI_MAP,
  EMOJI_CATEGORIES,
  GROUP_EMOJI_MAP,
  RAW_EMOJI_DATA_SOURCES,
} from "#src/registry";
export { searchEmoji } from "#src/search";
export {
  CUSTOM_EMOJI_SPRITES,
  hasCustomEmojiSprite,
  listCustomEmojiSprites,
  resolveCustomEmojiSprite,
} from "#src/sprites";
export type {
  CurriculumTheme,
  CustomSpriteTier,
  EmojiCategory,
  EmojiEntry,
  EmojiGroup,
  EmojiSpriteMeta,
} from "#src/types";
