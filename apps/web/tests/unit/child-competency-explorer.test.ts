import { describe, expect, it } from "vitest";
import {
  buildCompetencyGames,
  computeAgeBounds,
  resolveTargetCompetency,
} from "#server/services/child-competency-explorer";

describe("resolveTargetCompetency (BR-CCE-01)", () => {
  it("trả về thông tin năng lực hợp lệ khi truyền mã chữ thường hoặc chữ hoa", () => {
    const c1 = resolveTargetCompetency("c1");
    expect(c1).not.toBeNull();
    expect(c1?.code).toBe("C1");
    expect(c1?.name).toBe("Tư duy toán học");
    expect(c1?.icon_path).toBe("/competencies/c1.svg");

    const c6 = resolveTargetCompetency("C6");
    expect(c6).not.toBeNull();
    expect(c6?.code).toBe("C6");
    expect(c6?.name).toBe("Tư duy điều hành");
  });

  it("trả về null khi mã năng lực không hợp lệ", () => {
    expect(resolveTargetCompetency("C7")).toBeNull();
    expect(resolveTargetCompetency("invalid")).toBeNull();
    expect(resolveTargetCompetency("")).toBeNull();
  });
});

describe("computeAgeBounds (BR-CCE-02)", () => {
  it("tính toán cận tuổi chuẩn theo age_band của trẻ", () => {
    expect(computeAgeBounds("3-4")).toEqual({ min: 3, max: 4 });
    expect(computeAgeBounds("4-5")).toEqual({ min: 4, max: 5 });
    expect(computeAgeBounds("5-6")).toEqual({ min: 5, max: 6 });
  });
});

describe("buildCompetencyGames (BR-CCE-03 & BR-CCE-04)", () => {
  it("ghép nối dữ liệu level và thống kê lượt chơi của trẻ", () => {
    const levels = [
      {
        id: 101,
        code: "GL-C1-CNT-TCNT-0001",
        title: "Tập đếm hoa quả",
        thumbnailEmoji: "🍎",
        themeId: "farm",
        accessTier: "free" as const,
      },
      {
        id: 102,
        code: "GL-C1-ADD-TCNT-0002",
        title: "Cộng số kẹo",
        thumbnailEmoji: null,
        themeId: "candy",
        accessTier: "premium" as const,
      },
    ];

    const statsMap = new Map([[101, { bestStars: 3, playCount: 5 }]]);

    const result = buildCompetencyGames(levels, statsMap);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      code: "GL-C1-CNT-TCNT-0001",
      title: "Tập đếm hoa quả",
      thumbnail_emoji: "🍎",
      theme_id: "farm",
      access_tier: "free",
      is_locked: false,
      best_stars: 3,
      play_count: 5,
    });

    expect(result[1]).toEqual({
      code: "GL-C1-ADD-TCNT-0002",
      title: "Cộng số kẹo",
      thumbnail_emoji: "🎮", // fallback emoji
      theme_id: "candy",
      access_tier: "premium",
      is_locked: true, // khoá trung tính
      best_stars: 0,
      play_count: 0,
    });
  });
});
