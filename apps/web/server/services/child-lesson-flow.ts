/**
 * Lượt trẻ tự học một bài — `docs/specs/04-play/child-lesson-flow.md`.
 *
 * Mở hoặc tiếp lượt `in_progress`, chụp kế hoạch bước một lần (`BR-CLF-02`),
 * suy tiến độ từ `play_sessions` (`BR-CLF-03`) và đóng lượt khi xong.
 */

import {
  activities,
  type ChildLessonStepSnapshot,
  childLessonPlays,
  gameLevels,
  type getOwnerDb,
  lessonActivities,
  lessons,
  playSessions,
} from "@mindkid/db";
import { LessonNotFoundError } from "@mindkid/errors/content";
import type { AccessTier, CallerIdentity } from "@mindkid/shared";
import { and, asc, eq, inArray, max } from "drizzle-orm";
import { checkLevelIntroRequired } from "#server/utils/concept-intro-runtime";
import {
  buildStepPlan,
  deriveStepStates,
  type StepState,
} from "./child-lesson-steps.ts";

type Db = ReturnType<typeof getOwnerDb>;
type LessonRow = typeof lessons.$inferSelect;
type PlayRow = typeof childLessonPlays.$inferSelect;
type GameLevelRow = typeof gameLevels.$inferSelect;

export interface OpenLessonProgressInput {
  readonly childId: number;
  readonly lessonCode: string;
  readonly caller: CallerIdentity;
  readonly allowedTiers: readonly AccessTier[];
  readonly now?: Date;
}

export interface LessonStepView {
  readonly index: number;
  readonly kind: StepState["kind"];
  readonly level_code: string;
  readonly title: string | null;
  readonly thumbnail_emoji: string | null;
  readonly done: boolean;
  readonly locked: boolean;
}

export interface LessonProgressView {
  readonly lesson: { readonly code: string; readonly title: string };
  readonly play_uuid: string;
  readonly steps: readonly LessonStepView[];
  readonly current_step: number | null;
  readonly status: "in_progress" | "completed";
  readonly just_completed: boolean;
}

async function findPublishedLesson(
  db: Db,
  lessonCode: string
): Promise<LessonRow> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.code, lessonCode), eq(lessons.status, "published")))
    .limit(1);
  if (!lesson) {
    throw new LessonNotFoundError(lessonCode);
  }
  return lesson;
}

async function findInProgressPlay(
  db: Db,
  childId: number,
  lessonCode: string
): Promise<PlayRow | null> {
  // Lượt dở có thể ghim version cũ của bài — tra theo mã, không theo id hàng.
  const [row] = await db
    .select({ play: childLessonPlays })
    .from(childLessonPlays)
    .innerJoin(lessons, eq(lessons.id, childLessonPlays.lessonId))
    .where(
      and(
        eq(childLessonPlays.childProfileId, childId),
        eq(childLessonPlays.status, "in_progress"),
        eq(lessons.code, lessonCode)
      )
    )
    .limit(1);
  return row?.play ?? null;
}

/** Level chơi được của bài, theo `position` (`BR-CLF-01`). */
async function findLessonGameLevels(
  db: Db,
  lessonId: number
): Promise<GameLevelRow[]> {
  const rows = await db
    .select({ level: gameLevels })
    .from(lessonActivities)
    // `lesson_activities.activity_id` và `activities.ref_id` đều trỏ khoá thực thể
    // đa version (`entity_id`), không trỏ id hàng — `schema-content-taxonomy.md`
    // §7, `D-AE`. Mỗi neo lấy bản `published` mới nhất.
    .innerJoin(
      activities,
      and(
        eq(activities.entityId, lessonActivities.activityId),
        eq(activities.status, "published")
      )
    )
    .innerJoin(gameLevels, eq(gameLevels.entityId, activities.refId))
    .where(
      and(
        eq(lessonActivities.lessonId, lessonId),
        eq(activities.kind, "digital_game"),
        eq(activities.refType, "game_level"),
        eq(gameLevels.status, "published")
      )
    )
    .orderBy(asc(lessonActivities.position));
  return rows.map((row) => row.level);
}

async function planSteps(
  levels: readonly GameLevelRow[],
  caller: CallerIdentity
): Promise<ChildLessonStepSnapshot[]> {
  const introsByLevel = new Map<string, readonly string[]>();
  for (const level of levels) {
    const check = await checkLevelIntroRequired(level, caller);
    const queue = check.intro_required ? (check.intro_queue ?? []) : [];
    introsByLevel.set(
      level.code,
      queue.map((item) => item.intro_level_code)
    );
  }
  return buildStepPlan(
    levels.map((level) => level.code),
    (code) => introsByLevel.get(code) ?? []
  );
}

async function openNewPlay(
  db: Db,
  input: OpenLessonProgressInput,
  lesson: LessonRow
): Promise<PlayRow> {
  const levels = await findLessonGameLevels(db, lesson.id);
  if (levels.length === 0) {
    throw new LessonNotFoundError(input.lessonCode);
  }
  const steps = await planSteps(levels, input.caller);
  const [created] = await db
    .insert(childLessonPlays)
    .values({
      childProfileId: input.childId,
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      steps,
      // Cùng đồng hồ với `play_sessions.completed_at` (ghi bằng giờ app ở
      // `@mindkid/play` complete) — lấy `now()` của DB thì hai đồng hồ lệch
      // làm bước vừa chơi xong bị tính là chơi trước lượt (`BR-CLF-03`).
      startedAt: input.now ?? new Date(),
    })
    .onConflictDoNothing()
    .returning();
  if (created) {
    return created;
  }
  // Hai yêu cầu song song: unique một phần giữ đúng một lượt dở (`BR-CLF-04`).
  const existing = await findInProgressPlay(db, input.childId, lesson.code);
  if (!existing) {
    throw new LessonNotFoundError(input.lessonCode);
  }
  return existing;
}

