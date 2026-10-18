/**
 * Cổng kiểm tra cấu trúc tư duy trong bộ dữ liệu kỹ năng (Task #266 / BR-STS-01..11).
 * Spec: `docs/specs/05-content/skill-thinking-structure.md`
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_ACTIVITIES,
  C1_NUMERAL_INVENTORY,
  SKILL_DATASETS,
  SKILL_IDENTITIES,
  THINKING_TAG_NORMALIZE_MAP,
} from "@mindkid/content";

import {
  checkTemplateStructuralAffinity as checkTemplateStructuralAffinityGate,
  type TemplateStructuralAffinityResult,
} from "@mindkid/content-build/gates/skill-template-affinity";
import type {
  DatasetAxis,
  DatasetAxisObject,
  SkillDataset,
  SkillIdentity,
  ThinkingProcess,
} from "@mindkid/shared";

export function checkTemplateStructuralAffinity(
  ...args: Parameters<typeof checkTemplateStructuralAffinityGate>
): TemplateStructuralAffinityResult {
  return checkTemplateStructuralAffinityGate(...args);
}

export const CANONICAL_THINKING_PROCESSES: readonly ThinkingProcess[] = [
  "observe",
  "compare",
  "sort",
  "match",
  "count",
  "sequence",
  "infer",
  "predict",
  "deduce",
  "solve",
  "verify",
  "create",
  "plan",
  "recall",
  "inhibit",
  "shift",
  "describe",
  "listen",
] as const;

export const CANONICAL_THINKING_SET = new Set<string>(
  CANONICAL_THINKING_PROCESSES
);

export interface ThinkingObligationResult {
  readonly passed: boolean;
  readonly missing: string;
}

export interface UnprovenProcessDetail {
  readonly process: ThinkingProcess;
  readonly reason: string;
}

export interface UnprovenSkillDetail {
  readonly skillCode: string;
  readonly competencyCode: string;
  readonly unprovenProcesses: readonly UnprovenProcessDetail[];
}

export interface SkippedSkillDetail {
  readonly skillCode: string;
  readonly reason: string;
}

export interface ActivityTagViolation {
  readonly activityCode: string;
  readonly invalidTag: string;
}

export interface ThinkingStructureReport {
  readonly inspectedSkillsCount: number;
  readonly skippedSkills: readonly SkippedSkillDetail[];
  readonly unprovenSkills: readonly UnprovenSkillDetail[];
  readonly totalUnprovenSkills: number;
  readonly distinctPromptTemplates: number;
  readonly unprovenByCompetency: Record<string, number>;
  readonly unprovenByThinking: Record<string, number>;
  readonly unprovenSkillCodes: readonly string[];
  readonly activityTagViolations: readonly ActivityTagViolation[];
}

export interface ThinkingStructureBaselineData {
  readonly min_inspected_skills: number;
  readonly total_unproven_skills: number;
  readonly distinct_prompt_templates: number;
  readonly unproven_by_competency: Record<string, number>;
  readonly unproven_by_thinking: Record<string, number>;
  readonly unproven_skill_codes: readonly string[];
}

export const BASELINE_PATH = repoPath(
  "scripts",
  "thinking-structure-baseline.json"
);

function isOrderedAxis(axis: DatasetAxis): boolean {
  if (typeof axis === "object" && !Array.isArray(axis)) {
    return (axis as DatasetAxisObject).ordered === true;
  }
  return false;
}

function getAxisValues(axis: DatasetAxis): readonly string[] {
  if (Array.isArray(axis)) {
    return axis;
  }
  return (axis as DatasetAxisObject).values ?? [];
}

// ─── 18 Checkers cho từng ThinkingProcess ────────────────────────────────────

function checkObserve(dataset: SkillDataset): ThinkingObligationResult {
  const hasVisualFacet = dataset.items.some((item) =>
    Boolean(item.glyph || item.image || item.contrast_group)
  );
  if (!hasVisualFacet || dataset.items.length === 0) {
    return {
      passed: false,
      missing:
        "D.items thiếu ItemFacet phân biệt bằng mắt (glyph, image, hoặc contrast_group)",
    };
  }
  return { passed: true, missing: "" };
}

function checkCompare(dataset: SkillDataset): ThinkingObligationResult {
  const hasOrdered = dataset.axes
    ? Object.values(dataset.axes).some(isOrderedAxis)
    : false;
  const hasContrast = dataset.relations
    ? dataset.relations.some((rel) => rel.type === "contrast")
    : false;
  if (!(hasOrdered && hasContrast)) {
    const reasons: string[] = [];
    if (!hasOrdered) {
      reasons.push("thiếu axes có thứ tự (ordered: true)");
    }
    if (!hasContrast) {
      reasons.push("thiếu relations kiểu contrast");
    }
    return { passed: false, missing: `[BR-STS-01] ${reasons.join(", ")}` };
  }
  return { passed: true, missing: "" };
}

function checkSort(dataset: SkillDataset): ThinkingObligationResult {
  if (!dataset.axes || Object.keys(dataset.axes).length === 0) {
    return { passed: false, missing: "[BR-STS-03] thiếu axes phân loại" };
  }
  const failures: string[] = [];
  for (const [axisName, axis] of Object.entries(dataset.axes)) {
    const values = getAxisValues(axis);
    if (values.length < 2) {
      failures.push(
        `trục "${axisName}" có dưới 2 giá trị (${values.length} giá trị)`
      );
      continue;
    }
    for (const v of values) {
      const count = dataset.items.filter(
        (item) => item.category?.[axisName] === v
      ).length;
      if (count < 2) {
        failures.push(
          `trục phân loại "${axisName}" có nhóm "${v}" dưới 2 item (${count} item)`
        );
      }
    }
  }
  if (failures.length > 0) {
    return { passed: false, missing: `[BR-STS-03] ${failures.join("; ")}` };
  }
  return { passed: true, missing: "" };
}

function checkMatch(dataset: SkillDataset): ThinkingObligationResult {
  const hasPair = dataset.relations
    ? dataset.relations.some((rel) => rel.type === "pair")
    : false;
  if (!hasPair) {
    return {
      passed: false,
      missing: "[BR-STS-02] thiếu quan hệ kiểu pair trong relations",
    };
  }
  return { passed: true, missing: "" };
}

function checkCount(dataset: SkillDataset): ThinkingObligationResult {
  const itemValues = new Set(
    dataset.items
      .map((item) => item.value)
      .filter((v): v is number => typeof v === "number")
  );
  if (itemValues.size === 0) {
    return { passed: false, missing: "0 item có trường value" };
  }

  const expectedNumeralValues = C1_NUMERAL_INVENTORY.filter(
    (item) => item.group === dataset.skill_code && item.required
  ).map((item) => item.value);

  if (expectedNumeralValues.length > 0) {
    const missingValues = expectedNumeralValues.filter(
      (v) => !itemValues.has(v)
    );
    if (missingValues.length > 0) {
      return {
        passed: false,
        missing: `tập value chưa phủ trọn khoảng theo c1-numeral (thiếu: ${missingValues.join(", ")})`,
      };
    }
  }

  return { passed: true, missing: "" };
}

function hasNonTrivialOrdering(dataset: SkillDataset): boolean {
  if (!Array.isArray(dataset.ordering) || dataset.ordering.length === 0) {
    return false;
  }
  const declaredIds = dataset.items.map((i) => i.id);
  return (
    dataset.ordering.length !== declaredIds.length ||
    dataset.ordering.some((id, idx) => id !== declaredIds[idx])
  );
}

function checkSequence(dataset: SkillDataset): ThinkingObligationResult {
  const hasSeqRel = dataset.relations
    ? dataset.relations.some((rel) => rel.type === "sequence")
    : false;
  const hasOrdering = hasNonTrivialOrdering(dataset);
  if (!(hasSeqRel || hasOrdering)) {
    return {
      passed: false,
      missing:
        "ordering đúng bằng thứ tự khai báo và không có quan hệ sequence",
    };
  }
  return { passed: true, missing: "" };
}

function checkInfer(dataset: SkillDataset): ThinkingObligationResult {
  const hasSubset = dataset.relations
    ? dataset.relations.some((rel) => rel.type === "subset")
    : false;
  const axesCount = dataset.axes ? Object.keys(dataset.axes).length : 0;
  if (!hasSubset && axesCount < 2) {
    return {
      passed: false,
      missing: "thiếu quan hệ subset hoặc axes dưới 2 trục",
    };
  }
  return { passed: true, missing: "" };
}

function checkPredict(dataset: SkillDataset): ThinkingObligationResult {
  const hasSeqRel = dataset.relations
    ? dataset.relations.some((rel) => rel.type === "sequence")
    : false;
  const hasOrdering = hasNonTrivialOrdering(dataset);
  if (!(hasSeqRel && hasOrdering)) {
    const reasons: string[] = [];
    if (!hasSeqRel) {
      reasons.push("thiếu quan hệ sequence");
    }
    if (!hasOrdering) {
      reasons.push("thiếu ordering có nghĩa");
    }
    return { passed: false, missing: reasons.join(", ") };
  }
  return { passed: true, missing: "" };
}

function checkDeduce(dataset: SkillDataset): ThinkingObligationResult {
  const hasSubset = dataset.relations
    ? dataset.relations.some((rel) => rel.type === "subset")
    : false;
  const axesCount = dataset.axes ? Object.keys(dataset.axes).length : 0;
  if (!hasSubset || axesCount < 2) {
    const reasons: string[] = [];
    if (!hasSubset) {
      reasons.push("thiếu quan hệ subset");
    }
    if (axesCount < 2) {
      reasons.push(`axes chỉ có ${axesCount} trục (đòi ≥2 trục)`);
    }
    return { passed: false, missing: reasons.join(", ") };
  }
  return { passed: true, missing: "" };
}

function checkSolve(dataset: SkillDataset): ThinkingObligationResult {
  const axesCount = dataset.axes ? Object.keys(dataset.axes).length : 0;
  const relCount = dataset.relations ? dataset.relations.length : 0;
  if (axesCount < 2 && relCount < 3) {
    return {
      passed: false,
      missing: `axes có ${axesCount} trục (<2) và relations có ${relCount} quan hệ (<3)`,
    };
  }
  return { passed: true, missing: "" };
}

function checkVerify(dataset: SkillDataset): ThinkingObligationResult {
  if (!dataset.relations || dataset.relations.length === 0) {
    return {
      passed: false,
      missing: "thiếu quan hệ contrast trong relations",
    };
  }
  const itemMap = new Map(dataset.items.map((i) => [i.id, i]));
  const hasNearMissContrast = dataset.relations.some((rel) => {
    if (rel.type !== "contrast") {
      return false;
    }
    if (rel.metadata?.near_miss === true) {
      return true;
    }
    const source = itemMap.get(rel.source_id);
    const target = itemMap.get(rel.target_id);
    return Boolean(
      source?.contrast_group &&
        target?.contrast_group &&
        source.contrast_group === target.contrast_group
    );
  });
  if (!hasNearMissContrast) {
    return {
      passed: false,
      missing:
        "thiếu quan hệ contrast giữa đáp án đúng và đáp án sai gần giống (metadata.near_miss hoặc cùng contrast_group)",
    };
  }
  return { passed: true, missing: "" };
}

function checkCreate(dataset: SkillDataset): ThinkingObligationResult {
  const axesCount = dataset.axes ? Object.keys(dataset.axes).length : 0;
  const itemCount = dataset.items.length;
  if (axesCount < 1 || itemCount < 6) {
    const reasons: string[] = [];
    if (axesCount < 1) {
      reasons.push("thiếu axes (đòi ≥1 trục)");
    }
    if (itemCount < 6) {
      reasons.push(`items chỉ có ${itemCount} (<6)`);
    }
    return { passed: false, missing: reasons.join(", ") };
  }
  return { passed: true, missing: "" };
}

function checkPlan(dataset: SkillDataset): ThinkingObligationResult {
  const hasPlanSeq = dataset.relations
    ? dataset.relations.some(
        (rel) =>
          rel.type === "sequence" &&
          rel.metadata &&
          (typeof rel.metadata.step === "number" ||
            typeof rel.metadata.step === "string")
      )
    : false;
  if (!hasPlanSeq) {
    return {
      passed: false,
      missing: "thiếu quan hệ sequence với metadata.step",
    };
  }
  return { passed: true, missing: "" };
}

function checkRecall(dataset: SkillDataset): ThinkingObligationResult {
  const groups = new Set(
    dataset.items.map((i) => i.contrast_group).filter(Boolean)
  );
  if (groups.size < 2) {
    return {
      passed: false,
      missing: `contrast_group chỉ có ${groups.size} nhóm phân biệt (đòi ≥2)`,
    };
  }
  return { passed: true, missing: "" };
}

function checkInhibit(dataset: SkillDataset): ThinkingObligationResult {
  const groups = new Set(
    dataset.items.map((i) => i.contrast_group).filter(Boolean)
  );
  const hasLure =
    dataset.items.some(
      (i) =>
        i.metadata?.is_lure === true ||
        (i.category && i.category.is_lure === "true")
    ) || dataset.relations?.some((r) => r.metadata?.is_lure === true);
  if (groups.size < 2 || !hasLure) {
    const reasons: string[] = [];
    if (groups.size < 2) {
      reasons.push(`contrast_group có ${groups.size} nhóm (<2)`);
    }
    if (!hasLure) {
      reasons.push("thiếu đánh dấu is_lure");
    }
    return { passed: false, missing: reasons.join(", ") };
  }
  return { passed: true, missing: "" };
}

function checkShift(dataset: SkillDataset): ThinkingObligationResult {
  const axesCount = dataset.axes ? Object.keys(dataset.axes).length : 0;
  if (axesCount < 2) {
    return {
      passed: false,
      missing: `axes chỉ có ${axesCount} trục (đòi ≥2)`,
    };
  }
  return { passed: true, missing: "" };
}

function checkDescribe(dataset: SkillDataset): ThinkingObligationResult {
  const valid =
    dataset.items.length > 0 &&
    dataset.items.every(
      (i) =>
        typeof i.label === "string" &&
        i.label.trim().length > 0 &&
        typeof i.audio_path === "string" &&
        i.audio_path.trim().length > 0
    );
  if (!valid) {
    return {
      passed: false,
      missing: "có item thiếu label hoặc thiếu audio_path",
    };
  }
  return { passed: true, missing: "" };
}

function checkListen(dataset: SkillDataset): ThinkingObligationResult {
  const valid =
    dataset.items.length > 0 &&
    dataset.items.every(
      (i) => typeof i.audio_path === "string" && i.audio_path.trim().length > 0
    );
  if (!valid) {
    return { passed: false, missing: "có item thiếu audio_path" };
  }
  return { passed: true, missing: "" };
}

const OBLIGATION_CHECKERS: Record<
  ThinkingProcess,
  (dataset: SkillDataset) => ThinkingObligationResult
> = {
  observe: checkObserve,
  compare: checkCompare,
  sort: checkSort,
  match: checkMatch,
  count: checkCount,
  sequence: checkSequence,
  infer: checkInfer,
  predict: checkPredict,
  deduce: checkDeduce,
  solve: checkSolve,
  verify: checkVerify,
  create: checkCreate,
  plan: checkPlan,
  recall: checkRecall,
  inhibit: checkInhibit,
  shift: checkShift,
  describe: checkDescribe,
  listen: checkListen,
};

/**
 * Kiểm tra nghĩa vụ dữ liệu theo từng giá trị ThinkingProcess (Mục 7.1 của spec — BR-STS-01).
 */
