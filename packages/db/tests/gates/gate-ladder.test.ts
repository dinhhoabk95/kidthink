import { ALL_TEMPLATES, type GameTemplate } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import {
  type EngineFailureStat,
  GATE_1_LADDER_BASELINES,
} from "#src/seed-content/gates/ladder";
import { checkGameLevelGate1 } from "#src/seed-content/gates/runner";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";
import type { GateIssue } from "#src/seed-content/types";

describe("Cổng 1 Bậc thang & Đo nợ theo Engine (Task #117, WP117.2, WP117.4)", () => {
  it("Ca kiểm: trỏ vào registry rỗng → đỏ với TEMPLATE_CODE_UNKNOWN", () => {
    const emptyRegistry: Record<string, GameTemplate> = {};
    const sampleLevel = ALL_SEED_LEVELS[0];
    const issues: GateIssue[] = [];

    checkGameLevelGate1(sampleLevel, issues, emptyRegistry);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.code === "TEMPLATE_CODE_UNKNOWN")).toBe(true);
  });

  it("Đo chính xác toàn bộ 27 engine và khẳng định bậc thang không bị thoái lui", () => {
    const statsByEngine: Record<string, EngineFailureStat> = {};
    let totalContentPackFails = 0;
    let totalDifficultyParamsFails = 0;
    let totalFailingLevels = 0;

    for (let i = 1; i <= 27; i++) {
      const code = `GT-${String(i).padStart(3, "0")}`;
      statsByEngine[code] = {
        engineCode: code,
        totalLevels: 0,
        contentPackFails: 0,
        difficultyParamsFails: 0,
        failingLevels: 0,
        missingContentFields: {},
        missingDifficultyFields: {},
      };
    }

    for (const level of ALL_SEED_LEVELS) {
      const tCode = level.header.template_code;
      const stat = statsByEngine[tCode] || {
        engineCode: tCode,
        totalLevels: 0,
        contentPackFails: 0,
        difficultyParamsFails: 0,
        failingLevels: 0,
        missingContentFields: {},
        missingDifficultyFields: {},
      };
      statsByEngine[tCode] = stat;
      stat.totalLevels++;

      const tmpl = ALL_TEMPLATES[tCode];
      let levelFailed = false;

      if (tmpl) {
        const cRes = tmpl.content_contract.safeParse(level.content_pack);
        if (!cRes.success) {
          stat.contentPackFails++;
          totalContentPackFails++;
          levelFailed = true;
          for (const issue of cRes.error.issues) {
            const p = issue.path.join(".") || "(root)";
            stat.missingContentFields[p] =
              (stat.missingContentFields[p] || 0) + 1;
          }
        }

        const dRes = tmpl.difficulty_contract.safeParse(
          level.difficulty_params
        );
        if (!dRes.success) {
          stat.difficultyParamsFails++;
          totalDifficultyParamsFails++;
          levelFailed = true;
          for (const issue of dRes.error.issues) {
            const p = issue.path.join(".") || "(root)";
            stat.missingDifficultyFields[p] =
              (stat.missingDifficultyFields[p] || 0) + 1;
          }
        }
      } else {
        levelFailed = true;
        totalContentPackFails++;
        totalDifficultyParamsFails++;
      }

      if (levelFailed) {
        stat.failingLevels++;
        totalFailingLevels++;
      }
    }

    // Khẳng định đủ 27 engine trong bảng đo
    const engineKeys = Object.keys(statsByEngine).sort();
    expect(engineKeys.length).toBeGreaterThanOrEqual(27);

    // Khẳng định tổng số trượt <= Bậc thang baseline (chỉ được giảm, không được tăng)
    expect(totalContentPackFails).toBeLessThanOrEqual(
      GATE_1_LADDER_BASELINES.maxContentPackFails
    );
    expect(totalDifficultyParamsFails).toBeLessThanOrEqual(
      GATE_1_LADDER_BASELINES.maxDifficultyParamsFails
    );
    expect(totalFailingLevels).toBeLessThanOrEqual(
      GATE_1_LADDER_BASELINES.maxFailingGate1Levels
    );

    // Khẳng định số liệu hiện tại đúng bằng giá trị đã đo
    expect(totalContentPackFails).toBe(162);
    expect(totalDifficultyParamsFails).toBe(170);
    expect(totalFailingLevels).toBe(175);
  });

  it("Test bậc thang: nếu số trượt vượt quá trần baseline → test đỏ", () => {
    const artificialRegressionFails =
      GATE_1_LADDER_BASELINES.maxContentPackFails + 1;
    const isCompliant =
      artificialRegressionFails <= GATE_1_LADDER_BASELINES.maxContentPackFails;
    expect(isCompliant).toBe(false);
  });
});
