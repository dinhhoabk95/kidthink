import { EMOJI_GROUPS, getByGlyph } from "@mindkid/emoji";
import type {
  ContrastVocabulary,
  ThemeVocabulary,
  VocabularyEntry,
} from "./types.js";

/** Vốn từ đủ để làm phía tương phản: có nhãn và biểu tượng chủ đề. */
export interface LabelledVocabulary extends ThemeVocabulary {
  label_vi: string;
  icon_emoji_ref: string;
}

function groupOf(noun: VocabularyEntry): string | null {
  const category = getByGlyph(noun.emoji_ref)?.categories[0];
  if (!category) {
    return null;
  }
  for (const [group, categories] of Object.entries(EMOJI_GROUPS)) {
    if (categories.includes(category)) {
      return group;
    }
  }
  return null;
}

function groupsOf(nouns: readonly VocabularyEntry[]): Set<string> {
  const out = new Set<string>();
  for (const noun of nouns) {
    const group = groupOf(noun);
    if (group) {
      out.add(group);
    }
  }
  return out;
}

/**
 * Chủ đề tương phản: ứng viên đầu tiên (theo thứ tự truyền vào) mà không danh
 * từ nào chung nhóm emoji với chủ đề chính. Thứ tự cố định nên kết quả tất định
 * (`BR-LGK-02`). Không có ứng viên nào thì trả `undefined` — engine phân loại sẽ ném.
 */
export function pickContrast(
  theme: ThemeVocabulary,
  candidates: readonly LabelledVocabulary[]
): ContrastVocabulary | undefined {
  const own = groupsOf(theme.nouns);
  const hit = candidates.find(
    (c) =>
      c.theme !== theme.theme &&
      [...groupsOf(c.nouns)].every((group) => !own.has(group))
  );
  if (!hit) {
    return;
  }
  return {
    theme: hit.theme,
    label_vi: hit.label_vi,
    icon_emoji_ref: hit.icon_emoji_ref,
    nouns: hit.nouns,
  };
}