export function checkThinkingObligation(
  process: ThinkingProcess,
  dataset: SkillDataset
): ThinkingObligationResult {
  const checker = OBLIGATION_CHECKERS[process];
  if (!checker) {
    return {
      passed: false,
      missing: `[BR-STS-01] Không có luật kiểm tra cho ThinkingProcess: "${process}"`,
    };
  }
  return checker(dataset);
}

/**
 * BR-STS-02: SkillDataset.relations bắt buộc khi thinking_processes giao với
 * {match, compare, sequence, deduce, infer}.
 */
export const RELATIONS_REQUIRED_PROCESSES: readonly ThinkingProcess[] = [
  "match",
  "compare",
  "sequence",
  "deduce",
  "infer",
] as const;

export function checkConditionalRelationsRequired(
  thinkingProcesses: readonly ThinkingProcess[],
  dataset: SkillDataset
): ThinkingObligationResult {
  const matched = thinkingProcesses.filter((proc) =>
    RELATIONS_REQUIRED_PROCESSES.includes(proc)
  );
  if (matched.length === 0) {
    return { passed: true, missing: "" };
  }

  if (!dataset.relations || dataset.relations.length === 0) {
    const details = matched
      .map((proc) => checkThinkingObligation(proc, dataset).missing)
      .filter(Boolean)
      .join("; ");
    return {
      passed: false,
      missing: `[BR-STS-02] SkillDataset.relations bắt buộc khác rỗng khi khai báo ${matched.join(", ")}${details ? ` (${details})` : ""}`,
    };
  }

  for (const proc of matched) {
    const res = checkThinkingObligation(proc, dataset);
    if (!res.passed) {
      return {
        passed: false,
        missing: res.missing.includes("[BR-STS-02]")
          ? res.missing
          : `[BR-STS-02] ${res.missing}`,
      };
    }
  }

  return { passed: true, missing: "" };
}

