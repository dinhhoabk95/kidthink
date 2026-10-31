import { describe, expect, it } from "vitest";
import { validatePublishChecklist } from "#src/publish-checklist";

describe("P0.6 Task 3 — Checklist publish §7.3 & BR-CLC-09", () => {
  it("Thành công: game_level hợp lệ trả về ok = true, missing = []", () => {
    const validLevel = {
      accessTier: "standard",
      skillIds: [101],
      learningObjectiveIds: [201],
      ageMin: 3,
      ageMax: 5,
      title: "Đếm số trong phạm vi 5",
      contentPack: {
        hasCorrectAnswer: true,
        items: [{ id: 1, isCorrect: true }],
      },
      difficulty: 2,
    };

    const res = validatePublishChecklist("game_level", validLevel);
    expect(res.ok).toBe(true);
    expect(res.missing).toHaveLength(0);
  });

  it("BR-CLC-09: content_pack không có đáp án đúng -> missing chứa no_correct_answer", () => {
    const invalidLevel = {
      accessTier: "standard",
      skillIds: [101],
      learningObjectiveIds: [201],
      ageMin: 3,
      ageMax: 5,
      title: "Đếm số",
      contentPack: {
        hasCorrectAnswer: false,
        items: [{ id: 1, isCorrect: false }],
      },
      difficulty: 2,
    };

    const res = validatePublishChecklist("game_level", invalidLevel);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("no_correct_answer");
  });

  it("Thiếu thông tin chung (access_tier, title, skillIds) -> ok = false", () => {
    const incomplete = {
      ageMin: 3,
      ageMax: 5,
    };

    const res = validatePublishChecklist("game_level", incomplete);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("access_tier_missing");
    expect(res.missing).toContain("skills_missing");
    expect(res.missing).toContain("learning_objectives_missing");
    expect(res.missing).toContain("title_empty");
  });

  describe("WP167.5 — BR-RSM-* Round Set Rules via publish-checklist", () => {
    const baseLevel = {
      accessTier: "standard",
      skillIds: [101],
      learningObjectiveIds: [201],
      ageMin: 3,
      ageMax: 4,
      title: "Level kiểm tra round set",
      difficulty: 1,
    };

    it("BR-RSM-09: Level 1 round hợp lệ qua publish checklist", () => {
      const level = {
        ...baseLevel,
        rounds: [
          {
            round_index: 0,
            instruction: "Đếm số",
            content_pack: {
              hasCorrectAnswer: true,
              items: [{ id: 1, isCorrect: true }],
            },
            difficulty_params: { count: 3 },
            difficulty: 1,
          },
        ],
      };
      const res = validatePublishChecklist("game_level", level);
      expect(res.ok).toBe(true);
      expect(res.missing).toHaveLength(0);
    });

    it("BR-RSM-03: Round set vượt trần band 3-4 (7 rounds) bị chặn", () => {
      const rounds = Array.from({ length: 7 }, (_, i) => ({
        round_index: i,
        instruction: `Vòng ${i + 1}`,
        content_pack: { items: [1, 2] },
        difficulty_params: { count: 2 },
        difficulty: 1,
      }));
      const level = {
        ...baseLevel,
        rounds,
      };
      const res = validatePublishChecklist("game_level", level);
      expect(res.ok).toBe(false);
      expect(res.missing.some((m) => m.includes("br-rsm-03"))).toBe(true);
    });

    it("BR-RSM-05: Round set leo thang 2 chiều cùng lúc bị chặn", () => {
      const level = {
        ...baseLevel,
        rounds: [
          {
            round_index: 0,
            instruction: "Vòng 1",
            content_pack: { items: [1, 2] },
            difficulty_params: { count: 2, distractor_count: 1 },
            difficulty: 1,
          },
          {
            round_index: 1,
            instruction: "Vòng 2",
            content_pack: { items: [1, 2, 3] },
            difficulty_params: { count: 3, distractor_count: 2 }, // cả count và distractor_count đều tăng!
            difficulty: 2,
          },
        ],
      };
      const res = validatePublishChecklist("game_level", level);
      expect(res.ok).toBe(false);
      expect(res.missing.some((m) => m.includes("br-rsm-05"))).toBe(true);
    });
  });
});
