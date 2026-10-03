/**
 * Album sticker của trẻ — `docs/specs/04-play/sticker-album.md`.
 *
 * Trao sticker khi đóng lượt học (`BR-STK-01`), đọc album của trẻ đang hoạt
 * động (`BR-STK-07`). Bảng `child_stickers` chỉ INSERT (`BR-STK-02`).
 */

import {
  type ChildLessonStepSnapshot,
  childStickers,
  gameLevels,
  type getOwnerDb,
} from "@mindkid/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  type AlbumTheme,
  groupStickerAlbum,
  pickLessonTheme,
  pickSticker,
  type StickerDef,
} from "./child-sticker-pick.ts";

type Db = ReturnType<typeof getOwnerDb>;
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface AwardLessonStickerInput {
  readonly childId: number;
  readonly playId: number;
  readonly lessonCode: string;
  readonly steps: readonly ChildLessonStepSnapshot[];
}

/** `theme_id` của các bước `game`, theo thứ tự bước đã chụp (`BR-STK-04`). */
async function loadStepThemes(
  tx: DbTx,
  steps: readonly ChildLessonStepSnapshot[]
): Promise<(string | null)[]> {
  const gameCodes = steps
    .filter((step) => step.kind === "game")
    .map((step) => step.level_code);
  if (gameCodes.length === 0) {
    return [];
  }
  const rows = await tx
    .select({ code: gameLevels.code, themeId: gameLevels.themeId })
    .from(gameLevels)
    .where(
      and(
        inArray(gameLevels.code, gameCodes),
        eq(gameLevels.status, "published")
      )
    );
  const themeByCode = new Map(rows.map((row) => [row.code, row.themeId]));
  return gameCodes.map((code) => themeByCode.get(code) ?? null);
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
  playId: number
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
        eq(childStickers.childLessonPlayId, playId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Trao sticker cho một lượt vừa đóng. Gọi **trong** transaction đóng lượt,
 * chỉ khi lượt thật sự vừa chuyển sang `completed` (`BR-STK-01`). Unique
 * `(child, play)` là lớp chặn thứ hai: trùng thì trả sticker đã có.
 */
export async function awardLessonSticker(
  tx: DbTx,
  input: AwardLessonStickerInput
): Promise<StickerDef> {
  const themeCode = pickLessonTheme(
    await loadStepThemes(tx, input.steps),
    input.lessonCode
  );
  const sticker = pickSticker(
    themeCode,
    await loadOwnedEmojis(tx, input.childId, themeCode)
  );
  const [created] = await tx
    .insert(childStickers)
    .values({
      childProfileId: input.childId,
      childLessonPlayId: input.playId,
      themeCode: sticker.theme_code,
      emoji: sticker.emoji,
      label: sticker.label,
    })
    .onConflictDoNothing()
    .returning({ id: childStickers.id });
  if (created) {
    return sticker;
  }
  return (await findPlaySticker(tx, input.childId, input.playId)) ?? sticker;
}

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
