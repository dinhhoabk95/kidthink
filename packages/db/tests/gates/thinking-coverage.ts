/**
 * Thinking Coverage Matrix Library (BR-TCM-01..11).
 * Spec: docs/specs/08-quality/thinking-coverage-matrix.md
 *
 * Rules:
 * - BR-TCM-01: Closed vocabulary check across what, thinking, mechanic, theme.
 * - BR-TCM-02: Negative test support for fabricated tags.
 * - BR-TCM-03: Published-only accounting.
 * - BR-TCM-04: Competency x AgeBand coverage floor (>= 6 game levels / cell).
 * - BR-TCM-05: Mechanic diversity floor (>= 2 mechanics / cell).
 * - BR-TCM-06: Thinking process catalog floor (>= 5 items / tag, warns in P3, blocks in P4).
 * - BR-TCM-07: Balance ratio (max / min <= 3, warns in P3, blocks in P4).
 * - BR-TCM-08: Publish drops = error, archive drops = warning.
 * - BR-TCM-09: Report missing cells and counts explicitly, NO percentage.
 * - BR-TCM-10: Catalog measurement only, distinct from pedagogical evidence.
 * - BR-TCM-11: Configurable thresholds via external JSON config.
 */

/* biome-ignore-all lint/performance/useTopLevelRegex: script runs once, regex perf irrelevant */
/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: script logic */

export interface ThinkingCoverageConfig {
  phase: "P3" | "P4";
  gameLevelPerCellFloor: number;
  mechanicPerCellFloor: number;
  thinkingTagFloor: number;
  balanceRatioCeiling: number;
  lessonPerCellFloor: number;
  activeCompetencies?: string[];
  activeAgeBands?: Array<"3-4" | "4-5" | "5-6">;
  enforceFloors?: boolean;
}

export const DEFAULT_CONFIG: ThinkingCoverageConfig = {
  phase: "P3",
  gameLevelPerCellFloor: 6,
  mechanicPerCellFloor: 2,
  thinkingTagFloor: 5,
  balanceRatioCeiling: 3,
  lessonPerCellFloor: 1,
  activeCompetencies: ["C1", "C2", "C3", "C4", "C5", "C6"],
  activeAgeBands: ["3-4", "4-5", "5-6"],
  enforceFloors: false,
};

export const CANONICAL_WHAT_TAGS = new Set([
  // Spec codes
  "number",
  "quantity",
  "geometry",
  "space",
  "pattern",
  "colour",
  "size",
  "category",
  "sequence",
  "time",
  "money",
  "rule",
  "letter",
  "sound",
  // DB seed-master abbreviations
  "cnt",
  "cmp",
  "ops",
  "shp",
  "spt",
  "msr",
  "pat",
  "cls",
  "log",
  "mem",
  "voc",
  "lst",
  "flw",
  "fnc",
]);

/**
 * Trục `thinking` — đúng 12 giá trị của content-tagging.md §7.1, không hơn.
 *
 * BR-TCM-01 nói từ vựng đóng thật. Danh sách này từng có thêm 12 "DB seed-master
 * abbreviation" (`visual`, `analytical`, `inhibitory`, …) được thêm vào để seed đang
 * lệch đi qua được cổng — đúng thứ AGENTS.md cấm ("không nới rule chỉ để code hiện tại
 * qua được cổng"). Nới như vậy làm ma trận phủ đo một trục không tồn tại trong spec.
 */
export const CANONICAL_THINKING_TAGS = new Set([
  "observe",
  "compare",
  "sort",
  "match",
  "sequence",
  "infer",
  "predict",
  "plan",
  "recall",
  "inhibit",
  "shift",
  "count",
]);

