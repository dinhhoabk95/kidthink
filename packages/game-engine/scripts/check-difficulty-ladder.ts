/**
 * Cổng kiểm tra thang độ khó game level (Task #263 T6 / BR-LDC-01, BR-LDC-02, BR-LDC-03, BR-LDC-04, BR-LDC-05, BR-LDC-08).
 *
 * 4 điều kiện:
 * 1. Mỗi ô config trong engine-difficulty-params.json nằm trong limits của template registry (BR-LDC-01) và ranh giới adaptive (BR-LDC-08).
 * 2. Số item theo mức khó không giảm trên 37 engine (BR-LDC-03) và ngoại lệ difficulty_fixed (BR-LDC-05).
 * 3. Mỗi kỹ năng trong corpus có ≥2 mức khó khác nhau (BR-LDC-04).
 * 4. Đối chiếu corpus level với bảng tra (BR-LDC-01, BR-LDC-02, BR-LDC-03).
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:difficulty-ladder
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { SEED_LEVELS_CORPUS as ALL_SEED_LEVELS } from "@mindkid/content-build/gates/age-band-fit";
import {
  type EngineDifficultyParamsConfig,
  EngineDifficultyParamsConfigSchema,
} from "#src/contracts/engine-difficulty-config.js";
import { ALL_TEMPLATES } from "#src/generated/template-registry.js";

const CONFIG_PATH = repoPath(
  "packages/game-engine/config/engine-difficulty-params.json"
);
const BASELINE_PATH = repoPath(
  "packages/game-engine/config/difficulty-ladder-baseline.json"
);
const ADAPTIVE_LEVEL_PARAMS_PATH = repoPath(
  "packages/adaptive/src/level-params.ts"
);

const ADAPTIVE_DIFFICULTY_ACCESS_REGEX =
  /\b(?:base|overrides|param_overrides)\.difficulty\b|(?:\[["']difficulty["']\])/;

type SeedDifficultyParams =
  (typeof ALL_SEED_LEVELS)[number]["difficulty_params"];

export interface CorpusLevelSample {
  readonly header: {
    readonly code: string;
    readonly template_code: string;
    readonly difficulty: number;
    readonly skill_codes?: readonly string[];
  };
  readonly difficulty_params?: SeedDifficultyParams;
}

function readItemCount(params?: SeedDifficultyParams): number | undefined {
  if (!(params && typeof params === "object" && "item_count" in params)) {
    return undefined;
  }
  const value = params.item_count;
  return typeof value === "number" ? value : undefined;
}

export interface DifficultyLadderIssue {
  condition: 1 | 2 | 3 | 4;
  code: string;
  message: string;
  engineCode?: string;
  levelCode?: string;
  skillCode?: string;
}

export interface DifficultyLadderReport {
  passed: boolean;
  totalEngines: number;
  totalSkills: number;
  /** Số level THỰC SỰ được đối chiếu với bảng tra (có khai `item_count`). */
  totalLevelsChecked: number;
  /** Số level bỏ qua vì không khai `item_count` — nợ riêng, có trần riêng. */
  levelsMissingItemCount: number;
  itemCountMismatches: number;
  maxItemCountMismatches: number;
  maxLevelsMissingItemCount: number;
  issues: DifficultyLadderIssue[];
}

export interface BaselineDebtConfig {
  max_item_count_mismatches: number;
  max_levels_missing_item_count: number;
  date: string;
  note?: string;
}

/**
 * Nguồn không đọc được thì ném — Cấm — NEVER trả trần rỗng rồi báo xanh
 * (`BR-LDC-02`): trần mặc định 0 sẽ biến một file baseline mất tích thành cổng
 * đỏ giả, còn trần vô hạn thì thành cổng xanh giả.
 */