/**
 * BR-STS-03: SkillDataset.axes bắt buộc khi thinking_processes giao với
 * {sort, compare, deduce}.
 */
export const AXES_REQUIRED_PROCESSES: readonly ThinkingProcess[] = [
  "sort",
  "compare",
  "deduce",
] as const;

export function checkConditionalAxesRequired(
  thinkingProcesses: readonly ThinkingProcess[],
  dataset: SkillDataset
): ThinkingObligationResult {
  const matched = thinkingProcesses.filter((proc) =>
    AXES_REQUIRED_PROCESSES.includes(proc)
  );
  if (matched.length === 0) {
    return { passed: true, missing: "" };
  }

  if (!dataset.axes || Object.keys(dataset.axes).length === 0) {
    const details = matched
      .map((proc) => checkThinkingObligation(proc, dataset).missing)
      .filter(Boolean)
      .join("; ");
    return {
      passed: false,
      missing: `[BR-STS-03] SkillDataset.axes bắt buộc khác rỗng khi khai báo ${matched.join(", ")}${details ? ` (${details})` : ""}`,
    };
  }

  for (const proc of matched) {
    const res = checkThinkingObligation(proc, dataset);
    if (!res.passed) {
      return {
        passed: false,
        missing: res.missing.includes("[BR-STS-03]")
          ? res.missing
          : `[BR-STS-03] ${res.missing}`,
      };
    }
  }

  return { passed: true, missing: "" };
}