/**
 * Trục `mechanic` — suy ra từ `game_templates.mechanic`, không nhập tay
 * (content-tagging.md §7.1). Danh sách này phải khớp từng cái một với `mechanic` của
 * mọi template trong registry; `packages/db/tests/gates/thinking-coverage.test.ts` khẳng
 * định điều đó, nên thêm template mới mà quên đăng ký ở đây sẽ làm test đỏ.
 *
 * Các alias snake_case cũ (`drag_drop`, `tap_select`, `matching`, `tracing`,
 * `tap_target`, `tap`) đã bị bỏ: chúng không phải giá trị hợp lệ của trục nào.
 */
export const CANONICAL_MECHANIC_TAGS = new Set([
  "tap-select",
  "tap-select-multi",
  "drag-to-container",
  "sort-groups",
  "pair-match",
  "sequence-order",
  "number-bond",
  "drag-to-slot",
  "clue-deduction",
  "substitution",
  "matrix-choice",
  "flash-recall",
  "maze-route",
  "balance-scale",
  "sudoku-mini",
  "clock-hands",
  "block-stack",
  "listen-respond",
  "rotate-transform",
  "memory-flip",
  "mirror-complete",
  "hidden-object",
  "construct",
  "trace-path",
  "spot-difference",
  "go-nogo",
  "rule-switch",
]);

export const CANONICAL_THEME_TAGS = new Set([
  "farm",
  "jungle",
  "ocean",
  "space",
  "school",
  "home",
  "park",
  "vehicles",
  "food",
  "dino",
  "fairytale",
  "seasons",
  "animal",
  "fruit",
  "vegetable",
  "vehicle",
  "shape",
  "family",
  "weather",
  "festival",
  "body",
  "nature",
]);

export const CLOSED_TAG_VOCABULARY = {
  what: CANONICAL_WHAT_TAGS,
  thinking: CANONICAL_THINKING_TAGS,
  mechanic: CANONICAL_MECHANIC_TAGS,
  theme: CANONICAL_THEME_TAGS,
} as const;

export interface ContentItem {
  id?: number | string;
  code: string;
  kind: "game_level" | "lesson" | "activity";
  status: "draft" | "in_review" | "approved" | "published" | "archived";
  competencyCode: string;
  ageBand: "3-4" | "4-5" | "5-6";
  templateCode?: string;
  mechanicCode?: string;
  whatTags?: string[];
  thinkingTags?: string[];
  themeTag?: string;
  origin?: "human" | "ai_assisted";
}

export interface CellCoverage {
  count: number;
  mechanics: string[];
  nonBasicCount: number;
}

export interface Violation {
  ruleId: string;
  type: "error" | "warning";
  message: string;
  cell?: string;
  expected?: number;
  actual?: number;
  missing?: number;
}

export interface CoverageMatrixResult {
  competencyMatrix: Record<string, Record<string, CellCoverage>>;
  thinkingMatrix: Record<string, number>;
  balanceRatio: {
    maxCompetency: string;
    minCompetency: string;
    maxCount: number;
    minCount: number;
    ratio: number;
  };
  totalPublished: number;
  violations: Violation[];
  passed: boolean;
}

/**
 * Validates a single tag or tag list against closed vocabulary (BR-TCM-01).
 */
export function validateTagVocabulary(
  tags: string[],
  axis: "what" | "thinking" | "mechanic" | "theme"
): { valid: boolean; invalidTags: string[] } {
  const allowedSet = CLOSED_TAG_VOCABULARY[axis];
  const invalidTags = tags.filter((t) => !allowedSet.has(t));
  return {
    valid: invalidTags.length === 0,
    invalidTags,
  };
}

/**
 * Evaluates full thinking coverage matrix over given content items (BR-TCM-01..11).
 */
