import { describe, expect, it } from "vitest";
import { validateSeedBatchContent } from "../../src/index.ts";

describe("P0.6 Task 7 — BR-CLC-11 Seed Batch Checklist Gate", () => {
  it("Thành công: Lô seed hợp lệ vượt qua checklist", () => {
    const batch = [
      {
        entityType: "game_level" as const,
        payload: {
          accessTier: "free",
          skillIds: [1],
          learningObjectiveIds: [1],
          ageMin: 3,
          ageMax: 5,
          titleVi: "Tên game 1",
          contentPack: { hasCorrectAnswer: true, items: [{ isCorrect: true }] },
          difficulty: 1,
        },
      },
      {
        entityType: "game_level" as const,
        payload: {
          accessTier: "standard",
          skillIds: [2],
          learningObjectiveIds: [2],
          ageMin: 4,
          ageMax: 6,
          titleVi: "Tên game 2",
          contentPack: { hasCorrectAnswer: true, items: [{ isCorrect: true }] },
          difficulty: 2,
        },
      },
    ];

    const res = validateSeedBatchContent(batch);
    expect(res.ok).toBe(true);
  });

  it("BR-CLC-11: Một item trong batch thiếu learningObjectiveIds -> từ chối toàn bộ batch", () => {
    const batch = [
      {
        entityType: "game_level" as const,
        payload: {
          accessTier: "free",
          skillIds: [1],
          learningObjectiveIds: [1],
          ageMin: 3,
          ageMax: 5,
          titleVi: "Tên game 1",
          contentPack: { hasCorrectAnswer: true, items: [{ isCorrect: true }] },
          difficulty: 1,
        },
      },
      {
        entityType: "game_level" as const,
        payload: {
          accessTier: "standard",
          skillIds: [2],
          learningObjectiveIds: [], // THIẾU
          ageMin: 4,
          ageMax: 6,
          titleVi: "Tên game 2",
          contentPack: { hasCorrectAnswer: true, items: [{ isCorrect: true }] },
          difficulty: 2,
        },
      },
    ];

    const res = validateSeedBatchContent(batch);
    expect(res.ok).toBe(false);
    expect(res.failedIndex).toBe(1);
    expect(res.missing).toContain("learning_objectives_missing");
  });
});
