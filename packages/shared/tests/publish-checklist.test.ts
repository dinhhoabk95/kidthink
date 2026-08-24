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

  it("Lesson: thiếu hoạt động -> missing chứa activities_missing", () => {
    const lesson = {
      accessTier: "free",
      skillIds: [1],
      learningObjectiveIds: [2],
      ageMin: 4,
      ageMax: 6,
      title: "Bài học hình khối",
      activities: [],
      estimatedMinutes: 20,
      guide: "Hướng dẫn bài học",
    };

    const res = validatePublishChecklist("lesson", lesson);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("activities_missing");
  });

  it("Activity: valid activity returns ok = true", () => {
    const validActivity = {
      accessTier: "standard",
      skillIds: [101],
      learningObjectiveIds: [201],
      skills: [{ code: "C1.NUM.01", age_min: 3, age_max: 5 }],
      title: "Đếm hoa quả trong rổ",
      kind: "manipulative",
      instruction:
        'Chuẩn bị 5 quả táo. "Bé hãy đếm xem có mấy quả táo nào!". Dễ hơn: đếm 3 quả. Khó hơn: đếm 7 quả.',
      materials: "5 quả táo hoặc đồ chơi",
      estimatedMinutes: 10,
    };

    const res = validatePublishChecklist("activity", validActivity);
    expect(res.ok).toBe(true);
    expect(res.missing).toHaveLength(0);
  });

  it("Activity: digital_game with unpublished level ref fails", () => {
    const invalidActivity = {
      accessTier: "standard",
      skillIds: [101],
      learningObjectiveIds: [201],
      skills: [{ code: "C1.NUM.01", age_min: 3, age_max: 5 }],
      title: "Chơi game đếm táo",
      kind: "digital_game",
      refType: "game_level",
      refId: 123,
      refStatus: "draft",
      instruction:
        'Mở game. "Bé hãy bấm vào các quả táo nhé!". Dễ hơn: mức 1. Khó hơn: mức 2.',
      estimatedMinutes: 5,
    };

    const res = validatePublishChecklist("activity", invalidActivity);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("referenced_game_level_not_published");
  });
});
