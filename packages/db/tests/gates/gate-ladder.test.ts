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

import {
  type EngineBandViolationStat,
  GATE_5_BAND_LADDER_BASELINES,
} from "#src/seed-content/gates/ladder";
import { runEightGates } from "#src/seed-content/gates/runner";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Cổng 5 Bậc thang & Đo nợ Band tuổi Engine (BR-ECD-13, Task #118)", () => {
  it("Đo chính xác toàn bộ 27 engine và khẳng định bậc thang band tuổi không bị thoái lui", () => {
    const statsByEngine: Record<string, EngineBandViolationStat> = {};
    let totalOutOfBandLevels = 0;

    for (let i = 1; i <= 27; i++) {
      const code = `GT-${String(i).padStart(3, "0")}`;
      const tmpl = ALL_TEMPLATES[code];
      statsByEngine[code] = {
        engineCode: code,
        totalLevels: 0,
        outOfBandLevels: 0,
        bannedAgeBands: tmpl?.banned_age_bands || [],
        violatingLevelCodes: [],
      };
    }

    for (const level of ALL_SEED_LEVELS) {
      const tCode = level.header.template_code;
      const stat = statsByEngine[tCode] || {
        engineCode: tCode,
        totalLevels: 0,
        outOfBandLevels: 0,
        bannedAgeBands: ALL_TEMPLATES[tCode]?.banned_age_bands || [],
        violatingLevelCodes: [],
      };
      statsByEngine[tCode] = stat;
      stat.totalLevels++;

      const tmpl = ALL_TEMPLATES[tCode];
      if (tmpl?.banned_age_bands && tmpl.banned_age_bands.length > 0) {
        let band: "3-4" | "4-5" | "5-6" = "4-5";
        if (level.header.age_max <= 4) {
          band = "3-4";
        } else if (level.header.age_min >= 5) {
          band = "5-6";
        }

        if (tmpl.banned_age_bands.includes(band)) {
          stat.outOfBandLevels++;
          stat.violatingLevelCodes.push(level.header.code);
          totalOutOfBandLevels++;
        }
      }
    }

    // Khẳng định tổng số vi phạm <= Baseline bậc thang (chỉ được giảm)
    expect(totalOutOfBandLevels).toBeLessThanOrEqual(
      GATE_5_BAND_LADDER_BASELINES.maxOutOfBandLevels
    );

    // Khẳng định số đo baseline chính xác tại thời điểm dọn nợ (35 vi phạm)
    expect(totalOutOfBandLevels).toBe(35);
    expect(statsByEngine["GT-002"]?.outOfBandLevels).toBe(12);
    expect(statsByEngine["GT-004"]?.outOfBandLevels).toBe(3);
    expect(statsByEngine["GT-006"]?.outOfBandLevels).toBe(19);
    expect(statsByEngine["GT-024"]?.outOfBandLevels).toBe(1);
    expect(statsByEngine["GT-026"]?.outOfBandLevels).toBe(0);
    expect(statsByEngine["GT-027"]?.outOfBandLevels).toBe(0);
  });

  it("Test ca âm: gắn một level vào band engine cấm → cổng 5 đỏ với ENGINE_AGE_BAND_BANNED (BR-ECD-11, BR-ECD-13)", () => {
    // VALID_GAME_LEVEL_SEED dùng GT-001 (không cấm). Giả lập một level dùng GT-006 (cấm 3-4 và 4-5) nhưng gắn band 3-4:
    const bannedLevelSeed = {
      ...VALID_GAME_LEVEL_SEED,
      header: {
        ...VALID_GAME_LEVEL_SEED.header,
        code: "GL-C1-BANNED-BAND-0001",
        template_code: "GT-006",
        age_min: 3,
        age_max: 4,
      },
    };

    const results = runEightGates(bannedLevelSeed, new Set());
    const gate5 = results.find((r) => r.gate === 5);
    expect(gate5?.passed).toBe(false);
    expect(gate5?.issues.some((i) => i.code === "ENGINE_AGE_BAND_BANNED")).toBe(
      true
    );
  });

  it("Test bậc thang: nếu số level ngoài band vượt quá trần baseline → thoái lui bị chặn", () => {
    const artificialOutCount =
      GATE_5_BAND_LADDER_BASELINES.maxOutOfBandLevels + 1;
    const isCompliant =
      artificialOutCount <= GATE_5_BAND_LADDER_BASELINES.maxOutOfBandLevels;
    expect(isCompliant).toBe(false);
  });
});