/**
 * BR-STS-06: Bảng ánh xạ thu hẹp 18 -> 12 tại mục 7.2 của skill-thinking-structure.md.
 */
export const DECLARED_THINKING_NARROWING_MAP: Readonly<
  Record<string, ThinkingProcess>
> = {
  solve: "infer",
  verify: "compare",
  create: "plan",
  listen: "observe",
  describe: "observe",
  deduce: "infer",
};

export function checkThinkingNarrowingMap(
  normalizeMap: Readonly<Record<string, string>> = THINKING_TAG_NORMALIZE_MAP
): string[] {
  const violations: string[] = [];

  for (const [from, to] of Object.entries(normalizeMap)) {
    const declaredTarget = DECLARED_THINKING_NARROWING_MAP[from];
    if (!declaredTarget) {
      violations.push(
        `[BR-STS-06] Ánh xạ thu hẹp "${from}" -> "${to}" trong THINKING_TAG_NORMALIZE_MAP không được khai báo tại mục 7.2 của spec.`
      );
    } else if (declaredTarget !== to) {
      violations.push(
        `[BR-STS-06] Ánh xạ thu hẹp "${from}" trỏ sang "${to}", lệch với mục 7.2 của spec (đòi "${declaredTarget}").`
      );
    }
  }

  for (const [from, expectedTo] of Object.entries(
    DECLARED_THINKING_NARROWING_MAP
  )) {
    if (!(from in normalizeMap)) {
      violations.push(
        `[BR-STS-06] THINKING_TAG_NORMALIZE_MAP thiếu ánh xạ thu hẹp "${from}" -> "${expectedTo}" đã khai ở mục 7.2.`
      );
    }
  }

  return violations;
}

