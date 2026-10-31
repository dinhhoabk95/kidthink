import crypto from "node:crypto";
import {
  childProfiles,
  childStickers,
  gameLevels,
  getOwnerDb,
  playSessions,
  users,
} from "@mindkid/db";
import { CONTENT_THEMES } from "@mindkid/shared";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import albumHandler from "#server/api/users/play/stickers.get";
import type { StickerDef } from "#server/services/child-sticker-pick";
import { awardPlaySticker } from "#server/services/child-stickers";

/**
 * Album sticker (`sticker-album.md`, BR-STK-01..07) trên DB test thật.
 * `mindkid_test` không có seed — mọi fixture tự dựng, mã mang hậu tố ngẫu
 * nhiên để chạy song song với agent khác không đụng nhau.
 */

const CSRF_TOKEN = "s".repeat(64);
const THEME = "farm";

interface ChildFixture {
  readonly userId: number;
  readonly childId: number;
  readonly childUuid: string;
}

interface AlbumView {
  readonly themes: ReadonlyArray<{
    readonly theme_code: string;
    readonly icon_emoji: string;
    readonly stickers: ReadonlyArray<{ emoji: string; label: string }>;
  }>;
}

function mockEvent(
  input: {
    readonly userId: number;
    readonly childUuid: string;
    readonly method: "GET" | "POST";
    readonly url: string;
  },
  params: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const cookies = [
    `tm_u_csrf=${CSRF_TOKEN}`,
    `active_child_id=${input.childUuid}`,
  ];
  return {
    method: input.method,
    path: input.url,
    node: {
      req: {
        method: input.method,
        headers: { "x-csrf-token": CSRF_TOKEN, cookie: cookies.join("; ") },
        url: input.url,
        originalUrl: input.url,
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      params,
      user: {
        user_id: input.userId,
        display_name: "Phụ huynh STK",
        session_id: `sess_${input.userId}`,
      },
    },
  } as never;
}

const createdUserIds: number[] = [];

async function createChild(): Promise<ChildFixture> {
  const db = getOwnerDb();
  const hex = crypto.randomBytes(5).toString("hex");
  const [user] = await db
    .insert(users)
    .values({ email: `stk-${hex}@example.com`, displayName: "Phụ huynh STK" })
    .returning();
  if (!user) {
    throw new Error("Không tạo được user");
  }
  createdUserIds.push(user.id);
  const [child] = await db
    .insert(childProfiles)
    .values({
      userId: user.id,
      displayName: "Bé STK",
      birthYear: 2021,
      avatarId: "preset_01",
    })
    .returning();
  if (!child) {
    throw new Error("Không tạo được hồ sơ trẻ");
  }
  return { userId: user.id, childId: child.id, childUuid: child.uuid };
}

function fourDigits(): string {
  return String(crypto.randomInt(0, 10_000)).padStart(4, "0");
}

interface LevelFixture {
  readonly levelId: number;
  readonly levelCode: string;
  readonly cleanup: () => Promise<void>;
}

async function createLevelFixture(): Promise<LevelFixture> {
  const db = getOwnerDb();
  const suffix = fourDigits();
  const [level] = await db
    .insert(gameLevels)
    .values({
      code: `GL-C1-STK-TSTA-${suffix}`,
      templateCode: "GT-001",
      title: "Level STK A",
      contentPack: {},
      difficultyParams: {},
      themeId: THEME,
      accessTier: "free" as const,
    })
    .returning();
  if (!level) {
    throw new Error("Không tạo được level");
  }
  return {
    levelId: level.id,
    levelCode: level.code,
    cleanup: async () => {
      await db
        .delete(playSessions)
        .where(eq(playSessions.gameLevelId, level.id));
      await db.delete(gameLevels).where(eq(gameLevels.id, level.id));
    },
  };
}

async function createCompletedPlaySession(
  childId: number,
  levelCode: string
): Promise<number> {
  const db = getOwnerDb();
  const [level] = await db
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.code, levelCode))
    .limit(1);
  if (!level) {
    throw new Error(`Thiếu level ${levelCode}`);
  }
  const now = new Date();
  const [session] = await db
    .insert(playSessions)
    .values({
      childProfileId: childId,
      gameLevelId: level.id,
      templateCode: level.templateCode,
      completionStatus: "completed",
      startedAt: now,
      completedAt: now,
    })
    .returning({ id: playSessions.id });
  if (!session) {
    throw new Error("Không tạo được play_session");
  }
  return session.id;
}

async function finishPlayAndAward(
  child: ChildFixture,
  levelCode: string
): Promise<{ playSessionId: number; sticker: StickerDef }> {
  const playSessionId = await createCompletedPlaySession(
    child.childId,
    levelCode
  );
  const sticker = await getOwnerDb().transaction((tx) =>
    awardPlaySticker(tx, {
      childId: child.childId,
      playSessionId,
      levelCode,
      themeId: THEME,
    })
  );
  return { playSessionId, sticker };
}

