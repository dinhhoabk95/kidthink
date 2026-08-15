import { describe, expect, it } from "vitest";
import {
  hasForbiddenPublicKeys,
  mapProgramTypeToShowcaseGroup,
  toProgramCardPublic,
  toProgramDetailPublic,
} from "./program-showcase.js";

describe("program-showcase projections (Task #61 / P3.8)", () => {
  it("maps program types to showcase groups correctly (D-NG)", () => {
    expect(mapProgramTypeToShowcaseGroup("age_based")).toBe("age");
    expect(mapProgramTypeToShowcaseGroup("journey")).toBe("journey");
    expect(mapProgramTypeToShowcaseGroup("competency")).toBe("competency");
    expect(mapProgramTypeToShowcaseGroup("topic")).toBe("topic");
    expect(mapProgramTypeToShowcaseGroup(undefined)).toBe("age");
    expect(mapProgramTypeToShowcaseGroup(null)).toBe("age");
  });

  it("projects ProgramCardPublic with allow-list only (BR-PSH-01, D-NF)", () => {
    const rawCurriculum = {
      id: 999, // should be dropped
      entityId: 888, // should be dropped
      code: "CUR-KID-4Y",
      titleVi: "Chương trình 4 tuổi",
      descriptionVi: "Lộ trình phát triển tư duy toán mầm non",
      programType: "age_based",
      targetAgeMin: 4,
      targetAgeMax: 5,
      durationWeeks: 42,
      sessionsPerWeek: 3,
      accessTier: "standard",
      seedBatchId: 101, // should be dropped
      createdByManagerId: 12, // should be dropped
    };

    const card = toProgramCardPublic(rawCurriculum);

    expect(card).toEqual({
      code: "CUR-KID-4Y",
      title: "Chương trình 4 tuổi",
      description: "Lộ trình phát triển tư duy toán mầm non",
      group: "age",
      target_age: { min: 4, max: 5 },
      duration_weeks: 42,
      sessions_per_week: 3,
      access_tier: "standard",
    });

    const audit = hasForbiddenPublicKeys(card);
    expect(audit.found).toBe(false);
  });

  it("projects ProgramDetailPublic with weeks 1-2 items and weeks 3+ summary (BR-PSH-02, D-NH)", () => {
    const rawCurriculum = {
      code: "CUR-JOURNEY-42W",
      titleVi: "Hành trình 42 tuần",
      descriptionVi: "Hành trình toàn diện",
      programType: "journey",
      targetAgeMin: 3,
      targetAgeMax: 6,
      durationWeeks: 4,
      sessionsPerWeek: 2,
      accessTier: "premium",
    };

    const rawWeeks = [
      { weekNo: 1, goal: "Khám phá hình khối và số đếm 1-3" },
      { weekNo: 2, goal: "So sánh kích thước và vị trí" },
      { weekNo: 3, goal: "Quy luật lặp lại đơn giản" },
      { weekNo: 4, goal: "Tổng kết chặng 1" },
    ];

    const rawItems = [
      {
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "lesson",
        entityId: 1001, // should not leak
        code: "LES-C1-001",
        titleVi: "Đếm hạt dẻ",
        estimatedMinutes: 20,
        accessTier: "free",
        content_pack: { answer: 3 }, // forbidden field in raw input
      },
      {
        weekNo: 1,
        sessionNo: 2,
        position: 1,
        entityType: "game_level",
        entityId: 2001,
        code: "GL-C2-001",
        titleVi: "Tìm hình tròn",
        estimatedMinutes: 10,
        accessTier: "free",
      },
      {
        weekNo: 2,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: 2002,
        code: "GL-C4-001",
        titleVi: "To hơn - Nhỏ hơn",
        estimatedMinutes: 10,
        accessTier: "login",
      },
      {
        weekNo: 3,
        sessionNo: 1,
        position: 1,
        entityType: "lesson",
        entityId: 1003,
        code: "LES-C3-001",
        titleVi: "Chuỗi màu sắc",
        estimatedMinutes: 20,
        accessTier: "standard",
      },
      {
        weekNo: 4,
        sessionNo: 1,
        position: 1,
        entityType: "lesson",
        entityId: 1004,
        code: "LES-C6-001",
        titleVi: "Thử thách chặng 1",
        estimatedMinutes: 20,
        accessTier: "premium",
      },
    ];

    const competencyDistribution = [
      { code: "C1", label: "Số & Đếm", share: 0.3 },
      { code: "C2", label: "Hình học & Không gian", share: 0.3 },
      { code: "C3", label: "Quy luật & Logic", share: 0.2 },
      { code: "C4", label: "Đo lường & So sánh", share: 0.2 },
    ];

    const detail = toProgramDetailPublic({
      curriculum: rawCurriculum,
      weeks: rawWeeks,
      items: rawItems,
      competencyDistribution,
    });

    expect(detail.code).toBe("CUR-JOURNEY-42W");
    expect(detail.group).toBe("journey");
    expect(detail.weeks).toHaveLength(4);

    // Week 1: detailed items
    expect(detail.weeks[0].week_no).toBe(1);
    expect(detail.weeks[0].goal).toBe("Khám phá hình khối và số đếm 1-3");
    expect(detail.weeks[0].items).toBeDefined();
    expect(detail.weeks[0].items).toHaveLength(2);
    expect(detail.weeks[0].items?.[0]).toEqual({
      entity_type: "lesson",
      code: "LES-C1-001",
      title: "Đếm hạt dẻ",
      estimated_minutes: 20,
      access_tier: "free",
    });

    // Week 2: detailed items
    expect(detail.weeks[1].week_no).toBe(2);
    expect(detail.weeks[1].items).toBeDefined();
    expect(detail.weeks[1].items).toHaveLength(1);

    // Week 3+: summary only, NO items field (BR-PSH-01, BR-PSH-02)
    expect(detail.weeks[2].week_no).toBe(3);
    expect(detail.weeks[2].goal).toBe("Quy luật lặp lại đơn giản");
    expect(detail.weeks[2].items).toBeUndefined();
    expect(detail.weeks[2].item_count).toBe(1);

    expect(detail.weeks[3].week_no).toBe(4);
    expect(detail.weeks[3].items).toBeUndefined();
    expect(detail.weeks[3].item_count).toBe(1);

    // Deep forbidden keys check (BR-PSH-03, D-NF)
    const audit = hasForbiddenPublicKeys(detail);
    expect(audit.found).toBe(false);
  });

  it("fails security scanner when nested forbidden keys are detected (BR-PSH-03)", () => {
    const maliciousPayload = {
      code: "CUR-TEST",
      weeks: [
        {
          week_no: 1,
          items: [
            {
              code: "GL-TEST-001",
              nested: {
                content_pack: { secret_answer: 42 },
              },
            },
          ],
        },
      ],
    };

    const audit = hasForbiddenPublicKeys(maliciousPayload);
    expect(audit.found).toBe(true);
    expect(audit.forbiddenKey).toBe("content_pack");
    expect(audit.path).toBe("weeks[0].items[0].nested.content_pack");
  });
});
