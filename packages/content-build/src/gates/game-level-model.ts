import { validateContentSkillMap } from "@mindkid/db";
import {
  CANONICAL_THEME_CODES,
  getTheme,
  isEmojiInCatalog,
} from "@mindkid/shared";
import type { ContentSeed, GateIssue, GateResult } from "#src/types";

export interface SkillWeightEntry {
  skill_code: string;
  weight: number;
}

const PRIMARY_SKILL_WEIGHT = 1.0;
const SECONDARY_SKILL_WEIGHT = 0.3;
const REPLICA_ITEM_ID_SUFFIX_REGEX = /_(?:[td]\d+|copy\d*)$/i;
const GENERIC_OPTION_ID_REGEX = /^(?:opt|option|item|choice|cand)?[-_]?\d+$/i;

type SeedNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly SeedNode[]
  | { readonly [key: string]: SeedNode }
  | object;

type SeedRecord = Record<string, SeedNode>;
type SeedInput = ContentSeed["content_pack"];

function isRecord(value: SeedInput): value is SeedRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * BR-GLM-01: Mỗi level ánh xạ về đúng 1 skill chính (weight = 1.0);
 * skill phụ nếu có mang weight < 1.0 (mặc định 0.3).
 */
export function buildLevelSkillWeightEntries(
  level: ContentSeed,
  customWeights?: readonly number[]
): SkillWeightEntry[] {
  const codes = level.header.skill_codes ?? [];
  return codes.map((code, index) => ({
    skill_code: code,
    weight:
      customWeights?.[index] ??
      (index === 0 ? PRIMARY_SKILL_WEIGHT : SECONDARY_SKILL_WEIGHT),
  }));
}

