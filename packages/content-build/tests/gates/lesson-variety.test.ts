import { describe, expect, it } from "vitest";
import {
  type ActivityItem,
  evaluateLessonVariety,
  formatLessonVarietyReport,
  type GameLevelItem,
  type LessonItem,
  loadLessonVarietyExemptionLedger,
  parseLessonVarietyExemptionLedger,
} from "./lesson-variety.ts";
import { loadLessonVarietyCorpus } from "./lesson-variety-corpus.ts";

describe("evaluateLessonVariety (BR-LTV-01..10)", () => {
  const mockActivities: ActivityItem[] = [
    {
      code: "ACT-0001",
      kind: "discussion",
      skillCodes: [],
    },
    {
      code: "ACT-0201",
      kind: "digital_game",
      refType: "game_level",
      refCode: "GL-C1-01",
      skillCodes: ["C1.CNT.01"],
    },
    {
      code: "ACT-0202",
      kind: "digital_game",
      refType: "game_level",
      refCode: "GL-C1-02",
      skillCodes: ["C1.CNT.01"],
    },
    {
      code: "ACT-0203",
      kind: "digital_game",
      refType: "game_level",
      refCode: "GL-C1-03",
      skillCodes: ["C1.CNT.01"],
    },
    {
      code: "ACT-0204",
      kind: "digital_game",
      refType: "game_level",
      refCode: "GL-C2-01",
      skillCodes: ["C2.GEO.01"],
    },
  ];

  const mockGameLevels: GameLevelItem[] = [
    {
      code: "GL-C1-01",
      templateCode: "GT-001",
      skillCodes: ["C1.CNT.01"],
      status: "published",
    },
    {
      code: "GL-C1-02",
      templateCode: "GT-002",
      skillCodes: ["C1.CNT.01"],
      status: "published",
    },
    {
      code: "GL-C1-03",
      templateCode: "GT-001", // Duplicate GT-001
      skillCodes: ["C1.CNT.01"],
      status: "published",
    },
    {
      code: "GL-C2-01",
      templateCode: "GT-005",
      skillCodes: ["C2.GEO.01"],
      status: "published",
    },
  ];

  it("BR-LTV-01: fails when published lesson has 0 digital game activities", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học không có game",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001"],
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels
    );
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.ruleId === "BR-LTV-01")).toBe(true);
  });

  it("BR-LTV-02: fails when 2 digital games have duplicate templateCode", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học trùng khuôn",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201", "ACT-0203"], // GL-C1-01 (GT-001) + GL-C1-03 (GT-001)
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels
    );
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.ruleId === "BR-LTV-02")).toBe(true);
  });

  it("BR-LTV-03: fails when competency has >= 2 templates but lesson only uses 1 template", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học chỉ có 1 game",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201"], // Only GT-001 while C1 has GT-001 and GT-002
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels
    );
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.ruleId === "BR-LTV-03")).toBe(true);
  });

  it("BR-LTV-04: fails when digital game skill does not match lesson skill cluster", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học lệch skill",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201", "ACT-0204"], // ACT-0204 is C2.GEO.01
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels
    );
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.ruleId === "BR-LTV-04")).toBe(true);
  });

  it("BR-LTV-05: ignores draft lessons", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học nháp",
        status: "draft",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001"], // 0 digital games but draft
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels
    );
    expect(report.passed).toBe(true);
    expect(report.totalLessons).toBe(0);
    expect(report.violations).toHaveLength(0);
  });

  it("BR-LTV-07: parses exemption ledger from spec §7.4 and validates single-template skill exemptions", () => {
    const ledgerMd = [
      "### 7.4 Sổ miễn trừ",
      "",
      "| Bài học | Kỹ năng | Khuôn duy nhất phục vụ | Ngày ghi |",
      "|---|---|---|---|",
      "| `LES-0099` | `C1.SUB.02` | `GT-016` | 2026-10-18 |",
    ].join("\n");
    const parsed = parseLessonVarietyExemptionLedger(ledgerMd);
    expect(parsed).toEqual([
      {
        lessonCode: "LES-0099",
        skillCode: "C1.SUB.02",
        templateCode: "GT-016",
        recordedAt: "2026-10-18",
      },
    ]);

    const levels: GameLevelItem[] = [
      ...mockGameLevels.slice(0, 2),
      {
        code: "GL-C1-99",
        templateCode: "GT-016",
        skillCodes: ["C1.SUB.02"],
        status: "published",
      },
    ];
    const activities: ActivityItem[] = [
      ...mockActivities.slice(0, 3),
      {
        code: "ACT-0299",
        kind: "digital_game",
        refType: "game_level",
        refCode: "GL-C1-99",
        skillCodes: ["C1.SUB.02"],
      },
    ];
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học chuẩn",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201", "ACT-0202"],
      },
      {
        code: "LES-0099",
        title: "Bài học kỹ năng đơn khuôn được miễn trừ",
        status: "published",
        skillCodes: ["C1.SUB.02"],
        activityCodes: ["ACT-0001", "ACT-0299"],
      },
    ];

    const validReport = evaluateLessonVariety(
      lessons,
      activities,
      levels,
      undefined,
      parsed
    );
    expect(validReport.passed).toBe(true);
    expect(validReport.exemptionsCount).toBe(1);

    // Negative case: claiming exemption on C1.CNT.01 which has 2 templates (GT-001, GT-002)
    const invalidReport = evaluateLessonVariety(
      lessons,
      activities,
      levels,
      undefined,
      [
        {
          lessonCode: "LES-0001",
          skillCode: "C1.CNT.01",
          templateCode: "GT-001",
        },
      ]
    );
    expect(invalidReport.passed).toBe(false);
    expect(invalidReport.violations.some((v) => v.ruleId === "BR-LTV-07")).toBe(
      true
    );
  });

  it("BR-LTV-09: fails when an active engine with published game levels is not referenced by any lesson", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học chuẩn C1",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201", "ACT-0202"],
      },
    ];
    const levelsWithUnreferencedEngine: GameLevelItem[] = [
      ...mockGameLevels.slice(0, 2),
      {
        code: "GL-C1-07",
        templateCode: "GT-007",
        skillCodes: ["C1.CNT.01"],
        status: "published",
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      levelsWithUnreferencedEngine
    );
    expect(report.passed).toBe(false);
    expect(report.unreferencedTemplates).toContain("GT-007");
    expect(
      report.violations.some(
        (v) => v.ruleId === "BR-LTV-09" && v.lessonCode === "GT-007"
      )
    ).toBe(true);
  });

  it("BR-LTV-10: emits non-blocking warning when a published game level has no lesson pointing to it", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học chuẩn",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201", "ACT-0202"], // uses GL-C1-01 and GL-C1-02, leaves GL-C1-03 orphan
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels.slice(0, 3)
    );
    expect(report.passed).toBe(true);
    expect(report.violations).toHaveLength(0);
    expect(report.orphanLevelCodes).toContain("GL-C1-03");
    expect(
      report.warnings.some(
        (w) =>
          w.ruleId === "BR-LTV-10" &&
          w.lessonCode === "GL-C1-03" &&
          w.type === "warning"
      )
    ).toBe(true);
  });

  it("passes when all rules BR-LTV-01..10 are satisfied", () => {
    const lessons: LessonItem[] = [
      {
        code: "LES-0001",
        title: "Bài học chuẩn đa dạng",
        status: "published",
        skillCodes: ["C1.CNT.01"],
        activityCodes: ["ACT-0001", "ACT-0201", "ACT-0202"], // GT-001 + GT-002
      },
    ];

    const report = evaluateLessonVariety(
      lessons,
      mockActivities,
      mockGameLevels.slice(0, 3)
    );
    expect(report.passed).toBe(true);
    expect(report.validLessons).toBe(1);
    expect(report.violations).toHaveLength(0);

    const formatted = formatLessonVarietyReport(report);
    expect(formatted).toContain(
      "Mọi bài học published đều đạt sàn đa dạng khuôn trò chơi"
    );
  });
});

describe("Cổng đa dạng khuôn trên corpus seed thật (BR-LTV-01..10)", () => {
  let corpusPromise: ReturnType<typeof loadLessonVarietyCorpus> | undefined;
  const getCorpus = () => {
    corpusPromise ??= loadLessonVarietyCorpus();
    return corpusPromise;
  };

  it("corpus seed không vi phạm quy định đa dạng khuôn", async () => {
    const corpus = await getCorpus();
    const ledger = loadLessonVarietyExemptionLedger();

    const result = evaluateLessonVariety(
      corpus.lessons,
      corpus.activities,
      corpus.gameLevels,
      undefined,
      ledger
    );

    expect(result.violations).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  }, 60_000);

  it("thật sự đọc được corpus — không xanh vì nạp rỗng", async () => {
    const corpus = await getCorpus();

    expect(corpus.lessons.length).toBeGreaterThan(0);
    expect(corpus.activities.length).toBeGreaterThan(0);
    expect(corpus.gameLevels.length).toBeGreaterThan(0);
  }, 60_000);
});
