import {
  type LabelledVocabulary,
  pickContrast,
  type ThemeVocabulary,
} from "@mindkid/game-engine/generators";
import { CONTENT_THEMES } from "@mindkid/shared";

/**
 * Chủ đề lạ là lỗi gọi sai, không phải điều kiện runtime — nên nó ném.
 *
 * Bản cũ trả về một kho hoa quả bịa sẵn với `emoji_ref` là **glyph thô**, thứ
 * registry Cấm — NEVER tra được. Kết quả: `gen:levels --theme=<gõ nhầm>` sinh
 * ra cả lô level mang `theme_tag` không thuộc từ vựng và emoji không resolve
 * được, mà không có tín hiệu nào lúc sinh.
 */
function toVocabulary(
  theme: (typeof CONTENT_THEMES)[number]
): LabelledVocabulary {
  return {
    theme: theme.code,
    label_vi: theme.label_vi,
    icon_emoji_ref: theme.icon_emoji_ref,
    nouns: theme.nouns.map((n) => ({
      emoji_ref: n.emoji_ref,
      label_vi: n.text_vi,
    })),
  };
}

export function getThemeVocabulary(themeCode: string): ThemeVocabulary {
  const theme = CONTENT_THEMES.find((t) => t.code === themeCode);
  if (!theme) {
    throw new Error(
      `Chủ đề '${themeCode}' không có trong CONTENT_THEMES. Chủ đề hợp lệ: ${CONTENT_THEMES.map((t) => t.code).join(", ")}.`
    );
  }

  const vocabulary = toVocabulary(theme);
  // Vật nhiễu cho engine phân loại đến từ chủ đề khác nhóm emoji
  // (`level-generator-kit.md` §7.2).
  return {
    ...vocabulary,
    contrast: pickContrast(vocabulary, CONTENT_THEMES.map(toVocabulary)),
  };
}

export function getAllThemeVocabularies(): Record<string, ThemeVocabulary> {
  const map: Record<string, ThemeVocabulary> = {};
  for (const theme of CONTENT_THEMES) {
    map[theme.code] = getThemeVocabulary(theme.code);
  }
  return map;
}