/**
 * BR-STS-07: Các trường được phép trên SkillDataset và SkillPhrasing theo phán quyết mục 7.3.
 * Hai trường phrasing.success_message và phrasing.hint_message đã bị phán quyết xoá.
 */
export const ALLOWED_SKILL_DATASET_FIELDS: ReadonlySet<string> = new Set([
  "skill_code",
  "concept_label",
  "surface",
  "items",
  "relations",
  "ordering",
  "axes",
  "ladder",
  "phrasing",
  "extends",
]);

export const ALLOWED_SKILL_PHRASING_FIELDS: ReadonlySet<string> = new Set([
  "prompt_template",
  "narration_template",
]);

export const REMOVED_SKILL_PHRASING_FIELDS: ReadonlySet<string> = new Set([
  "success_message",
  "hint_message",
]);

function inspectSingleDatasetConsumerFields(
  code: string,
  dataset: SkillDataset,
  violations: string[]
): void {
  for (const key of Object.keys(dataset)) {
    if (!ALLOWED_SKILL_DATASET_FIELDS.has(key)) {
      violations.push(
        `[BR-STS-07] Dataset ${code} chứa trường không có consumer "${key}" ngoài danh mục mục 7.3.`
      );
    }
  }

  if (!dataset.phrasing || typeof dataset.phrasing !== "object") {
    return;
  }

  for (const phrasingKey of Object.keys(dataset.phrasing)) {
    if (REMOVED_SKILL_PHRASING_FIELDS.has(phrasingKey)) {
      violations.push(
        `[BR-STS-07] Dataset ${code} chứa trường đã bị xoá "phrasing.${phrasingKey}" theo phán quyết mục 7.3.`
      );
    } else if (!ALLOWED_SKILL_PHRASING_FIELDS.has(phrasingKey)) {
      violations.push(
        `[BR-STS-07] Dataset ${code} chứa trường không có consumer "phrasing.${phrasingKey}".`
      );
    }
  }
}

export function checkDatasetConsumerFields(
  datasets: Readonly<Record<string, SkillDataset>> = SKILL_DATASETS
): string[] {
  const violations: string[] = [];
  for (const [code, dataset] of Object.entries(datasets)) {
    inspectSingleDatasetConsumerFields(code, dataset, violations);
  }
  return violations;
}

export interface ActivitySeedLike {
  readonly header: {
    readonly code: string;
    readonly thinking_tags: readonly string[];
  };
}

function checkActivityThinkingTags(
  activities: readonly ActivitySeedLike[]
): ActivityTagViolation[] {
  const violations: ActivityTagViolation[] = [];
  for (const act of activities) {
    for (const tag of act.header.thinking_tags) {
      if (!CANONICAL_THINKING_SET.has(tag)) {
        violations.push({
          activityCode: act.header.code,
          invalidTag: tag,
        });
      }
    }
  }
  return violations;
}

function inspectSkillProcesses(
  identity: SkillIdentity,
  dataset: SkillDataset
): UnprovenProcessDetail[] {
  const failed: UnprovenProcessDetail[] = [];
  for (const proc of identity.thinking_processes) {
    const result = checkThinkingObligation(proc, dataset);
    if (!result.passed) {
      failed.push({
        process: proc,
        reason: result.missing,
      });
    }
  }
  return failed;
}

/**
 * Đo toàn bộ cấu trúc tư duy trên corpus kỹ năng và activities (BR-STS-01..11).
 */