export function loadBaselineDebt(): BaselineDebtConfig {
  const raw = fs.readFileSync(BASELINE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Partial<BaselineDebtConfig>;
  if (
    typeof parsed.max_item_count_mismatches !== "number" ||
    typeof parsed.max_levels_missing_item_count !== "number"
  ) {
    throw new Error(
      `Baseline ${BASELINE_PATH} thiếu max_item_count_mismatches hoặc max_levels_missing_item_count.`
    );
  }
  return parsed as BaselineDebtConfig;
}

/**
 * Điều kiện 1: Kiểm tra config nằm trong limits của template registry (BR-LDC-01).
 */
export function checkConfigLimits(
  config: EngineDifficultyParamsConfig
): DifficultyLadderIssue[] {
  const issues: DifficultyLadderIssue[] = [];

  // Thiếu HÀNG là lỗi im lặng nguy hiểm nhất: vòng lặp dưới chỉ duyệt engine có
  // trong config, nên một engine vắng mặt sẽ không bị kiểm gì cả (`BR-LDC-01`).
  for (const engineCode of Object.keys(ALL_TEMPLATES)) {
    if (!config.engines[engineCode]) {
      issues.push({
        condition: 1,
        code: "MISSING_ENGINE_ROW",
        engineCode,
        message: `${engineCode} có trong registry nhưng thiếu hàng trong engine-difficulty-params.json (BR-LDC-01).`,
      });
    }
  }

  for (const [engineCode, entry] of Object.entries(config.engines)) {
    const template = ALL_TEMPLATES[engineCode];
    if (!template) {
      issues.push({
        condition: 1,
        code: "ENGINE_TEMPLATE_NOT_FOUND",
        engineCode,
        message: `Không tìm thấy template tương ứng cho ${engineCode} trong registry.`,
      });
      continue;
    }

    const [minLimit, maxLimit] = template.limits.item_count;

    for (let lvl = 1; lvl <= 5; lvl++) {
      const levelKey = String(lvl) as "1" | "2" | "3" | "4" | "5";
      const params = entry.levels[levelKey];
      if (!params) {
        issues.push({
          condition: 1,
          code: "MISSING_DIFFICULTY_LEVEL",
          engineCode,
          message: `${engineCode} thiếu mức khó ${lvl}.`,
        });
        continue;
      }

      if (params.item_count < minLimit || params.item_count > maxLimit) {
        issues.push({
          condition: 1,
          code: "ITEM_COUNT_OUT_OF_LIMITS",
          engineCode,
          message: `${engineCode} mức ${lvl} có item_count=${params.item_count} ngoài limits [${minLimit}, ${maxLimit}] (BR-LDC-01).`,
        });
      }
    }
  }

  return issues;
}

/**
 * Điều kiện 2: Kiểm tra số item theo mức không giảm trên 37 engine (BR-LDC-03)
 * và ngoại lệ difficulty_fixed (BR-LDC-05).
 */
export function checkConfigMonotonicity(
  config: EngineDifficultyParamsConfig
): DifficultyLadderIssue[] {
  const issues: DifficultyLadderIssue[] = [];

  for (const [engineCode, entry] of Object.entries(config.engines)) {
    for (let lvl = 1; lvl < 5; lvl++) {
      const curKey = String(lvl) as "1" | "2" | "3" | "4" | "5";
      const nextKey = String(lvl + 1) as "1" | "2" | "3" | "4" | "5";
      const cur = entry.levels[curKey];
      const next = entry.levels[nextKey];

      if (!(cur && next)) {
        continue;
      }

      if (next.item_count < cur.item_count) {
        issues.push({
          condition: 2,
          code: "DIFFICULTY_ITEM_COUNT_DESCENDING",
          engineCode,
          message: `${engineCode} mức ${lvl + 1} (${next.item_count}) nhỏ hơn mức ${lvl} (${cur.item_count}) (BR-LDC-03).`,
        });
      }
    }

    const lvl1 = entry.levels["1"];
    const lvl5 = entry.levels["5"];
    if (
      !entry.difficulty_fixed &&
      lvl1 &&
      lvl5 &&
      lvl5.item_count <= lvl1.item_count
    ) {
      issues.push({
        condition: 2,
        code: "DIFFICULTY_FLAT_WITHOUT_FIXED_FLAG",
        engineCode,
        message: `${engineCode} có item_count mức 5 (${lvl5.item_count}) không tăng so với mức 1 (${lvl1.item_count}) nhưng không khai difficulty_fixed: true (BR-LDC-05).`,
      });
    }
  }

  return issues;
}

/**
 * Điều kiện 1b: Kiểm tra hệ thống thích ứng chỉ đọc/tinh chỉnh difficulty_params,
 * không đọc hay ghi cột difficulty (BR-LDC-08).
 */
export function checkAdaptiveDifficultyBoundary(
  sourceCode?: string
): DifficultyLadderIssue[] {
  const code =
    sourceCode ?? fs.readFileSync(ADAPTIVE_LEVEL_PARAMS_PATH, "utf-8");
  const issues: DifficultyLadderIssue[] = [];

  if (ADAPTIVE_DIFFICULTY_ACCESS_REGEX.test(code)) {
    issues.push({
      condition: 1,
      code: "ADAPTIVE_READS_DIFFICULTY_COLUMN",
      message:
        "Hệ thống thích ứng (level-params.ts) đọc hoặc ghi trường difficulty thay vì chỉ tinh chỉnh difficulty_params (BR-LDC-08).",
    });
  }

  return issues;
}

/**
 * Điều kiện 3: Kiểm tra mỗi kỹ năng trong corpus có ≥2 mức khó khác nhau (BR-LDC-04).
 */
export function checkSkillDifficulties(
  levels: readonly CorpusLevelSample[] = ALL_SEED_LEVELS
): {
  issues: DifficultyLadderIssue[];
  totalSkills: number;
} {
  const issues: DifficultyLadderIssue[] = [];
  const skillsMap = new Map<string, Set<number>>();

  for (const level of levels) {
    const codes = level.header.skill_codes || [];
    const diff = level.header.difficulty;
    for (const sc of codes) {
      let diffSet = skillsMap.get(sc);
      if (!diffSet) {
        diffSet = new Set<number>();
        skillsMap.set(sc, diffSet);
      }
      diffSet.add(diff);
    }
  }

  for (const [skillCode, diffSet] of skillsMap.entries()) {
    if (diffSet.size < 2) {
      issues.push({
        condition: 3,
        code: "SKILL_INSUFFICIENT_DIFFICULTY_SPAN",
        skillCode,
        message: `Kỹ năng ${skillCode} chỉ có ${diffSet.size} mức khó (${Array.from(diffSet).join(",")}). Cần ≥2 mức (BR-LDC-04).`,
      });
    }
  }

  return { issues, totalSkills: skillsMap.size };
}

interface SkillEnginePoint {
  readonly code: string;
  readonly difficulty: number;
  readonly itemCount: number;
}

function checkSkillEngineMonotonicity(
  bySkillEngine: Map<string, SkillEnginePoint[]>
): DifficultyLadderIssue[] {
  const issues: DifficultyLadderIssue[] = [];
  for (const [key, points] of bySkillEngine.entries()) {
    const [skillCode, engineCode] = key.split("::");
    const sorted = [...points].sort((a, b) => a.difficulty - b.difficulty);
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (
        cur &&
        next &&
        next.difficulty > cur.difficulty &&
        next.itemCount < cur.itemCount
      ) {
        issues.push({
          condition: 2,
          code: "LEVEL_SKILL_ITEM_COUNT_DESCENDING",
          engineCode,
          skillCode,
          levelCode: next.code,
          message: `Kỹ năng ${skillCode} trên ${engineCode}: level ${next.code} (mức ${next.difficulty}, item_count=${next.itemCount}) giảm số item so với ${cur.code} (mức ${cur.difficulty}, item_count=${cur.itemCount}) (BR-LDC-03).`,
        });
      }
    }
  }
  return issues;
}

