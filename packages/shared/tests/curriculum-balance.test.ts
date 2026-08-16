import { describe, expect, it } from "vitest";
import {
  type CurriculumItemMetadata,
  type CurriculumValidationInput,
  type CurriculumWeekMetadata,
  validateCurriculumModel,
} from "../src/curriculum-model.js";

describe("P3.3 Curriculum Balance Engine & Rules (BR-CRM-01..11, BR-CBD-01..08, D-LS..D-LZ)", () => {
  function createBaseWeekItems(
    weekNo: number,
    competencies: string[] = ["C1", "C2", "C3"]
  ): CurriculumItemMetadata[] {
    return [
      {
        week_no: weekNo,
        session_no: 1,
        position: 1,
        entity_type: "lesson",
        entity_id: weekNo * 10 + 1,
        code: `LES-${competencies[0]}-00${weekNo}`,
        competency_code: competencies[0],
        skill_codes: [`${competencies[0]}.SKL.01`],
        difficulty: 1,
        estimated_minutes: 20,
        status: "published",
        is_offline: false,
      },
      {
        week_no: weekNo,
        session_no: 2,
        position: 1,
        entity_type: "game_level",
        entity_id: weekNo * 10 + 2,
        code: `GL-${competencies[1]}-00${weekNo}`,
        competency_code: competencies[1],
        skill_codes: [`${competencies[1]}.SKL.01`],
        difficulty: 2,
        estimated_minutes: 10,
        status: "published",
        is_offline: false,
      },
      {
        week_no: weekNo,
        session_no: 3,
        position: 1,
        entity_type: "lesson",
        entity_id: weekNo * 10 + 3,
        code: `LES-${competencies[2]}-00${weekNo}`,
        competency_code: competencies[2],
        skill_codes: [`${competencies[2]}.SKL.01`],
        difficulty: 2,
        estimated_minutes: 15,
        status: "published",
        is_offline: true, // Offline activity for BR-CRM-05
      },
    ];
  }

  function createValidCurriculum(durationWeeks = 8): CurriculumValidationInput {
    const items: CurriculumItemMetadata[] = [];
    const weeks: CurriculumWeekMetadata[] = [];
    const compRotation = [
      ["C1", "C2", "C3"],
      ["C2", "C3", "C4"],
      ["C3", "C4", "C5"],
      ["C4", "C5", "C6"],
      ["C5", "C6", "C1"],
      ["C6", "C1", "C2"],
      ["C1", "C2", "C3"],
      ["C4", "C5", "C6"],
    ];

    for (let w = 1; w <= durationWeeks; w++) {
      const comps = compRotation[(w - 1) % compRotation.length];
      const weekItems = createBaseWeekItems(w, comps);
      // Ensure difficulty slope
      for (const item of weekItems) {
        item.difficulty = Math.min(5, 1 + Math.floor(w / 2));
      }
      items.push(...weekItems);
      weeks.push({
        week_no: w,
        goal: `Mục tiêu phát triển tư duy tuần ${w}`,
      });
    }

    return {
      code: "CUR-BE3",
      program_type: "age_based",
      duration_weeks: durationWeeks,
      sessions_per_week: 3,
      title: "Chương trình mẫu",
      status: "published",
      items,
      weeks,
    };
  }

  it("validates a fully balanced 8-week curriculum with 0 errors (BR-CBD-05, D-LZ)", () => {
    const input = createValidCurriculum(8);
    const result = validateCurriculumModel(input);
    expect(result.errors).toHaveLength(0);
    expect(result.ok).toBe(true);
    expect(result.report.is_balanced).toBe(true);
  });

  it("BR-CBD-02: detects empty week as blocking error", () => {
    const input = createValidCurriculum(8);
    // Remove all items for week 4
    input.items = input.items.filter((i) => i.week_no !== 4);

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("BR-CBD-02") && e.includes("Tuần 4"))
    ).toBe(true);
  });

  it("BR-CBD-04: detects weeks with fewer than 3 activities as blocking error", () => {
    const input = createValidCurriculum(8);
    // Leave only 2 items in week 2
    input.items = input.items.filter(
      (i) => !(i.week_no === 2 && i.session_no === 3)
    );

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("BR-CBD-04") && e.includes("Tuần 2"))
    ).toBe(true);
  });

  it("BR-CRM-10: detects missing week goal as blocking error", () => {
    const input = createValidCurriculum(8);
    input.weeks = input.weeks?.filter((w) => w.week_no !== 3);

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("BR-CRM-10") && e.includes("Tuần 3"))
    ).toBe(true);
  });

  it("BR-CRM-07: detects single competency exceeding 40% share as blocking error", () => {
    const input = createValidCurriculum(8);
    // Set 60% of items to C1
    for (let i = 0; i < input.items.length * 0.6; i++) {
      input.items[i].competency_code = "C1";
    }

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("BR-CRM-07") && e.includes("C1"))
    ).toBe(true);
  });

  it("BR-CRM-08: generates warning when age_based curriculum misses any of the 6 competencies", () => {
    const input = createValidCurriculum(8);
    // Remove all C6 items
    for (const item of input.items) {
      if (item.competency_code === "C6") {
        item.competency_code = "C1";
      }
    }

    const result = validateCurriculumModel(input);
    expect(
      result.warnings.some((w) => w.includes("BR-CRM-08") && w.includes("C6"))
    ).toBe(true);
  });

  it("BR-CRM-09: detects repeated item within 4-week window as blocking error (measured on item)", () => {
    const input = createValidCurriculum(8);
    // Repeat item 101 in week 1 and week 3
    input.items.push({
      week_no: 3,
      session_no: 1,
      position: 2,
      entity_type: "lesson",
      entity_id: 11, // Same entity_id as week 1 session 1
      code: "LES-C1-001",
      competency_code: "C1",
      status: "published",
    });

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("BR-CRM-09"))).toBe(true);
  });

  it("BR-CRM-01 & BR-CBD-06: detects prerequisite violations (skill appearing before prerequisite)", () => {
    const input = createValidCurriculum(8);
    input.skill_prerequisites_map = {
      "C1.SKL.02": ["C1.SKL.01"],
    };

    // Place C1.SKL.02 in week 1 and C1.SKL.01 in week 4
    input.items[0].skill_codes = ["C1.SKL.02"];
    input.items[9].skill_codes = ["C1.SKL.01"];

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (e) => e.includes("BR-CRM-01") || e.includes("BR-CBD-06")
      )
    ).toBe(true);
  });

  it("BR-CRM-11 & D-LY: detects new skill introduced in last 3 weeks as blocking error", () => {
    const input = createValidCurriculum(8);
    // Introduce brand new skill in week 7 (last 3 weeks: weeks 6, 7, 8)
    input.items.push({
      week_no: 7,
      session_no: 2,
      position: 2,
      entity_type: "lesson",
      entity_id: 999,
      code: "LES-NEW-SKL",
      competency_code: "C2",
      skill_codes: ["C2.BRAND_NEW.01"],
      status: "published",
    });

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (e) => e.includes("BR-CRM-11") && e.includes("C2.BRAND_NEW.01")
      )
    ).toBe(true);
  });

  it("BR-CRM-06: detects week 1 average difficulty harder than overall average as blocking error", () => {
    const input = createValidCurriculum(8);
    // Make week 1 difficulty 5, and rest difficulty 1
    for (const item of input.items) {
      if (item.week_no === 1) {
        item.difficulty = 5;
      } else {
        item.difficulty = 1;
      }
    }

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("BR-CRM-06"))).toBe(true);
  });

  it("BR-CRM-05: warns when a week has no off-screen activity", () => {
    const input = createValidCurriculum(8);
    // Set all items in week 3 to online/digital
    for (const item of input.items) {
      if (item.week_no === 3) {
        item.is_offline = false;
      }
    }

    const result = validateCurriculumModel(input);
    expect(
      result.warnings.some(
        (w) => w.includes("BR-CRM-05") && w.includes("Tuần 3")
      )
    ).toBe(true);
  });

  it("BR-CBD-03: detects unpublished items when validating published curriculum", () => {
    const input = createValidCurriculum(8);
    input.items[0].status = "draft";

    const result = validateCurriculumModel(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("BR-CBD-03"))).toBe(true);
  });
});
