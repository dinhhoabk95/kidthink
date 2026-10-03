import crypto from "node:crypto";
import {
  activities,
  childLessonPlays,
  childProfiles,
  gameLevels,
  getOwnerDb,
  lessonActivities,
  lessons,
  playSessions,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import progressHandler from "#server/api/users/play/lessons/[code]/progress.post";
import listHandler from "#server/api/users/play/lessons/index.get";
import type { LessonProgressView } from "#server/services/child-lesson-flow";

/** Double-submit CSRF của route POST (cùng mẫu `curriculum-player.test.ts`). */
const CSRF_TOKEN = "c".repeat(64);

interface Fixture {
  readonly userId: number;
  readonly childId: number;
  readonly childUuid: string;
}

function mockEvent(
  userId: number,
  childUuid: string | null,
  params: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const url = "/api/users/play/lessons";
  const cookies = [`tm_u_csrf=${CSRF_TOKEN}`];
  if (childUuid) {
    cookies.push(`active_child_id=${childUuid}`);
  }
  return {
    method: "POST",
    node: {
      req: {
        headers: { "x-csrf-token": CSRF_TOKEN, cookie: cookies.join("; ") },
        url,
        originalUrl: url,
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
        user_id: userId,
        display_name: "Phụ huynh CLF",
        session_id: `sess_${userId}`,
      },
    },
  } as never;
}

async function createFixture(birthYear: number): Promise<Fixture> {
  const db = getOwnerDb();
  const hex = crypto.randomBytes(4).toString("hex");
  const [user] = await db
    .insert(users)
    .values({ email: `clf-${hex}@example.com`, displayName: "Phụ huynh CLF" })
    .returning();
  if (!user) {
    throw new Error("Không tạo được user");
  }
  const [child] = await db
    .insert(childProfiles)
    .values({
      userId: user.id,
      displayName: "Bé CLF",
      birthYear,
      avatarId: "preset_01",
    })
    .returning();
  if (!child) {
    throw new Error("Không tạo được hồ sơ trẻ");
  }
  return { userId: user.id, childId: child.id, childUuid: child.uuid };
}

interface LessonFixture {
  readonly lessonCode: string;
  /** Mã level theo thứ tự `position` (khác thứ tự chèn). */
  readonly orderedLevelCodes: readonly string[];
  readonly cleanup: () => Promise<void>;
}

function fourDigits(): string {
  return String(crypto.randomInt(0, 10_000)).padStart(4, "0");
}

async function insertLevel(code: string, thumbnailEmoji: string | null = null) {
  const db = getOwnerDb();
  const [level] = await db
    .insert(gameLevels)
    .values({
      entityId: crypto.randomInt(100_000_000, 2_000_000_000),
      code,
      templateCode: "GT-001",
      title: `Level ${code}`,
      thumbnailEmoji,
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status: "published",
    })
    .returning();
  if (!level) {
    throw new Error("Không tạo được level");
  }
  return level;
}

/**
 * Bài hai level, chèn level A ở `position` 2 và B ở `position` 1 — thứ tự bước
 * phải theo `position`, không theo thứ tự chèn (`BR-CLF-01`). Level không gắn
 * kỹ năng nên cổng làm quen không chèn bước intro.
 */
async function createLessonFixture(
  firstLevelEmoji: string | null = null
): Promise<LessonFixture> {
  const db = getOwnerDb();
  const suffix = fourDigits();
  const levelA = await insertLevel(`GL-C1-CLF-TSTA-${suffix}`);
  const levelB = await insertLevel(`GL-C1-CLF-TSTB-${suffix}`, firstLevelEmoji);
  const [lesson] = await db
    .insert(lessons)
    .values({
      entityId: crypto.randomInt(100_000_000, 2_000_000_000),
      code: `LES-${suffix}`,
      contentVersion: crypto.randomInt(1000, 1_000_000),
      title: "Bài thử CLF",
      targetAgeMin: 5,
      targetAgeMax: 6,
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
      [levelA, levelB].map((level, i) => ({
        entityId: crypto.randomInt(100_000_000, 2_000_000_000),
        code: `ACT-${fourDigits()}`,
        contentVersion: crypto.randomInt(1000, 1_000_000) + i,
        kind: "digital_game" as const,
        title: `Chơi ${level.code}`,
        refType: "game_level",
        refId: level.entityId,
        accessTier: "free" as const,
        status: "published" as const,
      }))
    )
    .returning();
  const [actA, actB] = activityRows;
  if (!(actA && actB)) {
    throw new Error("Không tạo được hoạt động");
  }
  await db.insert(lessonActivities).values([
    // Như seed thật: pivot trỏ `activities.entity_id`, không trỏ `id`
    // (`schema-content-taxonomy.md` §7) — QA trình duyệt 2026-10-03 bắt lỗi
    // service join `id` mà fixture cũ dùng `id` nên test vẫn xanh.
    { lessonId: lesson.id, activityId: actA.entityId, position: 2 },
    { lessonId: lesson.id, activityId: actB.entityId, position: 1 },
  ]);

  return {
    lessonCode: lesson.code,
    orderedLevelCodes: [levelB.code, levelA.code],
    cleanup: async () => {
      await db.delete(lessons).where(eq(lessons.id, lesson.id));
      for (const act of activityRows) {
        await db.delete(activities).where(eq(activities.id, act.id));
      }
      for (const level of [levelA, levelB]) {
        await db
          .delete(playSessions)
          .where(eq(playSessions.gameLevelId, level.id));
        await db.delete(gameLevels).where(eq(gameLevels.id, level.id));
      }
    },
  };
}

async function completeLevel(
  childId: number,
  levelCode: string,
  completedAt: Date
): Promise<void> {
  const db = getOwnerDb();
  const [level] = await db
    .select()
    .from(gameLevels)
    .where(
      and(eq(gameLevels.code, levelCode), eq(gameLevels.status, "published"))
    )
    .limit(1);
  if (!level) {
    throw new Error(`Thiếu level ${levelCode}`);
  }
  await db.insert(playSessions).values({
    childProfileId: childId,
    gameLevelId: level.id,
    contentVersion: level.contentVersion,
    templateCode: level.templateCode,
    completionStatus: "completed",
    startedAt: completedAt,
    completedAt,
  });
}

async function openProgress(
  fixture: Fixture,
  code: string
): Promise<LessonProgressView> {
  return (await progressHandler(
    mockEvent(fixture.userId, fixture.childUuid, { code })
  )) as LessonProgressView;
}

function statusOf(err: unknown): number | undefined {
  const e = err as { statusCode?: number; status?: number };
  return e.statusCode ?? e.status;
}

describe("Child lesson flow API (child-lesson-flow.md, BR-CLF-01..08)", () => {
  let fixture: LessonFixture;
  let lessonCode = "";

  beforeAll(async () => {
    fixture = await createLessonFixture();
    lessonCode = fixture.lessonCode;
  });

  afterAll(async () => {
    await fixture.cleanup();
  });

  it("BR-CLF-01/02: mở bài thì chụp kế hoạch, mọi level của bài có một bước game", async () => {
    const child = await createFixture(2021);

    const view = await openProgress(child, lessonCode);

    expect(view.lesson.code).toBe(lessonCode);
    expect(view.status).toBe("in_progress");
    expect(view.current_step).toBe(0);
    expect(view.steps.map((s) => s.level_code)).toEqual(
      fixture.orderedLevelCodes
    );
    expect(view.steps.every((s) => s.kind === "game")).toBe(true);
  });

  it("BR-CLF-04: vào lại thì cùng lượt và tiếp đúng bước", async () => {
    const child = await createFixture(2021);
    const first = await openProgress(child, lessonCode);
    const step0 = first.steps[0];
    if (!step0) {
      throw new Error("Bài không có bước");
    }

    await completeLevel(child.childId, step0.level_code, new Date());
    const again = await openProgress(child, lessonCode);

    expect(again.play_uuid).toBe(first.play_uuid);
    expect(again.steps).toHaveLength(first.steps.length);
    expect(again.steps[0]?.done).toBe(true);
    expect(again.current_step).toBe(1);
  });

  it("BR-CLF-03: level chơi xong TRƯỚC khi mở lượt không tính", async () => {
    const child = await createFixture(2021);
    const view = await openProgress(child, lessonCode);
    const game = view.steps.find((s) => s.kind === "game");
    if (!game) {
      throw new Error("Bài không có bước game");
    }

    await completeLevel(
      child.childId,
      game.level_code,
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const again = await openProgress(child, lessonCode);

    expect(again.steps[game.index]?.done).toBe(false);
  });

  it("BR-CLF-08: xong mọi bước thì đóng lượt một lần, lần sau mở lượt mới", async () => {
    const child = await createFixture(2021);
    const view = await openProgress(child, lessonCode);
    for (const step of view.steps) {
      await completeLevel(child.childId, step.level_code, new Date());
    }

    const done = await openProgress(child, lessonCode);
    expect(done.status).toBe("completed");
    expect(done.just_completed).toBe(true);
    expect(done.current_step).toBeNull();

    const next = await openProgress(child, lessonCode);
    expect(next.play_uuid).not.toBe(done.play_uuid);
    expect(next.just_completed).toBe(false);

    const db = getOwnerDb();
    const plays = await db
      .select()
      .from(childLessonPlays)
      .where(eq(childLessonPlays.childProfileId, child.childId));
    expect(plays.filter((p) => p.status === "in_progress")).toHaveLength(1);
  });

  it("BR-CLF-07: bài ngoài tuổi vẫn mở được", async () => {
    const tooYoung = await createFixture(new Date().getFullYear() - 2);

    const view = await openProgress(tooYoung, lessonCode);

    expect(view.lesson.code).toBe(lessonCode);
  });

  it("Ca âm: mã bài sai định dạng hoặc không tồn tại trả 404", async () => {
    const child = await createFixture(2021);

    await expect(openProgress(child, "LES-9999")).rejects.toSatisfy(
      (err: unknown) => statusOf(err) === 404
    );
    await expect(openProgress(child, "DROP TABLE")).rejects.toSatisfy(
      (err: unknown) => statusOf(err) === 404
    );
  });

  it("Ca âm: cookie trỏ hồ sơ trẻ của user khác thì NO_ACTIVE_CHILD", async () => {
    const owner = await createFixture(2021);
    const stranger = await createFixture(2021);

    await expect(
      progressHandler(
        mockEvent(stranger.userId, owner.childUuid, { code: lessonCode })
      )
    ).rejects.toSatisfy(
      (err: unknown) =>
        (err as { data?: { code?: string } }).data?.code === "NO_ACTIVE_CHILD"
    );
  });

  it("danh sách gợi ý xếp bài đang dở lên đầu", async () => {
    const child = await createFixture(2021);
    await openProgress(child, lessonCode);

    const list = (await listHandler(
      mockEvent(child.userId, child.childUuid)
    )) as Array<{ code: string; in_progress: boolean }>;

    expect(list[0]).toMatchObject({ code: lessonCode, in_progress: true });
    expect(list.length).toBeLessThanOrEqual(6);
  });

  it("thumbnail_emoji lấy từ level đầu bài; level không có emoji thì rơi về 📘", async () => {
    const withEmoji = await createLessonFixture("🍎");
    const child = await createFixture(2021);
    try {
      await openProgress(child, withEmoji.lessonCode);
      await openProgress(child, lessonCode);

      const list = (await listHandler(
        mockEvent(child.userId, child.childUuid)
      )) as Array<{ code: string; thumbnail_emoji: string }>;

      expect(
        list.find((l) => l.code === withEmoji.lessonCode)?.thumbnail_emoji
      ).toBe("🍎");
      expect(list.find((l) => l.code === lessonCode)?.thumbnail_emoji).toBe(
        "📘"
      );
    } finally {
      await withEmoji.cleanup();
    }
  });
});