/**
 * Điều kiện 4: Đối chiếu corpus level với bảng tra.
 *
 * Level không khai `item_count` KHÔNG được bỏ qua im lặng: nó được đếm riêng và
 * có trần riêng, vì `BR-LDC-02` bắt buộc khai trường này.
 */
export function checkCorpusLevels(
  config: EngineDifficultyParamsConfig,
  levels: readonly CorpusLevelSample[] = ALL_SEED_LEVELS
): {
  issues: DifficultyLadderIssue[];
  totalLevelsChecked: number;
  levelsMissingItemCount: number;
} {
  const issues: DifficultyLadderIssue[] = [];
  let totalLevelsChecked = 0;
  let levelsMissingItemCount = 0;
  const bySkillEngine = new Map<string, SkillEnginePoint[]>();

  for (const level of levels) {
    const engineCode = level.header.template_code;
    const diff = String(level.header.difficulty) as "1" | "2" | "3" | "4" | "5";

    const engineConfig = config.engines[engineCode];
    const expectedParams = engineConfig?.levels[diff];
    if (!expectedParams) {
      continue;
    }

    const itemCount = readItemCount(level.difficulty_params);

    if (itemCount === undefined) {
      levelsMissingItemCount++;
      issues.push({
        condition: 4,
        code: "LEVEL_MISSING_ITEM_COUNT",
        engineCode,
        levelCode: level.header.code,
        message: `Level ${level.header.code} (${engineCode}) không khai difficulty_params.item_count (BR-LDC-02).`,
      });
      continue;
    }

    totalLevelsChecked++;

    if (!engineConfig.difficulty_fixed) {
      for (const sc of level.header.skill_codes || []) {
        const key = `${sc}::${engineCode}`;
        const list = bySkillEngine.get(key) ?? [];
        list.push({
          code: level.header.code,
          difficulty: level.header.difficulty,
          itemCount,
        });
        bySkillEngine.set(key, list);
      }
    }

    if (itemCount !== expectedParams.item_count) {
      issues.push({
        condition: 4,
        code: "LEVEL_ITEM_COUNT_MISMATCH",
        engineCode,
        levelCode: level.header.code,
        message: `Level ${level.header.code} (${engineCode} mức ${diff}): item_count=${itemCount} khác bảng tra (${expectedParams.item_count}) (BR-LDC-01).`,
      });
    }
  }

  issues.push(...checkSkillEngineMonotonicity(bySkillEngine));

  return { issues, totalLevelsChecked, levelsMissingItemCount };
}

