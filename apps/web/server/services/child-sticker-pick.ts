/**
 * Logic thuần của album sticker (`docs/specs/04-play/sticker-album.md`).
 * Không chạm DB — service `child-stickers.ts` nạp dữ liệu rồi gọi vào đây.
 *
 * Danh mục sticker không phải danh sách riêng: nó là `nouns` của registry chủ
 * đề (`BR-STK-05`, `BR-CTR-12` — một nguồn sự thật cho vốn từ chủ đề).
 */

import { CONTENT_THEMES, getTheme } from "@mindkid/shared";

export interface StickerDef {
  readonly theme_code: string;
  readonly emoji: string;
  /** Tên tiếng Việt — chỉ dùng cho `aria-label` (`BR-STK-06`). */
  readonly label: string;
}

export interface OwnedStickerRow extends StickerDef {
  readonly awarded_at: Date;
}

export interface AlbumSticker {
  readonly emoji: string;
  readonly label: string;
}

export interface AlbumTheme {
  readonly theme_code: string;
  readonly icon_emoji: string;
  readonly stickers: readonly AlbumSticker[];
}

/** Sticker dự phòng khi chủ đề không có vốn từ — không bao giờ trao "không gì". */
const FALLBACK_STICKER_EMOJI = "⭐";
const FALLBACK_STICKER_LABEL = "Ngôi sao";

/** Chủ đề dự phòng chỉ lấy ở sàn tuổi thấp nhất (`BR-CTR-09`). */
const FALLBACK_THEME_AGE_FLOOR = 3;

export function stickerCatalog(themeCode: string): readonly StickerDef[] {
  const theme = getTheme(themeCode);
  if (!theme) {
    return [];
  }
  return theme.nouns.map((noun) => ({
    theme_code: theme.code,
    emoji: noun.emoji_ref,
    label: noun.text_vi,
  }));
}

/** Băm tất định, ổn định giữa các lần chạy — chỉ để chọn chủ đề dự phòng. */
function stableHash(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 2_147_483_647;
  }
  return hash;
}

function fallbackTheme(lessonCode: string): string {
  const candidates = CONTENT_THEMES.filter(
    (theme) => theme.age_floor === FALLBACK_THEME_AGE_FLOOR
  );
  const pool = candidates.length > 0 ? candidates : CONTENT_THEMES;
  const picked = pool[stableHash(lessonCode) % pool.length];
  return picked?.code ?? "";
}

/**
 * Chủ đề của sticker (`BR-STK-04`): chủ đề hợp lệ gặp nhiều nhất trong các
 * level của bài; hoà thì chủ đề gặp trước; không có thì chọn tất định.
 */
export function pickLessonTheme(
  levelThemes: readonly (string | null)[],
  lessonCode: string
): string {
  const counts = new Map<string, number>();
  for (const theme of levelThemes) {
    if (theme !== null && getTheme(theme)) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  // `Map` giữ thứ tự chèn, nên `>` chặt giữ chủ đề gặp trước khi hoà.
  for (const [theme, count] of counts) {
    if (count > bestCount) {
      best = theme;
      bestCount = count;
    }
  }
  return best ?? fallbackTheme(lessonCode);
}

/**
 * Sticker trao trong một chủ đề (`BR-STK-05`): cái đầu tiên trẻ chưa có; có
 * đủ rồi thì theo vòng, dựa trên số sticker đã nhận trong chủ đề.
 */
export function pickSticker(
  themeCode: string,
  ownedEmojis: readonly string[]
): StickerDef {
  const catalog = stickerCatalog(themeCode);
  const owned = new Set(ownedEmojis);
  const fresh = catalog.find((sticker) => !owned.has(sticker.emoji));
  if (fresh) {
    return fresh;
  }
  const cycled = catalog[ownedEmojis.length % Math.max(catalog.length, 1)];
  return (
    cycled ?? {
      theme_code: themeCode,
      emoji: FALLBACK_STICKER_EMOJI,
      label: FALLBACK_STICKER_LABEL,
    }
  );
}

/**
 * Album gom theo chủ đề, mỗi sticker một lần, theo lần nhận đầu tiên
 * (`sticker-album.md` §7.2). Không số đếm, không ô trống (`BR-STK-03`).
 */
export function groupStickerAlbum(
  rows: readonly OwnedStickerRow[]
): AlbumTheme[] {
  const ordered = [...rows].sort(
    (a, b) => a.awarded_at.getTime() - b.awarded_at.getTime()
  );
  const byTheme = new Map<string, AlbumSticker[]>();
  for (const row of ordered) {
    const stickers = byTheme.get(row.theme_code) ?? [];
    if (!stickers.some((sticker) => sticker.emoji === row.emoji)) {
      byTheme.set(row.theme_code, [
        ...stickers,
        { emoji: row.emoji, label: row.label },
      ]);
    }
  }
  return [...byTheme].map(([themeCode, stickers]) => ({
    theme_code: themeCode,
    icon_emoji:
      getTheme(themeCode)?.icon_emoji_ref ??
      stickers[0]?.emoji ??
      FALLBACK_STICKER_EMOJI,
    stickers,
  }));
}
