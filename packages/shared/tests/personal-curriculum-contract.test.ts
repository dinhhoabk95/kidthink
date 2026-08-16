import { describe, expect, it } from "vitest";
import {
  calculatePersonalCurriculumBalance,
  createPersonalCurriculumSchema,
  personalCurriculumItemInputSchema,
  resolvePersonalCurriculumNextStep,
  updatePersonalCurriculumMetaSchema,
} from "../src/personal-curriculum.ts";

describe("Personal Curriculum Contract & Business Rules Tests (BR-PCU-01..08)", () => {
  it("Scenario: BR-PCU-01 — rejects invalid item inputs with negative entity IDs or invalid weeks", () => {
    const invalidItem = {
      week_no: 0,
      session_no: 1,
      position: 1,
      entity_type: "lesson",
      entity_id: -5,
    };
    const parsed = personalCurriculumItemInputSchema.safeParse(invalidItem);
    expect(parsed.success).toBe(false);
  });

  it("Scenario: BR-PCU-01 & BR-PCU-08 — validates createPersonalCurriculumSchema and defaults", () => {
    const valid = createPersonalCurriculumSchema.safeParse({
      title: "Lộ trình ôn tập hè",
      age_min: 4,
      age_max: 5,
      duration_weeks: 4,
      sessions_per_week: 3,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.title).toBe("Lộ trình ôn tập hè");
      expect(valid.data.duration_weeks).toBe(4);
      expect(valid.data.sessions_per_week).toBe(3);
    }
  });

  it("Scenario: BR-PCU-05 — competency imbalance emits warning but does NOT block balance report", () => {
    // 70% items belong to C1
    const items = [
      {
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        code: "GL-C1-001",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 1,
        session_no: 2,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 102,
        code: "GL-C1-002",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 1,
        session_no: 3,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 103,
        code: "GL-C1-003",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 2,
        session_no: 1,
        position: 1,
        entity_type: "lesson" as const,
        entity_id: 201,
        code: "LES-C1-001",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 2,
        session_no: 2,
        position: 1,
        entity_type: "lesson" as const,
        entity_id: 202,
        code: "LES-C1-002",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 2,
        session_no: 3,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 203,
        code: "GL-C1-004",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 2,
        session_no: 3,
        position: 2,
        entity_type: "game_level" as const,
        entity_id: 204,
        code: "GL-C1-005",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 1,
        session_no: 1,
        position: 2,
        entity_type: "game_level" as const,
        entity_id: 301,
        code: "GL-C2-001",
        competency_code: "C2",
        difficulty: 1,
      },
      {
        week_no: 1,
        session_no: 2,
        position: 2,
        entity_type: "game_level" as const,
        entity_id: 302,
        code: "GL-C3-001",
        competency_code: "C3",
        difficulty: 1,
      },
      {
        week_no: 1,
        session_no: 3,
        position: 2,
        entity_type: "game_level" as const,
        entity_id: 303,
        code: "GL-C4-001",
        competency_code: "C4",
        difficulty: 1,
      },
    ];

    const result = calculatePersonalCurriculumBalance({
      duration_weeks: 2,
      sessions_per_week: 3,
      items,
    });

    expect(result.report.errors.length).toBe(0); // Errors must be 0 for personal curriculum
    expect(result.warnings.some((w) => w.includes("C1"))).toBe(true);
  });

  it("Scenario: BR-PCU-06 — empty week is marked with warning in balance report", () => {
    const items = [
      {
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        code: "GL-C1-001",
        competency_code: "C1",
        difficulty: 1,
      },
      {
        week_no: 3,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 102,
        code: "GL-C2-001",
        competency_code: "C2",
        difficulty: 1,
      },
    ];

    const result = calculatePersonalCurriculumBalance({
      duration_weeks: 3,
      sessions_per_week: 1,
      items,
    });

    expect(result.report.errors.length).toBe(0);
    expect(result.warnings.some((w) => w.includes("Tuần 2"))).toBe(true);
  });

  it("Scenario: BR-PCU-07 — archived item produces warning in balance report", () => {
    const items = [
      {
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        code: "GL-C1-001",
        competency_code: "C1",
        status: "archived",
        difficulty: 1,
      },
    ];

    const result = calculatePersonalCurriculumBalance({
      duration_weeks: 1,
      sessions_per_week: 1,
      items,
    });

    expect(result.report.errors.length).toBe(0);
    expect(
      result.warnings.some(
        (w) => w.includes("BR-PCU-07") || w.includes("archived")
      )
    ).toBe(true);
  });

  it("Scenario: BR-PCU-04 & BR-PCU-06 — resolvePersonalCurriculumNextStep skips empty weeks", () => {
    // Week 1: completed
    // Week 2: empty (0 items)
    // Week 3: not completed
    const items = [
      {
        id: 1,
        curriculum_id: 10,
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        code: "GL-C1-001",
        title: "Đếm táo",
        is_required: true,
        access_tier: "standard" as const,
      },
      {
        id: 2,
        curriculum_id: 10,
        week_no: 3,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 102,
        code: "GL-C2-001",
        title: "Xếp hình",
        is_required: true,
        access_tier: "standard" as const,
      },
    ];

    const completed = new Set([1]); // Week 1 item is completed
    const nextStep = resolvePersonalCurriculumNextStep({
      durationWeeks: 3,
      items,
      completedItemIds: completed,
      allowedTiers: ["free", "login", "standard"],
    });

    // Should skip week 2 and point directly to week 3
    expect(nextStep.week_no).toBe(3);
    expect(nextStep.session_no).toBe(1);
    expect(nextStep.item?.entity_code).toBe("GL-C2-001");
    expect(nextStep.is_completed).toBe(false);
  });

  it("Scenario: BR-PCU-04 & BR-PCU-07 — resolvePersonalCurriculumNextStep skips archived items", () => {
    // Week 1 has item 1 (archived) and item 2 (active)
    const items = [
      {
        id: 1,
        curriculum_id: 10,
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        code: "GL-C1-001",
        title: "Đếm táo (cũ)",
        is_required: true,
        access_tier: "standard" as const,
        status: "archived",
      },
      {
        id: 2,
        curriculum_id: 10,
        week_no: 1,
        session_no: 1,
        position: 2,
        entity_type: "game_level" as const,
        entity_id: 102,
        code: "GL-C1-002",
        title: "Đếm lê",
        is_required: true,
        access_tier: "standard" as const,
        status: "published",
      },
    ];

    const completed = new Set<number>();
    const nextStep = resolvePersonalCurriculumNextStep({
      durationWeeks: 1,
      items,
      completedItemIds: completed,
      allowedTiers: ["free", "login", "standard"],
    });

    // Skips item 1, targets item 2 directly
    expect(nextStep.week_no).toBe(1);
    expect(nextStep.item?.entity_code).toBe("GL-C1-002");
  });

  it("Scenario: BR-PCU-02 & BR-PCU-03 — updatePersonalCurriculumMetaSchema validates status transition and optimistic locking version", () => {
    const valid = updatePersonalCurriculumMetaSchema.safeParse({
      title: "Cập nhật tiêu đề",
      status: "ready",
      expected_version: 1,
    });
    expect(valid.success).toBe(true);

    const invalid = updatePersonalCurriculumMetaSchema.safeParse({
      status: "published", // "published" is prohibited for personal curriculum
    });
    expect(invalid.success).toBe(false);
  });
});
