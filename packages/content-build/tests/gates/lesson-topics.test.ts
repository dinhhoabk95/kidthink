import { describe, expect, it } from "vitest";
import { runLessonTopicsGate } from "#src/cli/check-lesson-topics";
import {
  evaluateLessonTopics,
  type LessonTopicsActivity,
  type LessonTopicsLesson,
  type LessonTopicsRule,
} from "#src/gates/lesson-topics";

const AFFINITIES: Record<string, readonly string[]> = {
  "C1.CNT.01": ["GT-001", "GT-002", "GT-003"],
  "C1.CMP.01": ["GT-004", "GT-005", "GT-006"],
  "C1.ONE.01": ["GT-007"],
};

function activity(
  code: string,
  template: string | undefined,
  skills: string[] = ["C1.CNT.01"]
): [string, LessonTopicsActivity] {
  return [code, { code, skill_codes: skills, template_code: template }];
}

const ACTIVITIES = new Map<string, LessonTopicsActivity>([
  activity("A1", "GT-001"),
  activity("A2", "GT-002"),
  activity("A3", "GT-003"),
  activity("A4", "GT-004", ["C1.CMP.01"]),
  activity("A5", "GT-005", ["C1.CMP.01"]),
  activity("OFF", undefined),
  activity("STRAY", "GT-001", ["C9.XXX.99"]),
]);

function lesson(
  overrides: Partial<LessonTopicsLesson> = {}
): LessonTopicsLesson {
  return {
    code: "LES-OK",
    skill_codes: ["C1.CNT.01", "C1.CMP.01"],
    activity_codes: ["A1", "A2", "A4", "OFF"],
    offscreen: false,
    topics: [
      {
        topic_code: "TP-A",
        skill_code: "C1.CNT.01",
        sequence_no: 1,
        templates: ["GT-001", "GT-002"],
        activity_codes: ["A1", "A2"],
      },
      {
        topic_code: "TP-B",
        skill_code: "C1.CMP.01",
        sequence_no: 2,
        templates: ["GT-004", "GT-005"],
        activity_codes: ["A4", "A5"],
      },
    ],
    ...overrides,
  };
}

function rulesOf(lessons: LessonTopicsLesson[]): LessonTopicsRule[] {
  return evaluateLessonTopics({
    lessons,
    activities: ACTIVITIES,
    affinities: AFFINITIES,
  }).violations.map((found) => found.rule);
}

const VARIED = lesson({
  code: "LES-VARIED",
  activity_codes: ["A1", "A2", "A4"],
});
const OTHER = lesson({
  code: "LES-OTHER",
  activity_codes: ["A1", "A2", "A3", "A4"],
  topics: [
    {
      topic_code: "TP-C",
      skill_code: "C1.CNT.01",
      sequence_no: 1,
      templates: ["GT-002", "GT-003"],
      activity_codes: ["A2", "A3"],
    },
    {
      topic_code: "TP-D",
      skill_code: "C1.CMP.01",
      sequence_no: 2,
      templates: ["GT-004", "GT-006"],
      activity_codes: ["A4"],
    },
  ],
});

