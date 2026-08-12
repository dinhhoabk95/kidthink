/**
 * @kidthink/emoji
 * Hệ sinh thái emoji curated cho giáo dục mầm non Việt Nam.
 *
 * 800+ emoji phân loại theo 32 categories, mapping 12 chủ đề giáo trình,
 * hỗ trợ tìm kiếm tiếng Việt + tiếng Anh.
 */

// Constants
export {
  ALL_CATEGORIES,
  CURRICULUM_THEME_CATEGORIES,
  EMOJI_GROUPS,
} from "./constants";
// Query
export {
  getAllCategories,
  getByCode,
  getEmojiCode,
  getEmojisByCategory,
  getEmojisByCurriculumTheme,
  getEmojisByGroup,
  getRandomEmojis,
  getTotalEmojiCount,
  isValidRef,
} from "./query";

// Registry
export {
  ALL_EMOJIS,
  CURRICULUM_EMOJI_MAP,
  EMOJI_CATEGORIES,
  GROUP_EMOJI_MAP,
} from "./registry";

// Search
export { searchEmoji } from "./search";
// Types
export type {
  CurriculumTheme,
  EmojiCategory,
  EmojiEntry,
  EmojiGroup,
} from "./types";