export function measureThinkingStructure(
  identities: Record<string, SkillIdentity> = SKILL_IDENTITIES,
  datasets: Record<string, SkillDataset> = SKILL_DATASETS,
  activities: readonly ActivitySeedLike[] = ALL_ACTIVITIES
): ThinkingStructureReport {
  const unprovenSkills: UnprovenSkillDetail[] = [];
  const skippedSkills: SkippedSkillDetail[] = [];
  const unprovenByCompetency: Record<string, number> = {
    C1: 0,
    C2: 0,
    C3: 0,
    C4: 0,
    C5: 0,
    C6: 0,
  };
  const unprovenByThinking: Record<string, number> = {};
  for (const proc of CANONICAL_THINKING_PROCESSES) {
    unprovenByThinking[proc] = 0;
  }

  const promptTemplates = new Set<string>();
  let inspectedSkillsCount = 0;

  for (const [code, identity] of Object.entries(identities)) {
    const dataset = datasets[code];
    if (!dataset) {
      skippedSkills.push({
        skillCode: code,
        reason: "Không tìm thấy dataset tương ứng trong SKILL_DATASETS",
      });
      continue;
    }

    inspectedSkillsCount++;
    if (dataset.phrasing?.prompt_template) {
      promptTemplates.add(dataset.phrasing.prompt_template);
    }

    const failedProcesses = inspectSkillProcesses(identity, dataset);
    for (const failed of failedProcesses) {
      unprovenByThinking[failed.process] =
        (unprovenByThinking[failed.process] ?? 0) + 1;
    }

    if (failedProcesses.length > 0) {
      unprovenSkills.push({
        skillCode: code,
        competencyCode: identity.competency_code,
        unprovenProcesses: failedProcesses,
      });
      const comp = identity.competency_code;
      if (comp in unprovenByCompetency) {
        unprovenByCompetency[comp] = (unprovenByCompetency[comp] ?? 0) + 1;
      }
    }
  }

  return {
    inspectedSkillsCount,
    skippedSkills,
    unprovenSkills,
    totalUnprovenSkills: unprovenSkills.length,
    distinctPromptTemplates: promptTemplates.size,
    unprovenByCompetency,
    unprovenByThinking,
    unprovenSkillCodes: unprovenSkills.map((u) => u.skillCode),
    activityTagViolations: checkActivityThinkingTags(activities),
  };
}

export type BaselineJsonCandidate =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly BaselineJsonCandidate[]
  | { readonly [key: string]: BaselineJsonCandidate };

export function assertBaselineShape(
  raw: BaselineJsonCandidate | ThinkingStructureBaselineData
): asserts raw is ThinkingStructureBaselineData {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Baseline không phải đối tượng JSON hợp lệ");
  }
  const obj = raw as Record<string, BaselineJsonCandidate>;
  const requiredKeys = [
    "min_inspected_skills",
    "total_unproven_skills",
    "distinct_prompt_templates",
    "unproven_by_competency",
    "unproven_by_thinking",
    "unproven_skill_codes",
  ] as const;

  for (const key of requiredKeys) {
    if (!(key in obj)) {
      throw new Error(`Baseline thiếu khoá bắt buộc: "${key}"`);
    }
  }

  if (typeof obj.min_inspected_skills !== "number") {
    throw new Error("Baseline sai kiểu: min_inspected_skills phải là số");
  }
  if (typeof obj.total_unproven_skills !== "number") {
    throw new Error("Baseline sai kiểu: total_unproven_skills phải là số");
  }
  if (typeof obj.distinct_prompt_templates !== "number") {
    throw new Error("Baseline sai kiểu: distinct_prompt_templates phải là số");
  }
  if (
    typeof obj.unproven_by_competency !== "object" ||
    obj.unproven_by_competency === null ||
    Array.isArray(obj.unproven_by_competency)
  ) {
    throw new Error("Baseline sai kiểu: unproven_by_competency phải là object");
  }
  if (
    typeof obj.unproven_by_thinking !== "object" ||
    obj.unproven_by_thinking === null ||
    Array.isArray(obj.unproven_by_thinking)
  ) {
    throw new Error("Baseline sai kiểu: unproven_by_thinking phải là object");
  }
  if (!Array.isArray(obj.unproven_skill_codes)) {
    throw new Error("Baseline sai kiểu: unproven_skill_codes phải là mảng");
  }
}

export function readBaseline(
  filePath: string = BASELINE_PATH
): ThinkingStructureBaselineData {
  if (!existsSync(filePath)) {
    throw new Error(`Không tìm thấy baseline file: ${filePath}`);
  }
  const content = readFileSync(filePath, "utf-8");
  const parsed: BaselineJsonCandidate = JSON.parse(content);
  assertBaselineShape(parsed);
  return parsed;
}

export function loadBaseline(
  filePath: string = BASELINE_PATH
): ThinkingStructureBaselineData | null {
  try {
    return readBaseline(filePath);
  } catch {
    return null;
  }
}

