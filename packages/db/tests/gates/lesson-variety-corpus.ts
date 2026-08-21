/**
 * Nạp corpus seed thật cho cổng đa dạng khuôn (BR-LTV-01..08).
 *
 * Đường DB (`--from-db` của CLI cũ) cố tình không port sang: cổng đo **contract
 * của corpus trong repo**, và một DB dev lệch schema chỉ làm cổng đỏ vì môi
 * trường. Muốn đối chiếu DB đã seed thì đó là việc của test tích hợp seeder.
 */
import type {
  ActivityItem,
  GameLevelItem,
  LessonItem,
} from "./lesson-variety.ts";

export interface LessonVarietyCorpus {
  readonly lessons: LessonItem[];
  readonly activities: ActivityItem[];
  readonly gameLevels: GameLevelItem[];
}

export async function loadLessonVarietyCorpus(): Promise<LessonVarietyCorpus> {
  const [{ ALL_SEED_LESSONS }, { ALL_SEED_ACTIVITIES }, { ALL_SEED_LEVELS }] =
    await Promise.all([
      import("../../src/seed-content/lessons/index.ts"),
      import("../../src/seed-content/activities/index.ts"),
      import("../../src/seed-content/index.ts"),
    ]);

  return {
    lessons: ALL_SEED_LESSONS.map((lesson) => ({
      code: lesson.header.code,
      title: lesson.header.title,
      status: "published",
      skillCodes: lesson.header.skill_codes,
      activityCodes: lesson.header.activity_codes,
    })),
    activities: ALL_SEED_ACTIVITIES.map((activity) => ({
      code: activity.header.code,
      kind: activity.header.activity_kind,
      refType: activity.header.ref_type,
      refCode: activity.header.ref_code,
      skillCodes: activity.header.skill_codes,
    })),
    gameLevels: ALL_SEED_LEVELS.map((level) => ({
      code: level.header.code,
      templateCode: level.header.template_code,
      skillCodes: level.header.skill_codes,
      status: "published",
    })),
  };
}
