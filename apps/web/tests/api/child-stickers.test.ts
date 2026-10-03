import crypto from "node:crypto";
import {
  activities,
  childLessonPlays,
  childProfiles,
  childStickers,
  gameLevels,
  getOwnerDb,
  lessonActivities,
  lessons,
  playSessions,
  users,
} from "@mindkid/db";
import { CONTENT_THEMES } from "@mindkid/shared";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import progressHandler from "#server/api/users/play/lessons/[code]/progress.post";
import albumHandler from "#server/api/users/play/stickers.get";
import type { LessonProgressView } from "#server/services/child-lesson-flow";

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

function bigId(): number {
  return crypto.randomInt(100_000_000, 2_000_000_000);
}

interface LessonFixture {
  readonly lessonCode: string;
  readonly cleanup: () => Promise<void>;
}

/** Bài hai level cùng chủ đề `farm`, không gắn kỹ năng nên không có bước làm quen. */
async function createLesson(): Promise<LessonFixture> {
  const db = getOwnerDb();
  const suffix = fourDigits();
  const levelRows = await db
    .insert(gameLevels)
    .values(
      ["A", "B"].map((tag) => ({
        entityId: bigId(),
        code: `GL-C1-STK-TST${tag}-${suffix}`,
        templateCode: "GT-001",
        title: `Level STK ${tag}`,
        contentPack: {},
        difficultyParams: {},
        themeId: THEME,
        accessTier: "free" as const,
        status: "published" as const,
      }))
    )
    .returning();
  const [lesson] = await db
    .insert(lessons)
    .values({
      entityId: bigId(),
      code: `LES-${suffix}`,
      contentVersion: crypto.randomInt(1000, 1_000_000),
      title: "Bài thử STK",
      status: "published",
      accessTier: "free",
    })
    .returning();
  if (!lesson) {
    throw new Error("Không tạo được bài");
  }
  const activityRows = await db
    .insert(activities)
    .values(
      levelRows.map((level, i) => ({
        entityId: bigId(),
        code: `ACT-${fourDigits()}`,
        contentVersion: crypto.randomInt(1000, 1_000_000) + i,
        kind: "digital_game" as const,
        title: `Chơi ${level.code}`,
        refType: "game_level",
        refId: level.entityId,
        accessTier: "free" as const,
        status: "draft" as const,
      }))
    )
    .returning();
  // Pivot trỏ `activities.entity_id` (D-AE). Chèn dạng draft rồi đặt
  // `entity_id = id` cùng lúc publish (bản published bất biến — BR-SCT-05),
  // để fixture đúng cả trước lẫn sau khi join của `findLessonGameLevels`
  // chuyển sang `entity_id` trên main.
  for (const act of activityRows) {
    await db
      .update(activities)
      .set({ entityId: act.id, status: "published" })
      .where(eq(activities.id, act.id));
  }
  await db.insert(lessonActivities).values(
    activityRows.map((act, i) => ({
      lessonId: lesson.id,
      activityId: act.id,
      position: i + 1,
    }))
  );
  const levelIds = levelRows.map((level) => level.id);
  return {
    lessonCode: lesson.code,
    cleanup: async () => {
      await db.delete(lessons).where(eq(lessons.id, lesson.id));
      await db.delete(activities).where(
        inArray(
          activities.id,
          activityRows.map((act) => act.id)
        )
      );
      await db
        .delete(playSessions)
        .where(inArray(playSessions.gameLevelId, levelIds));
      await db.delete(gameLevels).where(inArray(gameLevels.id, levelIds));
    },
  };
}

async function completeLevel(childId: number, levelCode: string) {
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
  await db.insert(playSessions).values({
    childProfileId: childId,
    gameLevelId: level.id,
    contentVersion: level.contentVersion,
    templateCode: level.templateCode,
    completionStatus: "completed",
    startedAt: now,
    completedAt: now,
  });
}

function openProgress(
  child: ChildFixture,
  code: string
): Promise<LessonProgressView> {
  return progressHandler(
    mockEvent(
      {
        userId: child.userId,
        childUuid: child.childUuid,
        method: "POST",
        url: `/api/users/play/lessons/${code}/progress`,
      },
      { code }
    )
  ) as Promise<LessonProgressView>;
}