/**
 * Tổng hợp kiểm tra thang độ khó.
 *
 * Điều kiện 1..3 là luật cứng — một vi phạm là đỏ ngay.
 * Điều kiện 4 chạy theo trần ratchet: nợ hiện có ghi trong baseline và chỉ được
 * phép GIẢM. Cấm — NEVER ghi cứng mã engine nợ vào file này: nợ ghi trong mã
 * nguồn thì không ai kiểm được, và cổng sẽ nói dối về trạng thái của chính nó.
 */
export function checkDifficultyLadder(options?: {
  strict?: boolean;
}): DifficultyLadderReport {
  const rawConfig = fs.readFileSync(CONFIG_PATH, "utf-8");
  const validatedConfig = EngineDifficultyParamsConfigSchema.parse(
    JSON.parse(rawConfig)
  ) as EngineDifficultyParamsConfig;

  const baseline = loadBaselineDebt();
  const strict = options?.strict ?? false;
  const maxItemCountMismatches = strict
    ? 0
    : baseline.max_item_count_mismatches;
  const maxLevelsMissingItemCount = strict
    ? 0
    : baseline.max_levels_missing_item_count;

  const hardIssues: DifficultyLadderIssue[] = [];
  hardIssues.push(...checkConfigLimits(validatedConfig));
  hardIssues.push(...checkAdaptiveDifficultyBoundary());
  hardIssues.push(...checkConfigMonotonicity(validatedConfig));

  const { issues: skillIssues, totalSkills } = checkSkillDifficulties();
  hardIssues.push(...skillIssues);

  const {
    issues: levelIssues,
    totalLevelsChecked,
    levelsMissingItemCount,
  } = checkCorpusLevels(validatedConfig);

  const skillDescendingIssues = levelIssues.filter(
    (i) => i.code === "LEVEL_SKILL_ITEM_COUNT_DESCENDING"
  );
  hardIssues.push(...skillDescendingIssues);

  const itemCountMismatches = levelIssues.filter(
    (i) => i.code === "LEVEL_ITEM_COUNT_MISMATCH"
  ).length;

  const overMismatchCeiling = itemCountMismatches > maxItemCountMismatches;
  const overMissingCeiling = levelsMissingItemCount > maxLevelsMissingItemCount;
  const passed =
    hardIssues.length === 0 && !(overMismatchCeiling || overMissingCeiling);

  console.log("=== CỔNG CHECK:DIFFICULTY-LADDER (Task #263 T6) ===");
  console.log(
    `Đã kiểm tra ${Object.keys(validatedConfig.engines).length} engine templates.`
  );
  console.log(`Đã kiểm tra ${totalSkills} kỹ năng trong corpus.`);
  console.log(
    `Đã đối chiếu ${totalLevelsChecked} level có khai item_count với bảng tra.`
  );
  console.log(
    `Level lệch bảng tra: ${itemCountMismatches} (trần: ${maxItemCountMismatches})`
  );
  console.log(
    `Level thiếu item_count: ${levelsMissingItemCount} (trần: ${maxLevelsMissingItemCount})`
  );

  if (passed) {
    console.log("✓ Tất cả 4 điều kiện thang độ khó đạt chuẩn.");
  } else {
    for (const iss of hardIssues.slice(0, 10)) {
      console.error(`  - [C${iss.condition}] ${iss.code}: ${iss.message}`);
    }
    if (overMismatchCeiling) {
      console.error(
        `✗ Số level lệch bảng tra (${itemCountMismatches}) vượt trần (${maxItemCountMismatches}).`
      );
    }
    if (overMissingCeiling) {
      console.error(
        `✗ Số level thiếu item_count (${levelsMissingItemCount}) vượt trần (${maxLevelsMissingItemCount}).`
      );
    }
  }

  return {
    passed,
    totalEngines: Object.keys(validatedConfig.engines).length,
    totalSkills,
    totalLevelsChecked,
    levelsMissingItemCount,
    itemCountMismatches,
    maxItemCountMismatches,
    maxLevelsMissingItemCount,
    issues: [...hardIssues, ...levelIssues],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const isStrict = process.argv.includes("--strict");
  const report = checkDifficultyLadder({ strict: isStrict });
  process.exit(report.passed ? 0 : 1);
}