export function evaluateThinkingCoverage(
  items: ContentItem[],
  config: ThinkingCoverageConfig = DEFAULT_CONFIG
): CoverageMatrixResult {
  const violations: Violation[] = [];
  const competencies = config.activeCompetencies ?? [
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
  ];
  const ageBands: Array<"3-4" | "4-5" | "5-6"> = config.activeAgeBands ?? [
    "3-4",
    "4-5",
    "5-6",
  ];

  const BASIC_TEMPLATE_CODES = new Set([
    "GT-001",
    "GT-002",
    "GT-003",
    "GT-004",
    "GT-005",
    "GT-006",
    "GT-007",
    "GT-008",
  ]);

  // Initialize competency matrix
  const competencyMatrix: Record<string, Record<string, CellCoverage>> = {};
  for (const c of competencies) {
    competencyMatrix[c] = {};
    for (const b of ageBands) {
      competencyMatrix[c][b] = { count: 0, mechanics: [], nonBasicCount: 0 };
    }
  }

  // Initialize thinking matrix
  const thinkingMatrix: Record<string, number> = {};
  for (const t of CANONICAL_THINKING_TAGS) {
    thinkingMatrix[t] = 0;
  }

  // 1. Tag vocabulary validation (BR-TCM-01) on ALL items
  for (const item of items) {
    if (item.whatTags) {
      const { valid, invalidTags } = validateTagVocabulary(
        item.whatTags,
        "what"
      );
      if (!valid) {
        violations.push({
          ruleId: "BR-TCM-01",
          type: "error",
          message: `Item "${item.code}" chứa what_tags ngoài từ vựng đóng: ${invalidTags.join(", ")}`,
        });
      }
    }
    if (item.thinkingTags) {
      const { valid, invalidTags } = validateTagVocabulary(
        item.thinkingTags,
        "thinking"
      );
      if (!valid) {
        violations.push({
          ruleId: "BR-TCM-01",
          type: "error",
          message: `Item "${item.code}" chứa thinking_tags ngoài từ vựng đóng: ${invalidTags.join(", ")}`,
        });
      }
    }
    if (item.mechanicCode) {
      const { valid, invalidTags } = validateTagVocabulary(
        [item.mechanicCode],
        "mechanic"
      );
      if (!valid) {
        violations.push({
          ruleId: "BR-TCM-01",
          type: "error",
          message: `Item "${item.code}" chứa mechanic ngoài từ vựng đóng: ${invalidTags.join(", ")}`,
        });
      }
    }
    if (item.themeTag) {
      const { valid, invalidTags } = validateTagVocabulary(
        [item.themeTag],
        "theme"
      );
      if (!valid) {
        violations.push({
          ruleId: "BR-TCM-01",
          type: "error",
          message: `Item "${item.code}" chứa theme_tag ngoài từ vựng đóng: ${invalidTags.join(", ")}`,
        });
      }
    }
  }

  // 2. Count ONLY published content (BR-TCM-03)
  const publishedItems = items.filter((i) => i.status === "published");
  const publishedLevels = publishedItems.filter((i) => i.kind === "game_level");

  for (const item of publishedLevels) {
    const comp = item.competencyCode;
    const band = item.ageBand;

    if (competencyMatrix[comp]?.[band]) {
      competencyMatrix[comp][band].count++;
      if (
        item.mechanicCode &&
        !competencyMatrix[comp][band].mechanics.includes(item.mechanicCode)
      ) {
        competencyMatrix[comp][band].mechanics.push(item.mechanicCode);
      }
      if (item.templateCode && !BASIC_TEMPLATE_CODES.has(item.templateCode)) {
        competencyMatrix[comp][band].nonBasicCount++;
      }
    }

    if (item.thinkingTags) {
      for (const t of item.thinkingTags) {
        if (thinkingMatrix[t] !== undefined) {
          thinkingMatrix[t]++;
        }
      }
    }
  }

  // 3. Evaluate Competency x AgeBand Floor (BR-TCM-04)
  for (const c of competencies) {
    for (const b of ageBands) {
      const cell = competencyMatrix[c][b];
      const floor = config.gameLevelPerCellFloor;
      if (cell.count < floor) {
        const missing = floor - cell.count;
        violations.push({
          ruleId: "BR-TCM-04",
          type: config.enforceFloors ? "error" : "warning",
          message: `Ô ${c} ${b} có ${cell.count} game level (thiếu ${missing})`,
          cell: `${c} ${b}`,
          expected: floor,
          actual: cell.count,
          missing,
        });
      }
    }
  }

  // 4. Evaluate Mechanics Diversity Floor (BR-TCM-05)
  for (const c of competencies) {
    for (const b of ageBands) {
      const cell = competencyMatrix[c][b];
      const floor = config.mechanicPerCellFloor;
      if (cell.mechanics.length < floor) {
        const missing = floor - cell.mechanics.length;
        violations.push({
          ruleId: "BR-TCM-05",
          type: config.enforceFloors ? "error" : "warning",
          message: `Ô ${c} ${b} có ${cell.mechanics.length} mechanic (${cell.mechanics.join(", ") || "none"}), thiếu ${missing} cơ chế đa dạng (sàn ${floor})`,
          cell: `${c} ${b}`,
          expected: floor,
          actual: cell.mechanics.length,
          missing,
        });
      }

      // BR-TCL-04: Non-basic template requirement per 6x3 cell
      if (cell.nonBasicCount < 1) {
        violations.push({
          ruleId: "BR-TCL-04",
          type: "error",
          message: `Ô ${c} ${b} không có level nào ngoài rổ cơ bản GT-001..GT-008 (BR-TCL-04)`,
          cell: `${c} ${b}`,
          expected: 1,
          actual: cell.nonBasicCount,
          missing: 1,
        });
      }
    }
  }

  // 5. Evaluate Thinking Process Floor (BR-TCM-06)
  for (const [tag, count] of Object.entries(thinkingMatrix)) {
    const floor = config.thinkingTagFloor;
    if (count < floor) {
      const missing = floor - count;
      const isBlocking = config.phase === "P4" && config.enforceFloors;
      violations.push({
        ruleId: "BR-TCM-06",
        type: isBlocking ? "error" : "warning",
        message: `Tiến trình tư duy "${tag}" có ${count} game level (thiếu ${missing}${config.phase === "P3" ? ", cảnh báo P3, chặn từ P4" : ""})`,
        cell: tag,
        expected: floor,
        actual: count,
        missing,
      });
    }
  }

  // 6. Balance Law (BR-TCM-07)
  const competencyTotals = competencies.map((c) => {
    const total = ageBands.reduce(
      (sum, b) => sum + (competencyMatrix[c]?.[b]?.count || 0),
      0
    );
    return { comp: c, total };
  });

  const sortedTotals = [...competencyTotals].sort((a, b) => b.total - a.total);
  const maxEntry = sortedTotals[0] || { comp: "C1", total: 0 };
  const minEntry = sortedTotals.at(-1) || {
    comp: "C1",
    total: 0,
  };
  let ratio = 1;
  if (minEntry.total > 0) {
    ratio = maxEntry.total / minEntry.total;
  } else if (maxEntry.total > 0) {
    ratio = Number.POSITIVE_INFINITY;
  }

  if (ratio > config.balanceRatioCeiling) {
    const isBlocking = config.phase === "P4" && config.enforceFloors;
    violations.push({
      ruleId: "BR-TCM-07",
      type: isBlocking ? "error" : "warning",
      message: `Tỉ lệ cân bằng competency vượt ${config.balanceRatioCeiling} (cao nhất: ${maxEntry.comp}=${maxEntry.total}, thấp nhất: ${minEntry.comp}=${minEntry.total}, ratio: ${ratio.toFixed(2)}${config.phase === "P3" ? ", cảnh báo P3, chặn từ P4" : ""})`,
      expected: config.balanceRatioCeiling,
      actual: ratio,
    });
  }

  const hasErrors = violations.some((v) => v.type === "error");

  return {
    competencyMatrix,
    thinkingMatrix,
    balanceRatio: {
      maxCompetency: maxEntry.comp,
      minCompetency: minEntry.comp,
      maxCount: maxEntry.total,
      minCount: minEntry.total,
      ratio: Number.isFinite(ratio) ? ratio : 0,
    },
    totalPublished: publishedLevels.length,
    violations,
    passed: !hasErrors,
  };
}

