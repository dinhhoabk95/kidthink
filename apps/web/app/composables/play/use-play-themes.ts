import { CONTENT_THEMES } from "@mindkid/shared/client";
import { computed, type Ref } from "vue";

export interface ThemeInfo {
  readonly code: string;
  readonly label_vi: string;
  readonly icon: string;
}

export function usePlayThemes(currentThemeId: Ref<string>) {
  const currentThemeInfo = computed<ThemeInfo>(() => {
    const matched = CONTENT_THEMES.find((t) => t.code === currentThemeId.value);
    if (matched) {
      return {
        code: matched.code,
        label_vi: matched.label_vi,
        icon: matched.icon_emoji_ref,
      };
    }
    return {
      code: "default",
      label_vi: "Toán tư duy",
      icon: "🧩",
    };
  });

  return {
    currentThemeInfo,
  };
}