describe("cổng bố cục bài (BR-LTC)", () => {
  it("ca xanh: bài 2 chủ đề × 2 khuôn hợp lệ, 3 khuôn trong bài, số hoạt động khác nhau", () => {
    expect(rulesOf([VARIED, OTHER])).toEqual([]);
  });

  it("ca âm BR-LTC-01: bài một chủ đề đỏ và nêu mã bài", () => {
    const one = lesson({
      code: "LES-ONE",
      topics: [lesson().topics[0] ?? fallbackTopic()],
    });
    const report = evaluateLessonTopics({
      lessons: [one, OTHER],
      activities: ACTIVITIES,
      affinities: AFFINITIES,
    });
    const hit = report.violations.find((found) => found.rule === "BR-LTC-01");
    expect(hit?.lesson_code).toBe("LES-ONE");
    expect(report.summary.lessons_with_one_topic).toBe(1);
  });

  it("đếm riêng bài chưa khai topics[] với bài khai đúng 1 chủ đề", () => {
    const report = evaluateLessonTopics({
      lessons: [lesson({ code: "LES-NONE", topics: [] }), OTHER],
      activities: ACTIVITIES,
      affinities: AFFINITIES,
    });
    expect(report.summary.lessons_without_topics).toBe(1);
    expect(report.summary.lessons_with_one_topic).toBe(0);
  });

  it("ca âm BR-LTC-03: chủ đề một khuôn khi ma trận có ≥2 thì đỏ", () => {
    const thin = lesson({
      code: "LES-THIN",
      topics: [
        {
          topic_code: "TP-T",
          skill_code: "C1.CNT.01",
          sequence_no: 1,
          templates: ["GT-001"],
          activity_codes: ["A1"],
        },
        lesson().topics[1] ?? fallbackTopic(),
      ],
    });
    expect(rulesOf([thin, OTHER])).toContain("BR-LTC-03");
  });

  it("nhánh miễn: kỹ năng chỉ có 1 khuôn hợp lệ thì chủ đề một khuôn không đỏ BR-LTC-03", () => {
    const single = lesson({
      code: "LES-SINGLE",
      topics: [
        {
          topic_code: "TP-S",
          skill_code: "C1.ONE.01",
          sequence_no: 1,
          templates: ["GT-007"],
          activity_codes: ["A1"],
        },
        lesson().topics[1] ?? fallbackTopic(),
      ],
    });
    expect(rulesOf([single, OTHER])).not.toContain("BR-LTC-03");
  });

  it("ca âm BR-LTC-04: khuôn ngoài ma trận đỏ và in cặp kỹ năng-khuôn", () => {
    const wrong = lesson({
      code: "LES-WRONG",
      topics: [
        {
          topic_code: "TP-W",
          skill_code: "C1.CNT.01",
          sequence_no: 1,
          templates: ["GT-001", "GT-004"],
          activity_codes: ["A1"],
        },
        lesson().topics[1] ?? fallbackTopic(),
      ],
    });
    const report = evaluateLessonTopics({
      lessons: [wrong, OTHER],
      activities: ACTIVITIES,
      affinities: AFFINITIES,
    });
    const hit = report.violations.find((found) => found.rule === "BR-LTC-04");
    expect(hit?.detail).toContain("C1.CNT.01-GT-004");
  });

  it("ca âm BR-LTC-05: mọi bài cùng số hoạt động thì đỏ", () => {
    const same = [
      lesson({ code: "LES-1", activity_codes: ["A1", "A2", "A4"] }),
      lesson({ code: "LES-2", activity_codes: ["A1", "A2", "A4"] }),
    ];
    expect(rulesOf(same)).toContain("BR-LTC-05");
    expect(rulesOf([VARIED, OTHER])).not.toContain("BR-LTC-05");
  });

  it("ca âm BR-LTC-06: hoạt động không giao kỹ năng với bài thì đỏ", () => {
    const stray = lesson({
      code: "LES-STRAY",
      activity_codes: ["A1", "A2", "A4", "STRAY"],
    });
    const report = evaluateLessonTopics({
      lessons: [stray, OTHER],
      activities: ACTIVITIES,
      affinities: AFFINITIES,
    });
    const hit = report.violations.find((found) => found.rule === "BR-LTC-06");
    expect(hit?.detail).toContain("STRAY");
  });

  it("ca âm BR-LTC-07: bài ôn dùng đúng bộ khuôn bài giới thiệu thì đỏ", () => {
    const first = lesson({
      code: "LES-INTRO",
      activity_codes: ["A1", "A2", "A4"],
    });
    const again = lesson({
      code: "LES-REVIEW",
      activity_codes: ["A1", "A2", "A3", "A4"],
    });
    const report = evaluateLessonTopics({
      lessons: [first, again],
      activities: ACTIVITIES,
      affinities: AFFINITIES,
    });
    const hit = report.violations.find((found) => found.rule === "BR-LTC-07");
    expect(hit?.lesson_code).toBe("LES-REVIEW");
    expect(hit?.detail).toContain("LES-INTRO");
  });

  it("ca âm BR-LTC-09: corpus đa dạng nhưng mỗi bài 1 khuôn vẫn đỏ", () => {
    const mono = [
      lesson({ code: "LES-M1", activity_codes: ["A1", "OFF"] }),
      lesson({ code: "LES-M2", activity_codes: ["A4", "A4", "OFF"] }),
    ];
    const hits = evaluateLessonTopics({
      lessons: mono,
      activities: ACTIVITIES,
      affinities: AFFINITIES,
    }).violations.filter((found) => found.rule === "BR-LTC-09");
    expect(hits.map((found) => found.lesson_code)).toEqual([
      "LES-M1",
      "LES-M2",
    ]);
  });

  it("bài offscreen được miễn sàn khuôn nhưng vẫn giữ sàn chủ đề", () => {
    const offscreen = lesson({
      code: "LES-OFF",
      offscreen: true,
      activity_codes: ["OFF"],
      topics: [lesson().topics[0] ?? fallbackTopic()],
    });
    const rules = rulesOf([offscreen, OTHER]);
    expect(rules).toContain("BR-LTC-01");
    expect(rules).not.toContain("BR-LTC-09");
  });
});

describe("cổng bố cục bài trên 126 bài hiện tại", () => {
  it("đỏ vì chưa có bài nào khai topics[]", () => {
    const err = console.error;
    const log = console.log;
    console.error = () => undefined;
    console.log = () => undefined;
    try {
      expect(runLessonTopicsGate()).toBe(1);
    } finally {
      console.error = err;
      console.log = log;
    }
  });
});

function fallbackTopic(): never {
  throw new Error("fixture thiếu chủ đề");
}
