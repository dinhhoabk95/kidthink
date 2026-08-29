import type { ThemeVocabulary } from "@mindkid/game-engine";
import { CONTENT_THEMES } from "@mindkid/shared";

export function getThemeVocabulary(themeCode: string): ThemeVocabulary {
  const theme = CONTENT_THEMES.find((t) => t.code === themeCode);
  if (!theme) {
    // Fallback default
    return {
      theme: themeCode,
      nouns: [
        { emoji_ref: "🍎", label_vi: "Táo" },
        { emoji_ref: "🍌", label_vi: "Chuối" },
        { emoji_ref: "🥕", label_vi: "Cà rốt" },
        { emoji_ref: "🐱", label_vi: "Mèo" },
        { emoji_ref: "🐶", label_vi: "Chó" },
        { emoji_ref: "⭐", label_vi: "Ngôi sao" },
      ],
    };
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