export function checkPrimarySkillWeight(
  level: ContentSeed,
  customWeights?: readonly number[]
): GateIssue[] {
  const issues: GateIssue[] = [];
  const entries = buildLevelSkillWeightEntries(level, customWeights);

  if (entries.length === 0) {
    issues.push({
      code: "PRIMARY_SKILL_MISSING",
      message: `Level '${level.header.code}' không có skill_codes nào (BR-GLM-01).`,
    });
    return issues;
  }

  const seenCodes = new Set<string>();
  for (const entry of entries) {
    if (seenCodes.has(entry.skill_code)) {
      issues.push({
        code: "SKILL_CODE_DUPLICATE_IN_LEVEL",
        message: `Level '${level.header.code}' lặp lại mã kỹ năng '${entry.skill_code}' (BR-GLM-01).`,
      });
    }
    seenCodes.add(entry.skill_code);
  }

  try {
    validateContentSkillMap(
      entries.map((entry, idx) => ({
        skillId: idx + 1,
        weight: entry.weight,
      }))
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ánh xạ trọng số kỹ năng không hợp lệ.";
    issues.push({
      code: "PRIMARY_SKILL_WEIGHT_INVALID",
      message: `Level '${level.header.code}': ${message}`,
    });
  }

  return issues;
}

function normalizeBaseItemId(rawId: string): string {
  return rawId.replace(REPLICA_ITEM_ID_SUFFIX_REGEX, "");
}

function isGenericOptionId(rawId: string): boolean {
  return rawId.length === 0 || GENERIC_OPTION_ID_REGEX.test(rawId);
}

function extractAssetRefValue(asset: SeedRecord): string {
  for (const key of ["ref", "text", "path", "label"]) {
    const val = asset[key];
    if (typeof val === "string") {
      return val;
    }
  }
  if (typeof asset.value === "string" || typeof asset.value === "number") {
    return String(asset.value);
  }
  return "";
}

function extractAssetSignature(asset: SeedRecord): string {
  const kind = typeof asset.kind === "string" ? asset.kind : "";
  const ref = extractAssetRefValue(asset);
  const audio =
    typeof asset.audio_path === "string" ? `|audio:${asset.audio_path}` : "";
  return `asset:${kind}:${ref}${audio}`;
}

function extractOptionSignature(item: SeedRecord): string {
  const parts: string[] = [];
  if (isRecord(item.asset)) {
    parts.push(extractAssetSignature(item.asset));
  }
  for (const key of [
    "value",
    "number",
    "count",
    "quantity",
    "label",
    "text",
    "color",
    "size",
    "shape",
    "angle",
    "position",
    "state",
    "weight",
    "length",
    "height",
  ]) {
    if (item[key] !== undefined && item[key] !== null) {
      parts.push(`${key}:${String(item[key])}`);
    }
  }
  return parts.join("|");
}

function buildCorrectOptionSets(correctItems: readonly SeedRecord[]): {
  correctBaseIds: Set<string>;
  correctSignatures: Set<string>;
} {
  const correctBaseIds = new Set<string>();
  const correctSignatures = new Set<string>();
  for (const c of correctItems) {
    const rawId = typeof c.item_id === "string" ? c.item_id : "";
    if (rawId.length > 0 && !isGenericOptionId(rawId)) {
      correctBaseIds.add(normalizeBaseItemId(rawId));
    }
    const sig = extractOptionSignature(c);
    if (sig.length > 0) {
      correctSignatures.add(sig);
    }
  }
  return { correctBaseIds, correctSignatures };
}

function checkDistractorItemCollision(
  distractor: SeedRecord,
  correctBaseIds: Set<string>,
  correctSignatures: Set<string>,
  levelCode: string,
  fieldLabel: string
): GateIssue | undefined {
  const rawId =
    typeof distractor.item_id === "string" ? distractor.item_id : "";
  const baseId = normalizeBaseItemId(rawId);
  if (
    rawId.length > 0 &&
    !isGenericOptionId(rawId) &&
    correctBaseIds.has(baseId)
  ) {
    return {
      code: "DISTRACTOR_COLLIDES_WITH_CORRECT",
      message: `Level '${levelCode}' (${fieldLabel}): nhiễu '${rawId}' trùng vật chuẩn '${baseId}' với đáp án đúng (BR-GLM-03).`,
    };
  }
  if (isGenericOptionId(rawId)) {
    const sig = extractOptionSignature(distractor);
    if (sig.length > 0 && correctSignatures.has(sig)) {
      return {
        code: "DISTRACTOR_COLLIDES_WITH_CORRECT",
        message: `Level '${levelCode}' (${fieldLabel}): nhiễu có chữ ký '${sig}' trùng hệt đáp án đúng (BR-GLM-03).`,
      };
    }
  }
  return undefined;
}

function inspectFlaggedOptionArray(
  items: readonly SeedNode[],
  levelCode: string,
  fieldLabel: string,
  issues: GateIssue[]
): void {
  const flaggedItems = items
    .filter(isRecord)
    .filter((item) => typeof item.is_correct === "boolean");
  if (flaggedItems.length < 2) {
    return;
  }
  const correctItems = flaggedItems.filter((item) => item.is_correct === true);
  const distractorItems = flaggedItems.filter(
    (item) => item.is_correct === false
  );
  if (correctItems.length === 0 || distractorItems.length === 0) {
    return;
  }
  const { correctBaseIds, correctSignatures } =
    buildCorrectOptionSets(correctItems);
  for (const d of distractorItems) {
    const issue = checkDistractorItemCollision(
      d,
      correctBaseIds,
      correctSignatures,
      levelCode,
      fieldLabel
    );
    if (issue) {
      issues.push(issue);
    }
  }
}

function inspectExplicitDistractorsArray(
  pack: SeedRecord,
  levelCode: string,
  contextLabel: string,
  issues: GateIssue[]
): void {
  if (!Array.isArray(pack.distractors)) {
    return;
  }
  const answerCandidates = [
    pack.correct_answer,
    pack.answer,
    pack.target,
    pack.target_value,
    pack.target_number,
    pack.target_count,
  ].filter((v) => v !== undefined && v !== null);

  for (const distractor of pack.distractors) {
    const dJson = JSON.stringify(distractor);
    for (const ans of answerCandidates) {
      if (dJson === JSON.stringify(ans)) {
        issues.push({
          code: "DISTRACTOR_COLLIDES_WITH_CORRECT",
          message: `Level '${levelCode}' (${contextLabel}.distractors): phần tử nhiễu '${dJson}' trùng đáp án đúng (BR-GLM-03).`,
        });
      }
    }
  }
}

function inspectPackDistractors(
  pack: SeedRecord,
  levelCode: string,
  contextLabel: string,
  issues: GateIssue[]
): void {
  for (const [key, value] of Object.entries(pack)) {
    if (Array.isArray(value)) {
      inspectFlaggedOptionArray(
        value,
        levelCode,
        `${contextLabel}.${key}`,
        issues
      );
    }
  }
  inspectExplicitDistractorsArray(pack, levelCode, contextLabel, issues);
}

/**
 * BR-GLM-03: Khi có đáp án đúng/sai, tập nhiễu (distractor) phải khác rõ tập đúng.
 */
export function checkDistractorDistinctness(level: ContentSeed): GateIssue[] {
  const issues: GateIssue[] = [];
  if (isRecord(level.content_pack)) {
    inspectPackDistractors(
      level.content_pack,
      level.header.code,
      "content_pack",
      issues
    );
  }
  if (Array.isArray(level.rounds)) {
    for (const [idx, round] of level.rounds.entries()) {
      if (isRecord(round.content_pack)) {
        inspectPackDistractors(
          round.content_pack,
          level.header.code,
          `rounds[${idx}]`,
          issues
        );
      }
    }
  }
  return issues;
}

function collectEmojiRefsFromNode(node: SeedInput, out: string[]): void {
  if (!(isRecord(node) || Array.isArray(node))) {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectEmojiRefsFromNode(item, out);
    }
    return;
  }
  if (node.kind === "emoji" && typeof node.ref === "string") {
    out.push(node.ref);
  }
  for (const [key, val] of Object.entries(node)) {
    if (
      (key === "emoji" || key.endsWith("_emoji")) &&
      typeof val === "string"
    ) {
      out.push(val);
    } else if (isRecord(val) || Array.isArray(val)) {
      collectEmojiRefsFromNode(val, out);
    }
  }
}

