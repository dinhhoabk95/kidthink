import type { RoadmapSeed } from "@mindkid/content";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  runSkillProgressionGate,
  SkillProgressionRowSchema,
} from "#src/gates/skill-progression";

describe("Gate: Skill Age Progression (Task #160 / BR-SAP-01..07)", () => {
  it("chạy thành công trên cấu hình hợp lệ và phủ đủ kỹ năng, không vi phạm tiên quyết", () => {
    const result = runSkillProgressionGate();
    expect(result.coveredSkillsCount).toBeGreaterThan(0);
    expect(result.missingSkills).toHaveLength(0);
    expect(result.violations).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("Ca âm (BR-SAP-01): dòng thiếu source hoặc age_slice ngoài tập cho phép thì Zod ném lỗi", () => {
    expect(() =>
      SkillProgressionRowSchema.parse({
        skill_code: "C1.CNT.01",
        age_slice: "36-48m",
        rank_in_slice: 1,
        source: "",
      })
    ).toThrow(z.ZodError);

    expect(() =>
      SkillProgressionRowSchema.parse({
        skill_code: "C1.CNT.01",
        age_slice: "24-36m",
        rank_in_slice: 1,
        source: "TT 51/2020",
      })
    ).toThrow(z.ZodError);
  });

  it("Ca âm (BR-SAP-02): kỹ năng tiên quyết xếp sau kỹ năng phụ thuộc trong cùng lát hoặc lát muộn hơn làm cổng đỏ", () => {
    const sameSliceResult = runSkillProgressionGate({
      configOverride: {
        date: "2026-10-18",
        version: "1.0",
        description: "Test BR-SAP-02 same slice",
        source_framework: "TT 51/2020",
        total_skills: 2,
        progressions: [
          {
            skill_code: "C1.CNT.02",
            age_slice: "36-48m",
            rank_in_slice: 1,
            source: "TT 51/2020",
          },
          {
            skill_code: "C1.CNT.01",
            age_slice: "36-48m",
            rank_in_slice: 5,
            source: "TT 51/2020",
          },
        ],
      },
      activeSkillsOverride: new Set(["C1.CNT.01", "C1.CNT.02"]),
      skillsOverride: [
        { code: "C1.CNT.01", prerequisites: [] },
        { code: "C1.CNT.02", prerequisites: ["C1.CNT.01"] },
      ],
      roadmapsOverride: [],
    });

    expect(sameSliceResult.valid).toBe(false);
    expect(
      sameSliceResult.violations.some((v) => v.includes("[BR-SAP-02]"))
    ).toBe(true);

    const laterSliceResult = runSkillProgressionGate({
      configOverride: {
        date: "2026-10-18",
        version: "1.0",
        description: "Test BR-SAP-02 later slice",
        source_framework: "TT 51/2020",
        total_skills: 2,
        progressions: [
          {
            skill_code: "C1.CNT.02",
            age_slice: "36-48m",
            rank_in_slice: 1,
            source: "TT 51/2020",
          },
          {
            skill_code: "C1.CNT.01",
            age_slice: "48-60m",
            rank_in_slice: 1,
            source: "TT 51/2020",
          },
        ],
      },
      activeSkillsOverride: new Set(["C1.CNT.01", "C1.CNT.02"]),
      skillsOverride: [
        { code: "C1.CNT.01", prerequisites: [] },
        { code: "C1.CNT.02", prerequisites: ["C1.CNT.01"] },
      ],
      roadmapsOverride: [],
    });

    expect(laterSliceResult.valid).toBe(false);
    expect(
      laterSliceResult.violations.some((v) => v.includes("[BR-SAP-02]"))
    ).toBe(true);
  });

  it("Ca âm (BR-SAP-04): kỹ năng đang có nội dung nhưng thiếu dòng trong bảng tiến trình làm cổng đỏ", () => {
    const result = runSkillProgressionGate({
      configOverride: {
        date: "2026-10-18",
        version: "1.0",
        description: "Test BR-SAP-04 missing skill",
        source_framework: "TT 51/2020",
        total_skills: 1,
        progressions: [
          {
            skill_code: "C1.CNT.02",
            age_slice: "36-48m",
            rank_in_slice: 1,
            source: "TT 51/2020",
          },
        ],
      },
      activeSkillsOverride: new Set(["C1.CNT.01", "C1.CNT.02"]),
      skillsOverride: [],
      roadmapsOverride: [],
    });

    expect(result.valid).toBe(false);
    expect(result.missingSkills).toContain("C1.CNT.01");
    expect(result.violations.some((v) => v.includes("[BR-SAP-04]"))).toBe(true);
  });

  it("Ca dương & cảnh báo (BR-SAP-03, BR-SAP-05): lộ trình xếp lệch bảng chỉ sinh cảnh báo sư phạm, không chặn", () => {
    const mockRoadmap: RoadmapSeed = {
      code: "CUR-TEST",
      version: 1,
      band: "3-4",
      title: "Lộ trình thử nghiệm",
      description: "Kiểm thử cảnh báo BR-SAP-03 và BR-SAP-05",
      access_tier: "free",
      sessions_per_week: 2,
      duration_weeks: 1,
      weeks: [
        {
          week_no: 1,
          goal: "Tuần thử nghiệm",
          target_skills: ["C1.CNT.02", "C1.CNT.01"],
          sessions: [
            { session_no: 1, role: "introduce", skill_code: "C1.CNT.02" },
            { session_no: 2, role: "introduce", skill_code: "C1.CNT.01" },
          ],
        },
      ],
    };

    const result = runSkillProgressionGate({
      configOverride: {
        date: "2026-10-18",
        version: "1.0",
        description: "Test BR-SAP-03 warning",
        source_framework: "TT 51/2020",
        total_skills: 2,
        progressions: [
          {
            skill_code: "C1.CNT.01",
            age_slice: "36-48m",
            rank_in_slice: 1,
            source: "TT 51/2020",
          },
          {
            skill_code: "C1.CNT.02",
            age_slice: "36-48m",
            rank_in_slice: 2,
            source: "TT 51/2020",
          },
        ],
      },
      activeSkillsOverride: new Set(["C1.CNT.01", "C1.CNT.02"]),
      skillsOverride: [
        { code: "C1.CNT.01", prerequisites: [] },
        { code: "C1.CNT.02", prerequisites: ["C1.CNT.01"] },
      ],
      roadmapsOverride: [mockRoadmap],
    });

    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("[BR-SAP-03]"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("[BR-SAP-05]"))).toBe(true);
  });

  it("Ca âm (BR-SAP-06): nguồn cấu hình không tồn tại thì ném lỗi dừng tiến trình", () => {
    expect(() =>
      runSkillProgressionGate("/path/to/non-existent-progression.json")
    ).toThrow("Không tìm thấy file cấu hình");
  });
});
