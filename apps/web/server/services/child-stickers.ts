/**
 * Album sticker của trẻ — `docs/specs/04-play/sticker-album.md`.
 *
 * Trao sticker khi đóng phiên chơi (`BR-STK-01`), đọc album của trẻ đang hoạt
 * động (`BR-STK-07`). Bảng `child_stickers` chỉ INSERT (`BR-STK-02`).
 */

import { childStickers, gameLevels, type getOwnerDb } from "@mindkid/db";
import { and, asc, eq } from "drizzle-orm";
import {
  type AlbumTheme,
  groupStickerAlbum,
  pickLevelTheme,
  pickSticker,
  type StickerDef,
} from "./child-sticker-pick.ts";

type Db = ReturnType<typeof getOwnerDb>;
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface AwardPlayStickerInput {
  readonly childId: number;
  readonly playSessionId: number;
  readonly levelCode: string;
  readonly themeId?: string | null;
  readonly levelThemes?: readonly (string | null)[];
}

export type AwardLessonStickerInput = AwardPlayStickerInput;

/** `theme_id` của level đã xuất bản (`BR-STK-04`). */
async function loadLevelThemes(
  tx: DbTx,
  input: AwardPlayStickerInput
): Promise<readonly (string | null)[]> {
  if (input.levelThemes !== undefined) {
    return input.levelThemes;
  }
  if (input.themeId !== undefined) {
    return [input.themeId];
  }
  const [row] = await tx
    .select({ themeId: gameLevels.themeId })
    .from(gameLevels)
    .where(eq(gameLevels.code, input.levelCode))
    .limit(1);
  return [row?.themeId ?? null];
}

async function loadOwnedEmojis(
  tx: DbTx,
  childId: number,
  themeCode: string
): Promise<string[]> {
  const rows = await tx
    .select({ emoji: childStickers.emoji })
    .from(childStickers)
    .where(
      and(
        eq(childStickers.childProfileId, childId),
        eq(childStickers.themeCode, themeCode)
      )
    );
  return rows.map((row) => row.emoji);
}

async function findPlaySticker(
  tx: DbTx,
  childId: number,
  playSessionId: number
): Promise<StickerDef | null> {
  const [row] = await tx
    .select({
      theme_code: childStickers.themeCode,
      emoji: childStickers.emoji,
      label: childStickers.label,
    })
    .from(childStickers)
    .where(
      and(
        eq(childStickers.childProfileId, childId),
        eq(childStickers.playSessionId, playSessionId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Trao sticker cho một phiên chơi vừa đóng. Gọi **trong** transaction đóng phiên,
 * chỉ khi phiên thật sự vừa chuyển sang `completed` (`BR-STK-01`). Unique
 * `(child, play_session)` là lớp chặn thứ hai: trùng thì trả sticker đã có.
 */
export async function awardPlaySticker(
  tx: DbTx,
  input: AwardPlayStickerInput
): Promise<StickerDef> {
  const themeCode = pickLevelTheme(
    await loadLevelThemes(tx, input),
    input.levelCode
  );
  const sticker = pickSticker(
    themeCode,
    await loadOwnedEmojis(tx, input.childId, themeCode)
  );
  const [created] = await tx
    .insert(childStickers)
    .values({
      childProfileId: input.childId,
      playSessionId: input.playSessionId,
      themeCode: sticker.theme_code,
      emoji: sticker.emoji,
      label: sticker.label,
    })
    .onConflictDoNothing()
    .returning({ id: childStickers.id });
  if (created) {
    return sticker;
  }
  return (
    (await findPlaySticker(tx, input.childId, input.playSessionId)) ?? sticker
  );
}

export const awardLessonSticker = awardPlaySticker;

export interface LoadStickerAlbumInput {
  readonly childId: number;
  readonly themeCode?: string;
}

export interface StickerAlbumView {
  readonly themes: readonly AlbumTheme[];
}

/** Album của **một** trẻ (`BR-STK-07`), gom theo chủ đề (§7.2). */
export async function loadStickerAlbum(
  db: Db,
  input: LoadStickerAlbumInput
): Promise<StickerAlbumView> {
  const filters = [
    eq(childStickers.childProfileId, input.childId),
    ...(input.themeCode ? [eq(childStickers.themeCode, input.themeCode)] : []),
  ];
  const rows = await db
    .select({
      theme_code: childStickers.themeCode,
      emoji: childStickers.emoji,
      label: childStickers.label,
      awarded_at: childStickers.awardedAt,
    })
    .from(childStickers)
    .where(and(...filters))
    .orderBy(asc(childStickers.awardedAt), asc(childStickers.id));
  return { themes: groupStickerAlbum(rows) };
}