/**
 * BR-GLM-06: Emoji sử dụng trong content_pack / rounds phải thuộc registry @mindkid/emoji.
 */
export function checkEmojiInRegistry(level: ContentSeed): GateIssue[] {
  const issues: GateIssue[] = [];
  const refs: string[] = [];
  collectEmojiRefsFromNode(level.content_pack, refs);
  if (Array.isArray(level.rounds)) {
    for (const round of level.rounds) {
      collectEmojiRefsFromNode(round.content_pack, refs);
    }
  }
  const uniqueRefs = new Set(refs);
  for (const ref of uniqueRefs) {
    if (!isEmojiInCatalog(ref)) {
      issues.push({
        code: "EMOJI_NOT_IN_REGISTRY",
        message: `Level '${level.header.code}': emoji '${ref}' không thuộc registry @mindkid/emoji (BR-GLM-06).`,
      });
    }
  }
  return issues;
}

const QUANTITY_KEYS = new Set([
  "count",
  "target_count",
  "item_count",
  "quantity",
  "total_count",
  "number",
  "target_number",
  "round_id",
  "prompt",
]);

function normalizeQuantityInvariantValue(value: SeedInput): SeedNode {
  if (Array.isArray(value)) {
    const byJson = new Map<string, SeedNode>();
    for (const item of value) {
      const normalized = normalizeQuantityInvariantValue(item);
      byJson.set(JSON.stringify(normalized), normalized);
    }
    const sortedKeys = Array.from(byJson.keys()).sort();
    return sortedKeys.map((k) => byJson.get(k) ?? null);
  }
  if (isRecord(value)) {
    const sortedKeys = Object.keys(value)
      .filter((k) => !QUANTITY_KEYS.has(k))
      .sort();
    const result: SeedRecord = {};
    for (const k of sortedKeys) {
      result[k] = normalizeQuantityInvariantValue(value[k]);
    }
    return result;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }
  return String(value);
}

/**
 * Tạo chữ ký nội dung bỏ qua số lượng thuần tuý để phát hiện hai level cùng skill,
 * cùng cơ chế (template_code) và cùng ngữ cảnh (theme_tag) chỉ thay số lượng
 * nhưng giữ nguyên tập vật liệu & cấu trúc (BR-GLM-07).
 */
export function computeSkillContentSignature(level: ContentSeed): string {
  const primarySkill = level.header.skill_codes[0] ?? "";
  const templateCode = level.header.template_code;
  const themeTag = level.header.theme_tag ?? "";
  const sourcePayload =
    Array.isArray(level.rounds) && level.rounds.length > 0
      ? level.rounds.map((r) => r.content_pack)
      : level.content_pack;
  const normalized = normalizeQuantityInvariantValue(sourcePayload);
  return `${primarySkill}::${templateCode}::${themeTag}::${JSON.stringify(normalized)}`;
}

/**
 * BR-GLM-07 & AC §9: Kiểm tra một level có trùng nội dung (bỏ qua số lượng)
 * với bất kỳ level nào đã có trong cùng kỹ năng chính hay không.
 */
export function findDuplicateLevelInSameSkill(
  candidate: ContentSeed,
  existingLevels: readonly ContentSeed[]
): ContentSeed | undefined {
  const primarySkill = candidate.header.skill_codes[0];
  if (!primarySkill) {
    return undefined;
  }
  const candidateSig = computeSkillContentSignature(candidate);
  for (const existing of existingLevels) {
    if (existing.header.code === candidate.header.code) {
      continue;
    }
    if (existing.header.skill_codes[0] !== primarySkill) {
      continue;
    }
    if (computeSkillContentSignature(existing) === candidateSig) {
      return existing;
    }
  }
  return undefined;
}

