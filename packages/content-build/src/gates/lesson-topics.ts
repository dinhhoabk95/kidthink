/**
 * Cổng bố cục bài học: số chủ đề, số khuôn mỗi chủ đề, khuôn nằm trong ma trận
 * tương hợp, kỹ năng hoạt động giao với bài, ôn đổi khuôn, đa dạng khuôn đo
 * trong từng bài.
 *
 * Hàm thuần: nhận dữ liệu đã phẳng, không đọc kho. Khuôn của một bài được đo
 * từ trò chơi số thật mà bài gọi, không từ phần bài tự khai.
 */

import type { LessonTopic } from "@mindkid/content";

export const MIN_TOPICS_PER_LESSON = 2;
export const MIN_TEMPLATES_PER_TOPIC = 2;
export const MIN_TEMPLATES_PER_LESSON = 3;

export type LessonTopicsRule =
  | "BR-LTC-01"
  | "BR-LTC-03"
  | "BR-LTC-04"
  | "BR-LTC-05"
  | "BR-LTC-06"
  | "BR-LTC-07"
  | "BR-LTC-09";

export interface LessonTopicsLesson {
  readonly code: string;
  readonly skill_codes: readonly string[];
  readonly activity_codes: readonly string[];
  readonly topics: readonly LessonTopic[];
  readonly offscreen: boolean;
}

export interface LessonTopicsActivity {
  readonly code: string;
  readonly skill_codes: readonly string[];
  readonly template_code: string | undefined;
}

export interface LessonTopicsViolation {
  readonly rule: LessonTopicsRule;
  readonly lesson_code: string;
  readonly detail: string;
}

export interface LessonTopicsSummary {
  readonly lessons: number;
  readonly lessons_without_topics: number;
  readonly lessons_with_one_topic: number;
  readonly activity_count_min: number;
  readonly activity_count_max: number;
  readonly lesson_template_count_min: number;
  readonly lesson_template_count_max: number;
}

export interface LessonTopicsReport {
  readonly violations: LessonTopicsViolation[];
  readonly summary: LessonTopicsSummary;
}

export interface LessonTopicsInput {
  readonly lessons: readonly LessonTopicsLesson[];
  readonly activities: ReadonlyMap<string, LessonTopicsActivity>;
  readonly affinities: Readonly<Record<string, readonly string[]>>;
}

export const CORPUS_SCOPE = "<corpus>";

function violation(
  rule: LessonTopicsRule,
  lessonCode: string,
  detail: string
): LessonTopicsViolation {
  return { rule, lesson_code: lessonCode, detail };
}

