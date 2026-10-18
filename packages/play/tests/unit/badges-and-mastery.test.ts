import { describe, expect, it } from "vitest";
import {
  cleanEventPayload,
  computeNewChildBadges,
  evaluateStrandCompletion,
  evaluateWeekCurriculumCompletion,
} from "#src/index";

describe("Progress, Mastery & Badges Unit Tests (BR-PRG-04, BR-PRG-06, BR-PRG-07, §7.2)", () => {
  it("Scenario: BR-PRG-06 — server strips client-injected p_learn, best_p_learn, ema_correct and score from telemetry event payloads", () => {
    const cleanedGameCompleted = cleanEventPayload("game_completed", {
      duration_ms: 12_000,
      rounds_total: 3,
      rounds_correct: 2,
      p_learn: 0.99,
      best_p_learn: 0.99,
      ema_correct: 0.99,
      score: 100,
    });

    expect(cleanedGameCompleted).toEqual({
      duration_ms: 12_000,
      rounds_total: 3,
      rounds_correct: 2,
    });
    expect(cleanedGameCompleted).not.toHaveProperty("p_learn");
    expect(cleanedGameCompleted).not.toHaveProperty("best_p_learn");
    expect(cleanedGameCompleted).not.toHaveProperty("ema_correct");
    expect(cleanedGameCompleted).not.toHaveProperty("score");
  });

  it("Scenario: §7.2 STRAND_FIRST_COMPLETE — evaluateStrandCompletion requires all skills in at least one strand to reach mastery threshold", () => {
    const strandSkills = [
      { id: 101, strandId: 10 },
      { id: 102, strandId: 10 },
      { id: 201, strandId: 20 },
    ];

    expect(
      evaluateStrandCompletion({
        masteredSkillIds: new Set([101]),
        strandSkills,
      })
    ).toBe(false);

    expect(
      evaluateStrandCompletion({
        masteredSkillIds: new Set([101, 102]),
        strandSkills,
      })
    ).toBe(true);
  });

  it("Scenario: §7.2 WEEK_CURRICULUM_COMPLETE — evaluateWeekCurriculumCompletion detects completed mandatory items in any enrolled week", () => {
    const enrollments = [{ id: 1, curriculumId: 50 }];
    const items = [
      { id: 1001, curriculumId: 50, weekNo: 1, isRequired: true },
      { id: 1002, curriculumId: 50, weekNo: 1, isRequired: true },
      { id: 1003, curriculumId: 50, weekNo: 1, isRequired: false },
    ];

    expect(
      evaluateWeekCurriculumCompletion({
        enrollments,
        items,
        completedProgress: [{ enrollmentId: 1, curriculumItemId: 1001 }],
      })
    ).toBe(false);

    expect(
      evaluateWeekCurriculumCompletion({
        enrollments,
        items,
        completedProgress: [
          { enrollmentId: 1, curriculumItemId: 1001 },
          { enrollmentId: 1, curriculumItemId: 1002 },
        ],
      })
    ).toBe(true);
  });

  it("Scenario: §7.2 & BR-PRG-04 — computeNewChildBadges awards PLAY_DAYS_5, STRAND_FIRST_COMPLETE, WEEK_CURRICULUM_COMPLETE idempotently", () => {
    const firstPass = computeNewChildBadges({
      distinctPlayDays: 5,
      masteredSkillIds: new Set([101, 102]),
      strandSkills: [
        { id: 101, strandId: 10 },
        { id: 102, strandId: 10 },
      ],
      enrollments: [{ id: 1, curriculumId: 50 }],
      items: [{ id: 1001, curriculumId: 50, weekNo: 1, isRequired: true }],
      completedProgress: [{ enrollmentId: 1, curriculumItemId: 1001 }],
      existingBadgeCodes: new Set(),
    });

    expect(firstPass).toEqual([
      "PLAY_DAYS_5",
      "STRAND_FIRST_COMPLETE",
      "WEEK_CURRICULUM_COMPLETE",
    ]);

    const secondPass = computeNewChildBadges({
      distinctPlayDays: 6,
      masteredSkillIds: new Set([101, 102]),
      strandSkills: [
        { id: 101, strandId: 10 },
        { id: 102, strandId: 10 },
      ],
      enrollments: [{ id: 1, curriculumId: 50 }],
      items: [{ id: 1001, curriculumId: 50, weekNo: 1, isRequired: true }],
      completedProgress: [{ enrollmentId: 1, curriculumItemId: 1001 }],
      existingBadgeCodes: new Set(firstPass),
    });

    expect(secondPass).toEqual([]);
  });
});