export function checkDuplicateLevelsInSkill(
  levels: readonly ContentSeed[]
): GateIssue[] {
  const issues: GateIssue[] = [];
  const seenBySignature = new Map<string, string>();

  for (const level of levels) {
    const sig = computeSkillContentSignature(level);
    const existingCode = seenBySignature.get(sig);
    if (existingCode && existingCode !== level.header.code) {
      issues.push({
        code: "DUPLICATE_CONTENT_IN_SKILL",
        message: `Level '${level.header.code}' trùng nội dung trong cùng kỹ năng với mã bản trùng '${existingCode}' (BR-GLM-07).`,
      });
    } else {
      seenBySignature.set(sig, level.header.code);
    }
  }

  return issues;
}

/**
 * Cổng 6 mở rộng cho BR-GLM-07 (AC §9): khi kiểm một level so với tập level cùng đợt,
 * nếu trùng nội dung trong cùng skill thì loại kèm mã bản trùng.
 */
export function checkGate6WithSkillDedup(
  candidate: ContentSeed,
  existingLevels: readonly ContentSeed[]
): GateResult {
  const issues: GateIssue[] = [];
  const { header } = candidate;

  if (
    !header.origin ||
    (header.origin !== "human" && header.origin !== "ai_assisted")
  ) {
    issues.push({
      code: "ORIGIN_INVALID",
      message: `origin phải là 'human' hoặc 'ai_assisted' (nhận: ${header.origin}).`,
    });
  }

  const dup = findDuplicateLevelInSameSkill(candidate, existingLevels);
  if (dup) {
    issues.push({
      code: "DUPLICATE_CONTENT_IN_SKILL",
      message: `Level '${candidate.header.code}' trùng nội dung trong cùng kỹ năng với mã bản trùng '${dup.header.code}' (BR-GLM-07).`,
    });
  }

  return {
    gate: 6,
    name: "Xuất xứ & Chống trùng lặp",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

export type DifficultyAxis = "quantity" | "distractor" | "speed" | "steps";

function extractEffectiveQuantity(params: SeedRecord): number | undefined {
  for (const key of [
    "target_count",
    "slot_count",
    "part_count",
    "pair_count",
    "group_count",
  ]) {
    const val = params[key];
    if (typeof val === "number") {
      return val;
    }
  }
  const itemCount = params.item_count;
  const distractorCount = params.distractor_count;
  if (typeof itemCount === "number" && typeof distractorCount === "number") {
    return Math.max(1, itemCount - distractorCount);
  }
  if (typeof itemCount === "number") {
    return itemCount;
  }
  if (typeof params.count_limit === "number") {
    return params.count_limit;
  }
  return undefined;
}

function extractEffectiveDistractor(params: SeedRecord): number | undefined {
  if (typeof params.distractor_count === "number") {
    return params.distractor_count;
  }
  if (typeof params.candidate_count === "number") {
    const qty = extractEffectiveQuantity(params) ?? 1;
    return Math.max(0, params.candidate_count - qty);
  }
  return undefined;
}

const SPEED_INVERSE_PARAM_KEYS = new Set([
  "time_limit_seconds",
  "time_limit_ms",
  "display_duration_ms",
  "flash_ms",
]);

const STEPS_PARAM_KEYS = new Set([
  "step_count",
  "sequence_length",
  "clue_count",
  "rule_count",
]);

function classifyIncreasedAxes(
  prevParams: SeedRecord,
  nextParams: SeedRecord
): DifficultyAxis[] {
  const axes = new Set<DifficultyAxis>();

  const prevQty = extractEffectiveQuantity(prevParams);
  const nextQty = extractEffectiveQuantity(nextParams);
  if (prevQty !== undefined && nextQty !== undefined && nextQty > prevQty) {
    axes.add("quantity");
  }

  const prevDist = extractEffectiveDistractor(prevParams);
  const nextDist = extractEffectiveDistractor(nextParams);
  if (prevDist !== undefined && nextDist !== undefined && nextDist > prevDist) {
    axes.add("distractor");
  }

  for (const key of SPEED_INVERSE_PARAM_KEYS) {
    const prevVal = prevParams[key];
    const nextVal = nextParams[key];
    if (
      typeof prevVal === "number" &&
      typeof nextVal === "number" &&
      nextVal < prevVal
    ) {
      axes.add("speed");
    }
  }

  for (const key of STEPS_PARAM_KEYS) {
    const prevVal = prevParams[key];
    const nextVal = nextParams[key];
    if (
      typeof prevVal === "number" &&
      typeof nextVal === "number" &&
      nextVal > prevVal
    ) {
      axes.add("steps");
    }
  }

  return Array.from(axes);
}

function checkGroupDifficultySteps(
  groupLevels: readonly ContentSeed[],
  issues: GateIssue[]
): void {
  if (groupLevels.length < 2) {
    return;
  }
  const sorted = [...groupLevels].sort((a, b) => {
    if (a.header.difficulty !== b.header.difficulty) {
      return a.header.difficulty - b.header.difficulty;
    }
    return a.header.code.localeCompare(b.header.code);
  });

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (!(prev && next) || prev.header.difficulty === next.header.difficulty) {
      continue;
    }
    const prevParams = isRecord(prev.difficulty_params)
      ? prev.difficulty_params
      : {};
    const nextParams = isRecord(next.difficulty_params)
      ? next.difficulty_params
      : {};
    const increasedAxes = classifyIncreasedAxes(prevParams, nextParams);
    if (increasedAxes.length > 1) {
      issues.push({
        code: "MULTI_DIMENSION_DIFFICULTY_JUMP",
        message: `Từ '${prev.header.code}' (d=${prev.header.difficulty}) sang '${next.header.code}' (d=${next.header.difficulty}) tăng ${increasedAxes.length} chiều độ khó cùng lúc (${increasedAxes.join(", ")}) — vi phạm BR-GLM-08.`,
      });
    }
  }
}

/**
 * BR-GLM-08: Hai level kế tiếp chỉ tăng một chiều độ khó tại một thời điểm
 * (số lượng, nhiễu, tốc độ, hoặc số bước).
 */
export function checkSingleDimensionDifficultyStep(
  levels: readonly ContentSeed[]
): GateIssue[] {
  const issues: GateIssue[] = [];
  const groups = new Map<string, ContentSeed[]>();

  for (const level of levels) {
    const primarySkill = level.header.skill_codes[0] ?? "";
    const groupKey = `${primarySkill}::${level.header.template_code}`;
    const list = groups.get(groupKey) ?? [];
    list.push(level);
    groups.set(groupKey, list);
  }

  for (const [, groupLevels] of groups) {
    checkGroupDifficultySteps(groupLevels, issues);
  }

  return issues;
}

/**
 * BR-GLM-10: Chủ đề hình ảnh của level thuộc danh mục CONTENT_THEMES dùng chung,
 * hợp lệ với độ tuổi và giữ nhất quán trong toàn bộ level.
 */
export function checkThemeConsistency(level: ContentSeed): GateIssue[] {
  const issues: GateIssue[] = [];
  const themeTag = level.header.theme_tag?.trim();

  if (!(themeTag && CANONICAL_THEME_CODES.has(themeTag))) {
    issues.push({
      code: "THEME_NOT_IN_CATALOG",
      message: `Level '${level.header.code}': theme_tag '${String(level.header.theme_tag)}' không thuộc CONTENT_THEMES (BR-GLM-10).`,
    });
    return issues;
  }

  const themeDef = getTheme(themeTag);
  const ageMax = level.header.age_max ?? level.header.age_min;
  if (themeDef && ageMax < themeDef.age_floor) {
    issues.push({
      code: "THEME_AGE_FLOOR_VIOLATION",
      message: `Level '${level.header.code}' (tuổi ${level.header.age_min}-${ageMax}) dùng chủ đề '${themeTag}' có age_floor=${themeDef.age_floor} (BR-GLM-10).`,
    });
  }

  if (
    isRecord(level.content_pack) &&
    typeof level.content_pack.theme_tag === "string" &&
    level.content_pack.theme_tag !== themeTag
  ) {
    issues.push({
      code: "THEME_INCONSISTENT_IN_LEVEL",
      message: `Level '${level.header.code}': content_pack.theme_tag '${level.content_pack.theme_tag}' lệch với header.theme_tag '${themeTag}' (BR-GLM-10).`,
    });
  }

  if (Array.isArray(level.rounds)) {
    for (const [idx, round] of level.rounds.entries()) {
      if (
        isRecord(round.content_pack) &&
        typeof round.content_pack.theme_tag === "string" &&
        round.content_pack.theme_tag !== themeTag
      ) {
        issues.push({
          code: "THEME_INCONSISTENT_IN_LEVEL",
          message: `Level '${level.header.code}' (round ${idx}): theme_tag '${round.content_pack.theme_tag}' lệch với header.theme_tag '${themeTag}' (BR-GLM-10).`,
        });
      }
    }
  }

  return issues;
}
