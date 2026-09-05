import {
  ALL_TEMPLATES,
  type GameTemplate,
} from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import { isLevelOutOfBand, toAgeBand } from "#src/gates/engine-content-depth";
import {
  type EngineBandViolationStat,
  type EngineFailureStat,
  GATE_1_LADDER_BASELINES,
  GATE_5_BAND_LADDER_BASELINES,
} from "#src/gates/ladder";
import { checkGameLevelGate1, runEightGates } from "#src/gates/runner";
import { ALL_SEED_LEVELS } from "#src/index";
import type { GateIssue } from "#src/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Cổng 1 Bậc thang & Đo nợ theo Engine (Task #117, WP117.2, WP117.4)", () => {
  it("Ca kiểm: trỏ vào registry rỗng → đỏ với TEMPLATE_CODE_UNKNOWN", () => {
    const emptyRegistry: Record<string, GameTemplate> = {};
    const sampleLevel = ALL_SEED_LEVELS[0];
    if (!sampleLevel) {
      throw new Error("ALL_SEED_LEVELS is empty");
    }
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
      const stat: EngineFailureStat = statsByEngine[tCode] || {
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
    expect(totalContentPackFails).toBe(0);
    expect(totalDifficultyParamsFails).toBe(0);
    expect(totalFailingLevels).toBe(0);
  });

  it("Test bậc thang: một level trượt thêm làm số đo vượt trần và cổng đỏ", () => {
    // Bản cũ khẳng định `n + 1 <= n` là `false` — nó chứng minh toán tử `<=`
    // hoạt động, không chạm vào một dòng nào của cổng, và vẫn xanh nếu
    // `ladder.ts` bị xoá và baseline đặt thành `Infinity`.
    //
    // Bản này đẩy một level hỏng thật qua đúng đường mã của cổng.
    const brokenLevel = {
      ...VALID_GAME_LEVEL_SEED,
      header: {
        ...VALID_GAME_LEVEL_SEED.header,
        code: "GL-C1-BROKEN-PACK-0001",
      },
      content_pack: { rác: true },
    };

    const results = runEightGates(brokenLevel, new Set());
    const gate1 = results.find((r) => r.gate === 1);
    expect(gate1?.passed).toBe(false);

    // …và số đo mới, nếu cộng vào corpus, vượt trần baseline.
    const wouldBe = GATE_1_LADDER_BASELINES.maxContentPackFails + 1;
    expect(wouldBe).toBeGreaterThan(
      GATE_1_LADDER_BASELINES.maxContentPackFails
    );
  });
});

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
      const stat: EngineBandViolationStat = statsByEngine[tCode] || {
        engineCode: tCode,
        totalLevels: 0,
        outOfBandLevels: 0,
        bannedAgeBands: ALL_TEMPLATES[tCode]?.banned_age_bands || [],
        violatingLevelCodes: [] as string[],
      };
      statsByEngine[tCode] = stat;
      stat.totalLevels++;

      // Dùng ĐÚNG hàm của cổng, không chép lại luật vào file test. Bản cũ chép
      // một bản rút gọn chỉ xét `banned_age_bands`, nên nó tái tạo y nguyên lỗ
      // hổng của cổng và xác nhận con số sai (35) là đúng.
      const tmpl = ALL_TEMPLATES[tCode];
      if (tmpl) {
        const band = toAgeBand(level.header.age_min, level.header.age_max);
        if (isLevelOutOfBand(level, tmpl, band)) {
          stat.outOfBandLevels++;
          stat.violatingLevelCodes.push(level.header.code);
          totalOutOfBandLevels++;
        }
      } else {
        // Template lạ Cấm — NEVER được đếm là 0 trong im lặng.
        throw new Error(`Level ${level.header.code} trỏ template lạ ${tCode}.`);
      }
    }

    // Khẳng định tổng số vi phạm <= Baseline bậc thang (chỉ được giảm)
    expect(totalOutOfBandLevels).toBeLessThanOrEqual(
      GATE_5_BAND_LADDER_BASELINES.maxOutOfBandLevels
    );

    // Nợ đã dọn: 42 level từng gắn band mà engine cấm (hoặc ngoài khoảng tuổi
    // của template) nay được nâng lên band hợp lệ THẤP NHẤT của chính engine đó
    // — nghĩa là tôn trọng phán quyết sư phạm đã chốt trong `template.ts`, chứ
    // không nới trần cổng. Con số ghi thẳng để cả tiến lẫn lùi đều làm test đỏ.
    expect(totalOutOfBandLevels).toBe(0);
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

  it("ca âm: level vượt khoảng tuổi của template cũng là ngoài band, dù template không khai banned_age_bands", () => {
    // Đây là vế mà bản cũ bỏ sót. `GT-001` không có `banned_age_bands`, nên
    // cổng cũ miễn kiểm hoàn toàn — 7 level đặt trẻ 3 tuổi lên engine 4+ đi qua
    // mà không ai thấy, và con số 35 (thay vì 42) được chốt làm baseline.
    const template = ALL_TEMPLATES["GT-001"];
    expect(template).toBeDefined();

    const tooYoung = {
      header: {
        age_min: (template?.age_min ?? 4) - 1,
        age_max: template?.age_max ?? 6,
      },
    };
    expect(isLevelOutOfBand(tooYoung, template as never, "3-4")).toBe(true);

    const inRange = {
      header: {
        age_min: template?.age_min ?? 4,
        age_max: template?.age_max ?? 6,
      },
    };
    expect(isLevelOutOfBand(inRange, template as never, "4-5")).toBe(false);
  });
});
