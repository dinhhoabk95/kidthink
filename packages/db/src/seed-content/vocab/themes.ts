import type { ThemeVocabulary } from "@mindkid/game-engine";
import { CONTENT_THEMES } from "@mindkid/shared";

/**
 * Chủ đề lạ là lỗi gọi sai, không phải điều kiện runtime — nên nó ném.
 *
 * Bản cũ trả về một kho hoa quả bịa sẵn với `emoji_ref` là **glyph thô**, thứ
 * registry Cấm — NEVER tra được. Kết quả: `gen:levels --theme=<gõ nhầm>` sinh
 * ra cả lô level mang `theme_tag` không thuộc từ vựng và emoji không resolve
 * được, mà không có tín hiệu nào lúc sinh.
 */
export function getThemeVocabulary(themeCode: string): ThemeVocabulary {
  const theme = CONTENT_THEMES.find((t) => t.code === themeCode);
  if (!theme) {
    throw new Error(
      `Chủ đề '${themeCode}' không có trong CONTENT_THEMES. Chủ đề hợp lệ: ${CONTENT_THEMES.map((t) => t.code).join(", ")}.`
    );
  }

  return {
    theme: theme.code,
    nouns: theme.nouns.map((n) => ({
      emoji_ref: n.emoji_ref,
      label_vi: n.text_vi,
    })),
  };
}

export function getAllThemeVocabularies(): Record<string, ThemeVocabulary> {
  const map: Record<string, ThemeVocabulary> = {};
  for (const theme of CONTENT_THEMES) {
    map[theme.code] = getThemeVocabulary(theme.code);
  }
  return map;
}