async function loadLastCompletions(
  db: Db,
  childId: number,
  levelCodes: readonly string[]
): Promise<Map<string, Date>> {
  if (levelCodes.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({
      code: gameLevels.code,
      lastCompletedAt: max(playSessions.completedAt),
    })
    .from(playSessions)
    .innerJoin(gameLevels, eq(gameLevels.id, playSessions.gameLevelId))
    .where(
      and(
        eq(playSessions.childProfileId, childId),
        eq(playSessions.completionStatus, "completed"),
        eq(playSessions.isPreview, false),
        inArray(gameLevels.code, [...levelCodes])
      )
    )
    .groupBy(gameLevels.code);
  const result = new Map<string, Date>();
  for (const row of rows) {
    if (row.lastCompletedAt) {
      result.set(row.code, new Date(row.lastCompletedAt));
    }
  }
  return result;
}

async function loadLevelMeta(
  db: Db,
  levelCodes: readonly string[]
): Promise<Map<string, GameLevelRow>> {
  if (levelCodes.length === 0) {
    return new Map();
  }
  const rows = await db
    .select()
    .from(gameLevels)
    .where(
      and(
        inArray(gameLevels.code, [...levelCodes]),
        eq(gameLevels.status, "published")
      )
    );
  return new Map(rows.map((row) => [row.code, row]));
}

async function markCompleted(
  db: Db,
  play: PlayRow,
  now: Date
): Promise<boolean> {
  const updated = await db
    .update(childLessonPlays)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(
      and(
        eq(childLessonPlays.id, play.id),
        eq(childLessonPlays.status, "in_progress")
      )
    )
    .returning({ id: childLessonPlays.id });
  return updated.length > 0;
}

export async function openLessonProgress(
  db: Db,
  input: OpenLessonProgressInput
): Promise<LessonProgressView> {
  const lesson = await findPublishedLesson(db, input.lessonCode);
  const play =
    (await findInProgressPlay(db, input.childId, lesson.code)) ??
    (await openNewPlay(db, input, lesson));

  const levelCodes = play.steps.map((step) => step.level_code);
  const [lastCompletedAt, levelMeta] = await Promise.all([
    loadLastCompletions(db, input.childId, levelCodes),
    loadLevelMeta(db, levelCodes),
  ]);

  const allowed = new Set<string>(input.allowedTiers);
  const lockedLevelCodes = new Set(
    levelCodes.filter((code) => {
      const level = levelMeta.get(code);
      return level ? !allowed.has(level.accessTier) : false;
    })
  );

  const states = deriveStepStates({
    plan: play.steps,
    startedAt: play.startedAt,
    lastCompletedAt,
    lockedLevelCodes,
  });

  const justCompleted =
    states.allDone && (await markCompleted(db, play, input.now ?? new Date()));

  return {
    lesson: { code: lesson.code, title: lesson.title },
    play_uuid: play.uuid,
    steps: states.steps.map((step) => ({
      index: step.index,
      kind: step.kind,
      level_code: step.levelCode,
      title: levelMeta.get(step.levelCode)?.title ?? null,
      thumbnail_emoji: levelMeta.get(step.levelCode)?.thumbnailEmoji ?? null,
      done: step.done,
      locked: step.locked,
    })),
    current_step: states.currentStep,
    status: states.allDone ? "completed" : "in_progress",
    just_completed: justCompleted,
  };
}

export interface ListLessonsForChildInput {
  readonly childId: number;
  readonly birthYear: number;
  readonly limit: number;
  readonly now?: Date;
}

export interface LessonSuggestion {
  readonly code: string;
  readonly title: string;
  readonly estimated_minutes: number | null;
  readonly in_progress: boolean;
  readonly fits_age: boolean;
}

/**
 * Bài gợi ý cho sảnh trẻ: bài đang dở trước, rồi bài hợp tuổi. Tuổi chỉ để
 * **xếp**, không loại bài nào (`BR-CLF-07`, `BR-LFM-02`).
 */
export async function listLessonsForChild(
  db: Db,
  input: ListLessonsForChildInput
): Promise<LessonSuggestion[]> {
  const age = (input.now ?? new Date()).getFullYear() - input.birthYear;

  const inProgressRows = await db
    .select({ code: lessons.code })
    .from(childLessonPlays)
    .innerJoin(lessons, eq(lessons.id, childLessonPlays.lessonId))
    .where(
      and(
        eq(childLessonPlays.childProfileId, input.childId),
        eq(childLessonPlays.status, "in_progress")
      )
    );
  const inProgress = new Set(inProgressRows.map((row) => row.code));

  const published = await db
    .select({
      code: lessons.code,
      title: lessons.title,
      estimatedMinutes: lessons.estimatedMinutes,
      targetAgeMin: lessons.targetAgeMin,
      targetAgeMax: lessons.targetAgeMax,
    })
    .from(lessons)
    .where(eq(lessons.status, "published"))
    .orderBy(asc(lessons.code));

  const fitsAge = (min: number | null, max: number | null): boolean =>
    (min === null || min <= age) && (max === null || age <= max);

  const rank = (suggestion: LessonSuggestion): number => {
    if (suggestion.in_progress) {
      return 0;
    }
    return suggestion.fits_age ? 1 : 2;
  };

  return published
    .map((row) => ({
      code: row.code,
      title: row.title,
      estimated_minutes: row.estimatedMinutes,
      in_progress: inProgress.has(row.code),
      fits_age: fitsAge(row.targetAgeMin, row.targetAgeMax),
    }))
    .sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code))
    .slice(0, input.limit);
}