function getAlbum(child: ChildFixture, query = ""): Promise<AlbumView> {
  return albumHandler(
    mockEvent({
      userId: child.userId,
      childUuid: child.childUuid,
      method: "GET",
      url: `/api/users/play/stickers${query}`,
    })
  ) as Promise<AlbumView>;
}

function stickerRowsOf(childId: number) {
  return getOwnerDb()
    .select()
    .from(childStickers)
    .where(eq(childStickers.childProfileId, childId));
}

interface CodedError {
  readonly data?: { readonly code?: string };
}

function errorCode(err: CodedError): string | undefined {
  return err.data?.code;
}

const farmEmojis = new Set(
  CONTENT_THEMES.find((t) => t.code === THEME)?.nouns.map((n) => n.emoji_ref)
);

describe("Album sticker API (sticker-album.md, BR-STK-01..07)", () => {
  let level: LevelFixture;

  beforeAll(async () => {
    level = await createLevelFixture();
  });

  afterAll(async () => {
    await level.cleanup();
    if (createdUserIds.length > 0) {
      await getOwnerDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("BR-STK-01: đóng lượt thì trao đúng một sticker, gọi lại không trao thêm", async () => {
    const child = await createChild();

    const { playSessionId, sticker } = await finishPlayAndAward(
      child,
      level.levelCode
    );

    expect(sticker.theme_code).toBe(THEME);
    expect(farmEmojis.has(sticker.emoji)).toBe(true);
    const rows = await stickerRowsOf(child.childId);
    expect(rows).toHaveLength(1);

    const again = await getOwnerDb().transaction((tx) =>
      awardPlaySticker(tx, {
        childId: child.childId,
        playSessionId,
        levelCode: level.levelCode,
        themeId: THEME,
      })
    );
    expect(again).toEqual(sticker);
    expect(await stickerRowsOf(child.childId)).toHaveLength(1);
  });

  it("Ca âm BR-STK-01: lượt chưa xong thì không có sticker", async () => {
    const child = await createChild();

    expect(await stickerRowsOf(child.childId)).toHaveLength(0);
  });

  it("Ca âm BR-STK-01: DB chặn sticker thứ hai cho cùng một lượt", async () => {
    const child = await createChild();
    await finishPlayAndAward(child, level.levelCode);
    const [row] = await stickerRowsOf(child.childId);
    if (!row) {
      throw new Error("Thiếu sticker");
    }

    await expect(
      getOwnerDb().insert(childStickers).values({
        childProfileId: child.childId,
        playSessionId: row.playSessionId,
        themeCode: THEME,
        emoji: "🐮",
        label: "Bò sữa",
      })
    ).rejects.toThrow();
  });

  it("BR-STK-05: xong bài lần hai cùng chủ đề thì nhận sticker mới", async () => {
    const child = await createChild();

    const first = await finishPlayAndAward(child, level.levelCode);
    const second = await finishPlayAndAward(child, level.levelCode);

    expect(second.sticker.emoji).not.toBe(first.sticker.emoji);
  });

  it("BR-STK-02: xoá lượt chơi thì sticker ở lại", async () => {
    const child = await createChild();
    const { playSessionId } = await finishPlayAndAward(child, level.levelCode);
    const db = getOwnerDb();

    await db.delete(playSessions).where(eq(playSessions.id, playSessionId));

    const rows = await stickerRowsOf(child.childId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.playSessionId).toBeNull();
  });

  it("GET album: gom theo chủ đề, chỉ sticker của trẻ đang hoạt động", async () => {
    const child = await createChild();
    const other = await createChild();
    const first = await finishPlayAndAward(child, level.levelCode);
    await finishPlayAndAward(other, level.levelCode);
    await finishPlayAndAward(other, level.levelCode);

    const album = await getAlbum(child);

    expect(album.themes).toHaveLength(1);
    expect(album.themes[0]?.theme_code).toBe(THEME);
    expect(album.themes[0]?.stickers).toEqual([
      { emoji: first.sticker.emoji, label: first.sticker.label },
    ]);
  });

  it("GET album: lọc theo theme hợp lệ, chủ đề không có sticker thì rỗng", async () => {
    const child = await createChild();
    await finishPlayAndAward(child, level.levelCode);

    expect((await getAlbum(child, `?theme=${THEME}`)).themes).toHaveLength(1);
    expect((await getAlbum(child, "?theme=ocean")).themes).toHaveLength(0);
  });

  it("Ca âm: theme ngoài registry thì VALIDATION_FAILED", async () => {
    const child = await createChild();

    await expect(getAlbum(child, "?theme=dino")).rejects.toSatisfy(
      (err: CodedError) => errorCode(err) === "VALIDATION_FAILED"
    );
  });

  it("Ca âm BR-STK-07: cookie trỏ hồ sơ trẻ của user khác thì NO_ACTIVE_CHILD", async () => {
    const owner = await createChild();
    const stranger = await createChild();
    await finishPlayAndAward(owner, level.levelCode);

    await expect(
      getAlbum({ ...stranger, childUuid: owner.childUuid })
    ).rejects.toSatisfy(
      (err: CodedError) => errorCode(err) === "NO_ACTIVE_CHILD"
    );
  });
});