function distinct(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function checkTopicCount(lesson: LessonTopicsLesson): LessonTopicsViolation[] {
  if (lesson.topics.length >= MIN_TOPICS_PER_LESSON) {
    return [];
  }
  return [
    violation(
      "BR-LTC-01",
      lesson.code,
      `${lesson.topics.length} chủ đề, sàn ${MIN_TOPICS_PER_LESSON}`
    ),
  ];
}

function checkTopicTemplates(
  lesson: LessonTopicsLesson,
  topic: LessonTopic,
  allowed: readonly string[] | undefined
): LessonTopicsViolation[] {
  if (allowed === undefined) {
    return [
      violation(
        "BR-LTC-04",
        lesson.code,
        `chủ đề ${topic.topic_code}: kỹ năng ${topic.skill_code} không có trong ma trận tương hợp`
      ),
    ];
  }
  const found: LessonTopicsViolation[] = [];
  for (const template of distinct(topic.templates)) {
    if (!allowed.includes(template)) {
      found.push(
        violation(
          "BR-LTC-04",
          lesson.code,
          `chủ đề ${topic.topic_code}: cặp ${topic.skill_code}-${template} ngoài ma trận`
        )
      );
    }
  }
  const floorApplies =
    !lesson.offscreen && allowed.length >= MIN_TEMPLATES_PER_TOPIC;
  if (
    floorApplies &&
    distinct(topic.templates).length < MIN_TEMPLATES_PER_TOPIC
  ) {
    found.push(
      violation(
        "BR-LTC-03",
        lesson.code,
        `chủ đề ${topic.topic_code}: ${distinct(topic.templates).length} khuôn, sàn ${MIN_TEMPLATES_PER_TOPIC}`
      )
    );
  }
  return found;
}

function checkTopics(
  lesson: LessonTopicsLesson,
  affinities: LessonTopicsInput["affinities"]
): LessonTopicsViolation[] {
  return lesson.topics.flatMap((topic) =>
    checkTopicTemplates(lesson, topic, affinities[topic.skill_code])
  );
}

function checkActivitySkills(
  lesson: LessonTopicsLesson,
  activities: LessonTopicsInput["activities"]
): LessonTopicsViolation[] {
  const found: LessonTopicsViolation[] = [];
  for (const code of lesson.activity_codes) {
    const activity = activities.get(code);
    if (!activity) {
      found.push(
        violation("BR-LTC-06", lesson.code, `hoạt động ${code} không tồn tại`)
      );
    } else if (
      !activity.skill_codes.some((skill) => lesson.skill_codes.includes(skill))
    ) {
      found.push(
        violation(
          "BR-LTC-06",
          lesson.code,
          `hoạt động ${code} không giao kỹ năng nào với bài`
        )
      );
    }
  }
  return found;
}

export function lessonTemplates(
  lesson: LessonTopicsLesson,
  activities: LessonTopicsInput["activities"]
): string[] {
  const templates: string[] = [];
  for (const code of lesson.activity_codes) {
    const template = activities.get(code)?.template_code;
    if (template !== undefined) {
      templates.push(template);
    }
  }
  return distinct(templates);
}

function checkLessonVariety(
  lesson: LessonTopicsLesson,
  activities: LessonTopicsInput["activities"]
): LessonTopicsViolation[] {
  if (lesson.offscreen) {
    return [];
  }
  const count = lessonTemplates(lesson, activities).length;
  if (count >= MIN_TEMPLATES_PER_LESSON) {
    return [];
  }
  return [
    violation(
      "BR-LTC-09",
      lesson.code,
      `${count} khuôn riêng biệt trong bài, sàn ${MIN_TEMPLATES_PER_LESSON}`
    ),
  ];
}

function templateSetKey(topic: LessonTopic): string {
  return distinct(topic.templates).sort().join("+");
}

function checkReviewChangesTemplates(
  lessons: readonly LessonTopicsLesson[]
): LessonTopicsViolation[] {
  const seen = new Map<string, { lesson: string; key: string }[]>();
  for (const lesson of lessons) {
    for (const topic of lesson.topics) {
      const list = seen.get(topic.topic_code) ?? [];
      list.push({ lesson: lesson.code, key: templateSetKey(topic) });
      seen.set(topic.topic_code, list);
    }
  }
  const found: LessonTopicsViolation[] = [];
  for (const [topicCode, uses] of seen) {
    for (const [index, later] of uses.entries()) {
      const clash = uses
        .slice(0, index)
        .find((earlier) => earlier.key === later.key);
      if (clash) {
        found.push(
          violation(
            "BR-LTC-07",
            later.lesson,
            `chủ đề ${topicCode}: cùng bộ khuôn ${later.key} với bài ${clash.lesson}`
          )
        );
      }
    }
  }
  return found;
}

function checkFixedActivityCount(
  lessons: readonly LessonTopicsLesson[]
): LessonTopicsViolation[] {
  if (lessons.length < 2) {
    return [];
  }
  const counts = lessons.map((lesson) => lesson.activity_codes.length);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  if (min !== max) {
    return [];
  }
  return [
    violation(
      "BR-LTC-05",
      CORPUS_SCOPE,
      `mọi bài đều có đúng ${min} hoạt động — số cố định`
    ),
  ];
}

function range(values: readonly number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }
  return { min: Math.min(...values), max: Math.max(...values) };
}

function summarize(input: LessonTopicsInput): LessonTopicsSummary {
  const activityCounts = range(
    input.lessons.map((lesson) => lesson.activity_codes.length)
  );
  const templateCounts = range(
    input.lessons.map(
      (lesson) => lessonTemplates(lesson, input.activities).length
    )
  );
  return {
    lessons: input.lessons.length,
    lessons_without_topics: input.lessons.filter(
      (lesson) => lesson.topics.length === 0
    ).length,
    lessons_with_one_topic: input.lessons.filter(
      (lesson) => lesson.topics.length === 1
    ).length,
    activity_count_min: activityCounts.min,
    activity_count_max: activityCounts.max,
    lesson_template_count_min: templateCounts.min,
    lesson_template_count_max: templateCounts.max,
  };
}

export function evaluateLessonTopics(
  input: LessonTopicsInput
): LessonTopicsReport {
  const perLesson = input.lessons.flatMap((lesson) => [
    ...checkTopicCount(lesson),
    ...checkTopics(lesson, input.affinities),
    ...checkActivitySkills(lesson, input.activities),
    ...checkLessonVariety(lesson, input.activities),
  ]);
  return {
    violations: [
      ...perLesson,
      ...checkReviewChangesTemplates(input.lessons),
      ...checkFixedActivityCount(input.lessons),
    ],
    summary: summarize(input),
  };
}
