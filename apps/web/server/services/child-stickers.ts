/**
 * Album sticker của trẻ — `docs/specs/04-play/sticker-album.md`.
 *
 * Trao sticker khi đóng phiên chơi (`BR-STK-01`), đọc album của trẻ đang hoạt
 * động (`BR-STK-07`). Bảng `child_stickers` chỉ INSERT (`BR-STK-02`).
 */

import type { DbExecutor } from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { useOwnerRepositories } from "#server/utils/repositories";
import {
  type AlbumTheme,
  groupStickerAlbum,
  pickLevelTheme,
  pickSticker,
  type StickerDef,
} from "./child-sticker-pick.ts";

export interface AwardPlayStickerInput {
  readonly childId: number;
  readonly playSessionId: number;
  readonly levelCode: string;
  readonly themeId?: string | null;
  readonly levelThemes?: readonly (string | null)[];
}

export type AwardLessonStickerInput = AwardPlayStickerInput;

export interface LoadStickerAlbumInput {
  readonly childId: number;
  readonly themeCode?: string;
}

export interface StickerAlbumView {
  readonly themes: readonly AlbumTheme[];
}

function isRepositories(
  target: DbExecutor | MindKidRepositories
): target is MindKidRepositories {
  return "childStickers" in target;
}

function toRepositories(
  target?: DbExecutor | MindKidRepositories
): MindKidRepositories {
  if (!target) {
    return useOwnerRepositories();
  }
  return isRepositories(target) ? target : createRepositories(target);
}

/** `theme_id` của level đã xuất bản (`BR-STK-04`). */
async function loadLevelThemes(
  repos: MindKidRepositories,
  input: AwardPlayStickerInput
): Promise<readonly (string | null)[]> {
  if (input.levelThemes !== undefined) {
    return input.levelThemes;
  }
  if (input.themeId !== undefined) {
    return [input.themeId];
  }
  const level = await repos.gameLevels.findByCode(input.levelCode);
  return [level?.themeId ?? null];
}

/**
 * Trao sticker cho một phiên chơi vừa đóng. Gọi **trong** transaction đóng phiên,
 * chỉ khi phiên thật sự vừa chuyển sang `completed` (`BR-STK-01`). Unique
 * `(child, play_session)` là lớp chặn thứ hai: trùng thì trả sticker đã có.
 */
export async function awardPlaySticker(
  txOrRepos: DbExecutor | MindKidRepositories,
  input: AwardPlayStickerInput
): Promise<StickerDef> {
  const repos = toRepositories(txOrRepos);
  const themeCode = pickLevelTheme(
    await loadLevelThemes(repos, input),
    input.levelCode
  );
  const ownedEmojis = await repos.childStickers.listOwnedEmojis(
    input.childId,
    themeCode
  );
  const sticker = pickSticker(themeCode, ownedEmojis);

  const awarded = await repos.childStickers.awardIfAbsent({
    childProfileId: input.childId,
    playSessionId: input.playSessionId,
    themeCode: sticker.theme_code,
    emoji: sticker.emoji,
    label: sticker.label,
  });

  return {
    theme_code: awarded.themeCode,
    emoji: awarded.emoji,
    label: awarded.label,
  };
}

export const awardLessonSticker = awardPlaySticker;

/** Album của **một** trẻ (`BR-STK-07`), gom theo chủ đề (§7.2). */
export async function loadStickerAlbum(
  input: LoadStickerAlbumInput
): Promise<StickerAlbumView>;
export async function loadStickerAlbum(
  dbOrRepos: DbExecutor | MindKidRepositories,
  input: LoadStickerAlbumInput
): Promise<StickerAlbumView>;
export async function loadStickerAlbum(
  first: DbExecutor | MindKidRepositories | LoadStickerAlbumInput,
  maybeInput?: LoadStickerAlbumInput
): Promise<StickerAlbumView> {
  const repos =
    maybeInput === undefined
      ? useOwnerRepositories()
      : toRepositories(first as DbExecutor | MindKidRepositories);
  const input = maybeInput ?? (first as LoadStickerAlbumInput);

  const rows = await repos.childStickers.listByChild(
    input.childId,
    input.themeCode
  );
  return {
    themes: groupStickerAlbum(
      rows.map((row) => ({
        theme_code: row.themeCode,
        emoji: row.emoji,
        label: row.label,
        awarded_at: row.awardedAt,
      }))
    ),
  };
}
