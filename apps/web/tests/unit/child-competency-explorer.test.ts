import { describe, expect, it } from "vitest";
import {
  buildCompetencyGames,
  computeAgeBounds,
  fitsAgeBounds,
  resolveTargetCompetency,
  sortCompetencyLevels,
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

describe("computeAgeBounds & sortCompetencyLevels (BR-CCE-02)", () => {
  it("tính toán cận tuổi chuẩn theo age_band của trẻ", () => {
    expect(computeAgeBounds("3-4")).toEqual({ min: 3, max: 4 });
    expect(computeAgeBounds("4-5")).toEqual({ min: 4, max: 5 });
    expect(computeAgeBounds("5-6")).toEqual({ min: 5, max: 6 });
  });

  it("BR-CCE-02: xếp trò chơi hợp age_band lên trước, trò chơi ngoài độ tuổi xếp sau và không bị loại bỏ", () => {
    const bounds = computeAgeBounds("4-5");
    expect(fitsAgeBounds({ ageMin: 4, ageMax: 5 }, bounds)).toBe(true);
    expect(fitsAgeBounds({ ageMin: 5, ageMax: 6 }, bounds)).toBe(false);

    const levels = [
      {
        id: 1,
        code: "GL-C1-CNT-0001",
        title: "Cộng nâng cao 5-6 tuổi",
        thumbnailEmoji: "🧮",
        themeId: "school",
        accessTier: "free" as const,
        ageMin: 5,
        ageMax: 6,
      },
      {
        id: 2,
        code: "GL-C1-CNT-0002",
        title: "Đếm kẹo 4-5 tuổi",
        thumbnailEmoji: "🍬",
        themeId: "candy",
        accessTier: "free" as const,
        ageMin: 4,
        ageMax: 5,
      },
      {
        id: 3,
        code: "GL-C1-CNT-0003",
        title: "Nhận biết số 3 tuổi",
        thumbnailEmoji: "1️⃣",
        themeId: "farm",
        accessTier: "free" as const,
        ageMin: 3,
        ageMax: 3,
      },
    ];

    const sorted = sortCompetencyLevels(levels, bounds);
    expect(sorted.map((l) => l.code)).toEqual([
      "GL-C1-CNT-0002",
      "GL-C1-CNT-0001",
      "GL-C1-CNT-0003",
    ]);
  });
});

describe("buildCompetencyGames (BR-CCE-03, BR-CCE-04 & main flow bước 4)", () => {
  const sampleLevels = [
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

  it("ghép nối dữ liệu level và thống kê lượt chơi của trẻ khi chưa có gói", () => {
    const statsMap = new Map([[101, { bestStars: 3, playCount: 5 }]]);

    const result = buildCompetencyGames(sampleLevels, statsMap);

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
      thumbnail_emoji: "🎮",
      theme_id: "candy",
      access_tier: "premium",
      is_locked: true,
      best_stars: 0,
      play_count: 0,
    });
  });

  it("tính is_locked = false cho level premium khi gia đình có entitlement premium", () => {
    const result = buildCompetencyGames(sampleLevels, new Map(), [
      "free",
      "login",
      "standard",
      "premium",
    ]);

    expect(result[0]?.is_locked).toBe(false);
    expect(result[1]?.is_locked).toBe(false);
  });
});
