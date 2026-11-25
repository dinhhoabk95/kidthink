import { CONTENT_THEMES } from "@mindkid/shared";

/**
 * Emoji hiển thị cho thẻ level trên bề mặt trẻ (chưa biết đọc nên hình là
 * manh mối duy nhất — `BR-PEN-03`). `game_levels.thumbnail_emoji` thường để
 * trống, nên suy ra từ chủ đề (`theme_id`): chọn một danh từ của chủ đề theo
 * băm ổn định của `code` để các thẻ cùng chủ đề vẫn khác nhau.
 */
export const DEFAULT_LEVEL_EMOJI = "🎮";

export interface LevelEmojiSource {
  readonly code: string;
  readonly themeId?: string | null;
  readonly thumbnailEmoji?: string | null;
}

const HASH_MODULUS = 2_147_483_647;

function stableHash(text: string): number {
  let hash = 0;
  for (const ch of text) {
    hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) % HASH_MODULUS;
  }
  return hash;
}

export function resolveLevelThumbnailEmoji(level: LevelEmojiSource): string {
  if (level.thumbnailEmoji) {
    return level.thumbnailEmoji;
  }
  const theme = CONTENT_THEMES.find((entry) => entry.code === level.themeId);
  if (!theme) {
    return DEFAULT_LEVEL_EMOJI;
  }
  const noun = theme.nouns[stableHash(level.code) % theme.nouns.length];
  return noun?.emoji_ref ?? theme.icon_emoji_ref;
}