/**
 * Formats structured plain-text report according to §7.4 & BR-TCM-09 & BR-TCM-10.
 * Invariant: NEVER output a global percentage string (BR-TCM-09).
 */
export function formatCoverageReport(
  result: CoverageMatrixResult,
  config: ThinkingCoverageConfig = DEFAULT_CONFIG
): string {
  const lines: string[] = [];

  lines.push(
    "================================================================================"
  );
  lines.push("[BÁO CÁO PHỦ TRỤC TƯ DUY]");
  lines.push(
    "Đo độ bao phủ catalog nội dung (BR-TCM-10: không dùng làm bằng chứng sư phạm BR-PED-01)"
  );
  lines.push(
    `Phase: ${config.phase} | Sàn game level: ${config.gameLevelPerCellFloor} | Sàn mechanic: ${config.mechanicPerCellFloor} | Sàn thinking: ${config.thinkingTagFloor}`
  );
  lines.push(
    "================================================================================"
  );
  lines.push("");

  lines.push(`Phủ năng lực (sàn ${config.gameLevelPerCellFloor} game level)`);
  const competencies = Object.keys(result.competencyMatrix);
  for (const c of competencies) {
    const row = result.competencyMatrix[c];
    const parts = Object.entries(row).map(([band, data]) => {
      const diff = config.gameLevelPerCellFloor - data.count;
      const note = diff > 0 ? ` (thiếu ${diff})` : "";
      return `${band}: ${data.count}${note}`;
    });
    lines.push(`  ${c}  ${parts.join("   ")}`);
  }
  lines.push("");

  lines.push(`Đa dạng cơ chế (sàn ${config.mechanicPerCellFloor} mechanic)`);
  for (const c of competencies) {
    const row = result.competencyMatrix[c];
    for (const [band, data] of Object.entries(row)) {
      if (data.mechanics.length < config.mechanicPerCellFloor) {
        const diff = config.mechanicPerCellFloor - data.mechanics.length;
        lines.push(
          `  ${c}  ${band}: ${data.mechanics.length} mechanic (${data.mechanics.join(", ") || "chưa có"}) ← thiếu ${diff}`
        );
      }
    }
  }
  lines.push("");

  lines.push(
    `Phủ tiến trình tư duy (sàn ${config.thinkingTagFloor}, ${config.phase === "P3" ? "chặn từ P4" : "đang áp dụng"})`
  );
  const thinkingEntries = Object.entries(result.thinkingMatrix);
  const thinkingSummary = thinkingEntries
    .map(([tag, count]) => {
      const diff = config.thinkingTagFloor - count;
      const note = diff > 0 ? ` (thiếu ${diff})` : "";
      return `${tag}: ${count}${note}`;
    })
    .join("   ");
  lines.push(`  ${thinkingSummary}`);
  lines.push("");

  if (result.violations.length > 0) {
    const errors = result.violations.filter((v) => v.type === "error");
    const warnings = result.violations.filter((v) => v.type === "warning");

    if (errors.length > 0) {
      lines.push("❌ VI PHẠM SÀN / TỪ VỰNG (CHẶN PUBLISH / COMMIT):");
      for (const err of errors) {
        lines.push(`  - [${err.ruleId}] ${err.message}`);
      }
      lines.push("");
    }

    if (warnings.length > 0) {
      lines.push("⚠️ CẢNH BÁO TIẾN ĐỘ / SÀN PHASE KẾ TIẾP:");
      for (const warn of warnings) {
        lines.push(`  - [${warn.ruleId}] ${warn.message}`);
      }
      lines.push("");
    }
  } else {
    lines.push("✅ Tất cả các ô và từ vựng đạt chuẩn quy định.");
    lines.push("");
  }

  return lines.join("\n");
}