/** Mở bài, chơi xong mọi bước, gọi lại để đóng lượt. */
async function finishLesson(
  child: ChildFixture,
  code: string
): Promise<LessonProgressView> {
  const view = await openProgress(child, code);
  for (const step of view.steps) {
    await completeLevel(child.childId, step.level_code);
  }
  return openProgress(child, code);
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

function errorCode(err: unknown): string | undefined {
  return (err as { data?: { code?: string } }).data?.code;
}

const farmEmojis = new Set(
  CONTENT_THEMES.find((t) => t.code === THEME)?.nouns.map((n) => n.emoji_ref)
);

describe("Album sticker API (sticker-album.md, BR-STK-01..07)", () => {
  let lesson: LessonFixture;

  beforeAll(async () => {
    lesson = await createLesson();
  });

  afterAll(async () => {
    await lesson.cleanup();
    if (createdUserIds.length > 0) {
      // Cascade xoá hồ sơ trẻ, lượt học và sticker của fixture.
      await getOwnerDb().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("BR-STK-01: đóng lượt thì trao đúng một sticker, gọi lại không trao thêm", async () => {
    const child = await createChild();

    const done = await finishLesson(child, lesson.lessonCode);

    expect(done.just_completed).toBe(true);
    expect(done.sticker?.theme_code).toBe(THEME);
    expect(farmEmojis.has(done.sticker?.emoji ?? "")).toBe(true);
    const rows = await stickerRowsOf(child.childId);
    expect(rows).toHaveLength(1);

    const next = await openProgress(child, lesson.lessonCode);
    expect(next.just_completed).toBe(false);
    expect(next.sticker).toBeNull();
    expect(await stickerRowsOf(child.childId)).toHaveLength(1);
  });

  it("Ca âm BR-STK-01: lượt chưa xong thì không có sticker", async () => {
    const child = await createChild();

    const view = await openProgress(child, lesson.lessonCode);

    expect(view.sticker).toBeNull();
    expect(await stickerRowsOf(child.childId)).toHaveLength(0);
  });

  it("Ca âm BR-STK-01: DB chặn sticker thứ hai cho cùng một lượt", async () => {
    const child = await createChild();
    await finishLesson(child, lesson.lessonCode);
    const [row] = await stickerRowsOf(child.childId);
    if (!row) {
      throw new Error("Thiếu sticker");
    }

    await expect(
      getOwnerDb().insert(childStickers).values({
        childProfileId: child.childId,
        childLessonPlayId: row.childLessonPlayId,
        themeCode: THEME,
        emoji: "🐮",
        label: "Bò sữa",
      })
    ).rejects.toThrow();
  });

  it("BR-STK-05: xong bài lần hai cùng chủ đề thì nhận sticker mới", async () => {
    const child = await createChild();

    const first = await finishLesson(child, lesson.lessonCode);
    const second = await finishLesson(child, lesson.lessonCode);

    expect(second.just_completed).toBe(true);
    expect(second.sticker?.emoji).not.toBe(first.sticker?.emoji);
  });

  it("BR-STK-02: xoá lượt học thì sticker ở lại", async () => {
    const child = await createChild();
    await finishLesson(child, lesson.lessonCode);
    const db = getOwnerDb();

    await db
      .delete(childLessonPlays)
      .where(eq(childLessonPlays.childProfileId, child.childId));

    const rows = await stickerRowsOf(child.childId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.childLessonPlayId).toBeNull();
  });

  it("GET album: gom theo chủ đề, chỉ sticker của trẻ đang hoạt động", async () => {
    const child = await createChild();
    const other = await createChild();
    const first = await finishLesson(child, lesson.lessonCode);
    await finishLesson(other, lesson.lessonCode);
    await finishLesson(other, lesson.lessonCode);

    const album = await getAlbum(child);

    expect(album.themes).toHaveLength(1);
    expect(album.themes[0]?.theme_code).toBe(THEME);
    expect(album.themes[0]?.stickers).toEqual([
      { emoji: first.sticker?.emoji, label: first.sticker?.label },
    ]);
  });

  it("GET album: lọc theo theme hợp lệ, chủ đề không có sticker thì rỗng", async () => {
    const child = await createChild();
    await finishLesson(child, lesson.lessonCode);

    expect((await getAlbum(child, `?theme=${THEME}`)).themes).toHaveLength(1);
    expect((await getAlbum(child, "?theme=ocean")).themes).toHaveLength(0);
  });

  it("Ca âm: theme ngoài registry thì VALIDATION_FAILED", async () => {
    const child = await createChild();

    await expect(getAlbum(child, "?theme=dino")).rejects.toSatisfy(
      (err: unknown) => errorCode(err) === "VALIDATION_FAILED"
    );
  });

  it("Ca âm BR-STK-07: cookie trỏ hồ sơ trẻ của user khác thì NO_ACTIVE_CHILD", async () => {
    const owner = await createChild();
    const stranger = await createChild();
    await finishLesson(owner, lesson.lessonCode);

    await expect(
      getAlbum({ ...stranger, childUuid: owner.childUuid })
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === "NO_ACTIVE_CHILD");
  });
});