export function saveBaseline(
  data: ThinkingStructureBaselineData,
  filePath: string = BASELINE_PATH
): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function checkRatchetViolations(
  report: ThinkingStructureReport,
  baseline: ThinkingStructureBaselineData
): string[] {
  const violations: string[] = [];

  if (report.inspectedSkillsCount < baseline.min_inspected_skills) {
    violations.push(
      `[BR-STS-11] Số kỹ năng được kiểm tra bị giảm: ${report.inspectedSkillsCount} < baseline ${baseline.min_inspected_skills}.`
    );
  }

  if (report.distinctPromptTemplates < baseline.distinct_prompt_templates) {
    violations.push(
      `[BR-STS-09] Số prompt_template phân biệt bị giảm: hiện có ${report.distinctPromptTemplates}, baseline yêu cầu ≥ ${baseline.distinct_prompt_templates}.`
    );
  }

  if (report.totalUnprovenSkills > baseline.total_unproven_skills) {
    violations.push(
      `[BR-STS-11] Tổng số kỹ năng chưa chứng minh tăng: ${report.totalUnprovenSkills} > baseline ${baseline.total_unproven_skills}.`
    );
  }

  const baselineUnprovenSet = new Set(baseline.unproven_skill_codes);
  const newlyUnproven = report.unprovenSkills.filter(
    (u) => !baselineUnprovenSet.has(u.skillCode)
  );
  if (newlyUnproven.length > 0) {
    const detailedList = newlyUnproven
      .map(
        (u) =>
          `${u.skillCode} (${u.unprovenProcesses.map((p) => `${p.process}: ${p.reason}`).join("; ")})`
      )
      .join(", ");
    violations.push(
      `[BR-STS-11] Phát hiện kỹ năng mới rơi vào nợ: ${detailedList}`
    );
  }

  for (const proc of CANONICAL_THINKING_PROCESSES) {
    const curr = report.unprovenByThinking[proc] ?? 0;
    const base = baseline.unproven_by_thinking[proc] ?? 0;
    if (curr > base) {
      violations.push(
        `[BR-STS-11] Nợ kỹ năng chưa chứng minh cho "${proc}" tăng: ${curr} > baseline ${base}.`
      );
    }
  }

  for (const comp of ["C1", "C2", "C3", "C4", "C5", "C6"]) {
    const curr = report.unprovenByCompetency[comp] ?? 0;
    const base = baseline.unproven_by_competency[comp] ?? 0;
    if (curr > base) {
      violations.push(
        `[BR-STS-11] Nợ kỹ năng chưa chứng minh cho "${comp}" tăng: ${curr} > baseline ${base}.`
      );
    }
  }

  return violations;
}

function printUnprovenDetails(
  report: ThinkingStructureReport,
  baseline: ThinkingStructureBaselineData,
  isVerbose: boolean
): void {
  const baselineUnprovenSet = new Set(baseline.unproven_skill_codes);
  const newlyUnproven = report.unprovenSkills.filter(
    (u) => !baselineUnprovenSet.has(u.skillCode)
  );
  if (newlyUnproven.length > 0) {
    console.error(
      `\n❌ [check-thinking-structure] ${newlyUnproven.length} kỹ năng mới rơi vào nợ:`
    );
    for (const item of newlyUnproven) {
      console.error(`   • ${item.skillCode} (${item.competencyCode}):`);
      for (const p of item.unprovenProcesses) {
        console.error(`       - ${p.process}: ${p.reason}`);
      }
    }
  }

  if (isVerbose) {
    console.log("\n📋 Chi tiết các kỹ năng chưa chứng minh:");
    for (const item of report.unprovenSkills) {
      console.log(`   • ${item.skillCode} (${item.competencyCode}):`);
      for (const p of item.unprovenProcesses) {
        console.log(`       - ${p.process}: ${p.reason}`);
      }
    }
  }
}

function handleInitBaseline(
  report: ThinkingStructureReport,
  baselinePath: string
): {
  exitCode: number;
  report: ThinkingStructureReport;
  violations: string[];
} {
  const newBaseline: ThinkingStructureBaselineData = {
    min_inspected_skills: report.inspectedSkillsCount,
    total_unproven_skills: report.totalUnprovenSkills,
    distinct_prompt_templates: report.distinctPromptTemplates,
    unproven_by_competency: report.unprovenByCompetency,
    unproven_by_thinking: report.unprovenByThinking,
    unproven_skill_codes: report.unprovenSkillCodes,
  };
  saveBaseline(newBaseline, baselinePath);
  console.log(
    `✨ [check-thinking-structure] Tạo baseline ban đầu tại ${baselinePath}: duyệt ${report.inspectedSkillsCount} kỹ năng, nợ ${report.totalUnprovenSkills} kỹ năng, ${report.distinctPromptTemplates} prompt phân biệt.`
  );
  return { exitCode: 0, report, violations: [] };
}

function handleUpdateBaseline(
  report: ThinkingStructureReport,
  baseline: ThinkingStructureBaselineData,
  violations: string[],
  baselinePath: string,
  isForce: boolean
): {
  exitCode: number;
  report: ThinkingStructureReport;
  violations: string[];
} {
  if (violations.length > 0 && !isForce) {
    console.error(
      "❌ [check-thinking-structure] Cấm nâng baseline khi có vi phạm tăng nợ (dùng --force nếu có lý do chính đáng)."
    );
    return { exitCode: 1, report, violations };
  }
  const updatedBaseline: ThinkingStructureBaselineData = {
    min_inspected_skills: Math.max(
      baseline.min_inspected_skills,
      report.inspectedSkillsCount
    ),
    total_unproven_skills: report.totalUnprovenSkills,
    distinct_prompt_templates: report.distinctPromptTemplates,
    unproven_by_competency: report.unprovenByCompetency,
    unproven_by_thinking: report.unprovenByThinking,
    unproven_skill_codes: report.unprovenSkillCodes,
  };
  saveBaseline(updatedBaseline, baselinePath);
  console.log(
    `✅ [check-thinking-structure] Đã cập nhật baseline: duyệt tối thiểu ${updatedBaseline.min_inspected_skills} kỹ năng, nợ ${report.totalUnprovenSkills} kỹ năng, ${report.distinctPromptTemplates} prompt templates.`
  );
  return { exitCode: 0, report, violations: [] };
}

