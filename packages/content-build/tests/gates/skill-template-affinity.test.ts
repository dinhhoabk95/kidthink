import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  type AgeBand,
  ALL_TEMPLATES,
  type GameTemplate,
} from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  buildSkillTemplateAffinityMatrix,
  type SkillAffinityMatrixData,
} from "#src/gates/skill-template-affinity";

const SKILL_CODE_FORMAT_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;

describe("Task #193 — Ma trận skill × khuôn (skill-template-affinity)", () => {
  it("ma trận trong config/skill-template-affinity.json đồng bộ 100% với suy diễn từ taxonomy & specs", () => {
    const configPath = repoPath(
      "packages/db/config/skill-template-affinity.json"
    );
    expect(fs.existsSync(configPath)).toBe(true);

    const savedData: SkillAffinityMatrixData = JSON.parse(
      fs.readFileSync(configPath, "utf8")
    );
    const computedData = buildSkillTemplateAffinityMatrix();

    expect(savedData.total_skills).toBe(408);
    expect(savedData.total_templates).toBe(36);
    expect(savedData.metrics.band_3_4_skills_count).toBe(78);
    expect(savedData.affinities).toEqual(computedData.affinities);
    expect(savedData.metrics).toEqual(computedData.metrics);
  });

  it("mọi skill trong ma trận đều có cấu trúc hợp lệ và thuộc taxonomy", () => {
    const matrix = buildSkillTemplateAffinityMatrix();
    const skillCodes = Object.keys(matrix.affinities);
    expect(skillCodes).toHaveLength(408);

    for (const [skillCode, templates] of Object.entries(matrix.affinities)) {
      expect(skillCode).toMatch(SKILL_CODE_FORMAT_REGEX);
      expect(Array.isArray(templates)).toBe(true);
      for (const tCode of templates) {
        expect(ALL_TEMPLATES[tCode]).toBeDefined();
      }
    }
  });

  it("danh sách ngoại lệ exceptions là dữ liệu rõ ràng, chứa đúng các skill < 2 khuôn và C1 < 4 khuôn", () => {
    const matrix = buildSkillTemplateAffinityMatrix();
    expect(matrix.exceptions.length).toBeGreaterThan(0);
    for (const code of matrix.metrics.all_skills_below_2) {
      expect(matrix.exceptions).toContain(code);
    }
    for (const code of matrix.metrics.c1_skills_below_4) {
      expect(matrix.exceptions).toContain(code);
    }
  });

  it("Ca âm: đổi banned_age_bands của template GT-001 thành cấm mọi band làm ma trận thay đổi ngay lập tức", () => {
    const originalGT001 = ALL_TEMPLATES["GT-001"];
    expect(originalGT001).toBeDefined();
    if (!originalGT001) {
      throw new Error("GT-001 must exist");
    }

    const modifiedTemplates: Record<string, GameTemplate> = {
      ...ALL_TEMPLATES,
      "GT-001": {
        ...originalGT001,
        banned_age_bands: ["3-4", "4-5", "5-6"] as AgeBand[],
      },
    };

    const baseline = buildSkillTemplateAffinityMatrix();
    const modified = buildSkillTemplateAffinityMatrix(
      undefined,
      undefined,
      modifiedTemplates
    );

    let baselineGT001Count = 0;
    for (const templates of Object.values(baseline.affinities)) {
      if (templates.includes("GT-001")) {
        baselineGT001Count++;
      }
    }
    expect(baselineGT001Count).toBeGreaterThan(0);

    let modifiedGT001Count = 0;
    for (const templates of Object.values(modified.affinities)) {
      if (templates.includes("GT-001")) {
        modifiedGT001Count++;
      }
    }
    expect(modifiedGT001Count).toBe(0);
    expect(modified.affinities).not.toEqual(baseline.affinities);
  });
});
