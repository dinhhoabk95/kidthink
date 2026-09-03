import type { EmojiEntry } from "#src/types";

export const DUPLICATE_GLYPH_FIXTURE: EmojiEntry[] = [
  {
    emoji: "🍎",
    name: "Táo 1",
    categories: ["fruit"],
    curriculum_themes: ["thuc_vat"],
    keywords: ["apple", "táo"],
    age_min: 3,
  },
  {
    emoji: "🍎",
    name: "Táo 2",
    categories: ["fruit"],
    curriculum_themes: ["thuc_vat"],
    keywords: ["apple", "táo"],
    age_min: 3,
  },
];

export const NFD_GLYPH_FIXTURE: EmojiEntry[] = [
  {
    // 'e' + combining acute accent -> NFD
    emoji: "e\u0301",
    name: "E sắc NFD",
    categories: ["shape-color"],
    curriculum_themes: ["ban_than"],
    keywords: ["letter", "chữ"],
    age_min: 3,
  },
];

export const SKIN_TONE_FIXTURE: EmojiEntry[] = [
  {
    // Thumbs up medium skin tone (BR-EMJ-09 violation)
    emoji: "👍🏽",
    name: "Thích màu da",
    categories: ["hand-gesture"],
    curriculum_themes: ["ban_than"],
    keywords: ["thumbs up", "thích"],
    age_min: 3,
  },
];

export const GENDERED_PROFESSION_FIXTURE: EmojiEntry[] = [
  {
    // Female doctor (BR-EMJ-10 violation)
    emoji: "👩‍⚕️",
    name: "Bác sĩ nữ",
    categories: ["profession"],
    curriculum_themes: ["nghe_nghiep"],
    keywords: ["doctor", "bác sĩ"],
    age_min: 3,
  },
];