function checkActivityTagViolations(report: ThinkingStructureReport): string[] {
  if (report.activityTagViolations.length === 0) {
    return [];
  }
  const violations = report.activityTagViolations.map(
    (v) =>
      `[BR-STS-08] Activity ${v.activityCode} khai thinking_tags ngoài union ThinkingProcess: "${v.invalidTag}"`
  );
  for (const msg of violations) {
    console.error(`❌ ${msg}`);
  }
  return violations;
}

function tryReadBaseline(baselinePath: string): {
  baseline?: ThinkingStructureBaselineData;
  error?: string;
} {
  try {
    return { baseline: readBaseline(baselinePath) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ [check-thinking-structure] Lỗi đọc baseline: ${message}`);
    return { error: message };
  }
}

function evaluateViolationsResult(
  report: ThinkingStructureReport,
  baseline: ThinkingStructureBaselineData,
  violations: string[]
): {
  exitCode: number;
  report: ThinkingStructureReport;
  violations: string[];
} {
  if (violations.length > 0) {
    for (const msg of violations) {
      console.error(`❌ ${msg}`);
    }
    return { exitCode: 1, report, violations };
  }

  console.log(
    `✅ [check-thinking-structure] Đạt yêu cầu ratchet (duyệt: ${report.inspectedSkillsCount}/${baseline.min_inspected_skills}, nợ: ${report.totalUnprovenSkills}/${baseline.total_unproven_skills} kỹ năng, prompt: ${report.distinctPromptTemplates}/${baseline.distinct_prompt_templates}).`
  );
  return { exitCode: 0, report, violations: [] };
}

export function runThinkingStructureCheck(options?: {
  isInit?: boolean;
  isUpdate?: boolean;
  isForce?: boolean;
  isVerbose?: boolean;
  baselinePath?: string;
  identities?: Record<string, SkillIdentity>;
  datasets?: Record<string, SkillDataset>;
  activities?: readonly ActivitySeedLike[];
  normalizeMap?: Readonly<Record<string, string>>;
}): {
  exitCode: number;
  report: ThinkingStructureReport;
  violations: string[];
} {
  const isInit = options?.isInit ?? false;
  const isUpdate = options?.isUpdate ?? false;
  const isForce = options?.isForce ?? false;
  const isVerbose = options?.isVerbose ?? false;
  const baselinePath = options?.baselinePath ?? BASELINE_PATH;

  const report = measureThinkingStructure(
    options?.identities,
    options?.datasets,
    options?.activities
  );

  console.log(
    `📊 [check-thinking-structure] Duyệt: ${report.inspectedSkillsCount} kỹ năng. Bỏ qua: ${report.skippedSkills.length} kỹ năng.`
  );
  for (const skip of report.skippedSkills) {
    console.warn(`   ⚠️ Bỏ qua ${skip.skillCode}: ${skip.reason}`);
  }

  const narrowingViolations = checkThinkingNarrowingMap(options?.normalizeMap);
  const consumerFieldViolations = checkDatasetConsumerFields(options?.datasets);
  const tagViolations = checkActivityTagViolations(report);
  const structuralGateViolations = [
    ...narrowingViolations,
    ...consumerFieldViolations,
    ...tagViolations,
  ];
  if (structuralGateViolations.length > 0) {
    for (const msg of [...narrowingViolations, ...consumerFieldViolations]) {
      console.error(`❌ ${msg}`);
    }
    return { exitCode: 1, report, violations: structuralGateViolations };
  }

  if (isInit) {
    return handleInitBaseline(report, baselinePath);
  }

  const { baseline, error } = tryReadBaseline(baselinePath);
  if (!baseline) {
    return { exitCode: 1, report, violations: [error ?? "Lỗi đọc baseline"] };
  }

  const violations = checkRatchetViolations(report, baseline);
  printUnprovenDetails(report, baseline, isVerbose);

  if (isUpdate) {
    return handleUpdateBaseline(
      report,
      baseline,
      violations,
      baselinePath,
      isForce
    );
  }

  return evaluateViolationsResult(report, baseline, violations);
}

function main(): void {
  const args = process.argv.slice(2);
  const isInit = args.includes("--init");
  const isUpdate = args.includes("--update");
  const isForce = args.includes("--force");
  const isVerbose = args.includes("--verbose");

  let baselinePath = BASELINE_PATH;
  const baselineIdx = args.indexOf("--baseline");
  const specifiedBaseline = args[baselineIdx + 1];
  if (baselineIdx !== -1 && specifiedBaseline) {
    baselinePath = specifiedBaseline;
  }

  const { exitCode } = runThinkingStructureCheck({
    isInit,
    isUpdate,
    isForce,
    isVerbose,
    baselinePath,
  });
  const elapsed = process.uptime().toFixed(2);
  console.log(`⏱️ Thời gian thực thi: ${elapsed}s`);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

if (process.argv[1]?.endsWith("check-thinking-structure.ts")) {
  main();
}
