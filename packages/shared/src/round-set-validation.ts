/**
 * Round set validation — 13 business rules from round-set-model.md §6.
 * Spec sở hữu: round-set-model.md
 * Rules: BR-RSM-01 through BR-RSM-13
 */

import { Buffer } from "node:buffer";
import { gzipSync } from "node:zlib";

export interface RoundInput {
  round_index: number;
  template_code: string;
  instruction?: string | null;
  content_pack: unknown;
  difficulty_params: unknown;
  difficulty?: number | null;
  age_min?: number | null;
  age_max?: number | null;
  theme_id?: string | null;
}

export interface RoundSetInput {
  rounds: RoundInput[];
  learning_objective_count: number;
  content_contract_validator?: (
    templateCode: string,
    contentPack: unknown
  ) => { success: boolean; error?: { message: string } };
}

export interface RoundSetViolation {
  rule: string;
  round_index?: number;
  message: string;
}

export interface RoundSetValidationResult {
  ok: boolean;
  violations: RoundSetViolation[];
}

const MAX_ROUNDS_BY_BAND: Record<string, number> = {
  "3-4": 4,
  "4-5": 6,
  "5-6": 8,
};

const MAX_PAYLOAD_BYTES_GZIPPED = 200 * 1024;
const MAX_INSTRUCTION_WORDS = 12;

const WHITESPACE_RE = /\s+/;

function ageBandKey(
  ageMin: number | null | undefined,
  ageMax: number | null | undefined
): string {
  if (ageMin == null || ageMax == null) {
    return "unknown";
  }
  return `${ageMin}-${ageMax}`;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(WHITESPACE_RE)
    .filter((w) => w.length > 0).length;
}

function hasNegation(text: string): boolean {
  const negatives = [
    "không",
    "đừng",
    "chớ",
    "never",
    "don't",
    "do not",
    "không được",
  ];
  const lower = text.toLowerCase();
  return negatives.some((neg) => lower.includes(neg));
}

function contentPackFingerprint(pack: unknown): string {
  if (pack === null || pack === undefined) {
    return "";
  }
  if (typeof pack !== "object") {
    return JSON.stringify(pack);
  }
  if (Array.isArray(pack)) {
    return JSON.stringify(pack);
  }
  const entries = Object.entries(pack);
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    normalized[k] = v;
  }
  if (Array.isArray(normalized.options)) {
    normalized.options = [...normalized.options].sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b))
    );
  }
  return JSON.stringify(normalized);
}

function difficultyDimensions(params: unknown): Record<string, number> {
  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "number") {
      result[key] = value;
    }
  }
  return result;
}

function checkOneTemplate(rounds: RoundInput[], v: RoundSetViolation[]): void {
  const first = rounds[0].template_code;
  for (const round of rounds) {
    if (round.template_code !== first) {
      v.push({
        rule: "BR-RSM-01",
        round_index: round.round_index,
        message: `Round uses template '${round.template_code}' but set uses '${first}'`,
      });
    }
  }
}

function checkOneLO(count: number, v: RoundSetViolation[]): void {
  if (count !== 1) {
    v.push({
      rule: "BR-RSM-02",
      message: `Set must have exactly 1 learning objective, got ${count}`,
    });
  }
}

function checkBandCeiling(rounds: RoundInput[], v: RoundSetViolation[]): void {
  const band = ageBandKey(rounds[0].age_min, rounds[0].age_max);
  const maxRounds = MAX_ROUNDS_BY_BAND[band];
  if (maxRounds !== undefined && rounds.length > maxRounds) {
    v.push({
      rule: "BR-RSM-03",
      message: `Band ${band} allows max ${maxRounds} rounds, got ${rounds.length}`,
    });
  }
}

function checkContentPacks(
  rounds: RoundInput[],
  validator: RoundSetInput["content_contract_validator"] | undefined,
  v: RoundSetViolation[]
): void {
  if (!validator) {
    return;
  }
  for (const round of rounds) {
    const result = validator(round.template_code, round.content_pack);
    if (!result.success) {
      v.push({
        rule: "BR-RSM-04",
        round_index: round.round_index,
        message: `content_pack invalid: ${result.error?.message ?? "parse failed"}`,
      });
    }
  }
}

function checkDifficultySteps(
  rounds: RoundInput[],
  v: RoundSetViolation[]
): void {
  for (let i = 1; i < rounds.length; i++) {
    const prev = difficultyDimensions(rounds[i - 1].difficulty_params);
    const curr = difficultyDimensions(rounds[i].difficulty_params);
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    let increased = 0;
    for (const key of allKeys) {
      if ((curr[key] ?? 0) > (prev[key] ?? 0)) {
        increased++;
      }
    }
    if (increased > 1) {
      v.push({
        rule: "BR-RSM-05",
        round_index: rounds[i].round_index,
        message: `Round increases ${increased} difficulty dimensions (max 1)`,
      });
    }
  }
}

function checkFirstRoundEasiest(
  rounds: RoundInput[],
  v: RoundSetViolation[]
): void {
  if (rounds.length <= 1) {
    return;
  }
  const firstD = rounds[0].difficulty ?? 0;
  for (let i = 1; i < rounds.length; i++) {
    const d = rounds[i].difficulty ?? 0;
    if (d < firstD) {
      v.push({
        rule: "BR-RSM-06",
        round_index: 0,
        message: `First round difficulty (${firstD}) is not the lowest in set (round ${rounds[i].round_index} has ${d})`,
      });
      return;
    }
  }
}

function checkConsistentTheme(
  rounds: RoundInput[],
  v: RoundSetViolation[]
): void {
  if (rounds.length <= 1) {
    return;
  }
  const theme = rounds[0].theme_id;
  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i].theme_id !== theme) {
      v.push({
        rule: "BR-RSM-07",
        round_index: rounds[i].round_index,
        message: `Round uses theme '${rounds[i].theme_id}' but set uses '${theme}'`,
      });
    }
  }
}

function checkAdjacentContent(
  rounds: RoundInput[],
  v: RoundSetViolation[]
): void {
  for (let i = 1; i < rounds.length; i++) {
    const prevFP = contentPackFingerprint(rounds[i - 1].content_pack);
    const currFP = contentPackFingerprint(rounds[i].content_pack);
    if (prevFP === currFP) {
      v.push({
        rule: "BR-RSM-08",
        round_index: rounds[i].round_index,
        message:
          "Adjacent rounds have identical content (reordering options does not count as different)",
      });
    }
  }
}

function checkPayloadSize(rounds: RoundInput[], v: RoundSetViolation[]): void {
  const payload = JSON.stringify(rounds.map((r) => r.content_pack));
  const gz = gzipSync(Buffer.from(payload, "utf-8"));
  if (gz.length > MAX_PAYLOAD_BYTES_GZIPPED) {
    v.push({
      rule: "BR-RSM-10",
      message: `Total payload ${gz.length} bytes gzipped exceeds ${MAX_PAYLOAD_BYTES_GZIPPED} byte limit`,
    });
  }
}

function checkInstructions(rounds: RoundInput[], v: RoundSetViolation[]): void {
  for (const round of rounds) {
    if (!round.instruction || round.instruction.trim().length === 0) {
      v.push({
        rule: "BR-RSM-11",
        round_index: round.round_index,
        message: "Round missing instruction",
      });
      continue;
    }
    const wc = countWords(round.instruction);
    if (wc > MAX_INSTRUCTION_WORDS) {
      v.push({
        rule: "BR-RSM-11",
        round_index: round.round_index,
        message: `Instruction has ${wc} words (max ${MAX_INSTRUCTION_WORDS})`,
      });
    }
    if (hasNegation(round.instruction)) {
      v.push({
        rule: "BR-RSM-11",
        round_index: round.round_index,
        message: "Instruction contains negation",
      });
    }
  }
}

function checkConsistentBand(
  rounds: RoundInput[],
  v: RoundSetViolation[]
): void {
  if (rounds.length <= 1) {
    return;
  }
  const firstBand = ageBandKey(rounds[0].age_min, rounds[0].age_max);
  for (let i = 1; i < rounds.length; i++) {
    const band = ageBandKey(rounds[i].age_min, rounds[i].age_max);
    if (band !== firstBand) {
      v.push({
        rule: "BR-RSM-13",
        round_index: rounds[i].round_index,
        message: `Round uses band ${band} but set uses ${firstBand}`,
      });
    }
  }
}

function checkIndexContinuity(
  rounds: RoundInput[],
  v: RoundSetViolation[]
): void {
  const sorted = rounds.map((r) => r.round_index).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i) {
      v.push({
        rule: "BR-RSM-04",
        round_index: sorted[i],
        message: `round_index must be continuous from 0, expected ${i} but got ${sorted[i]}`,
      });
      return;
    }
  }
}

export function validateRoundSet(
  input: RoundSetInput
): RoundSetValidationResult {
  const v: RoundSetViolation[] = [];
  const { rounds } = input;

  if (rounds.length === 0) {
    v.push({
      rule: "BR-RSM-09",
      message: "Round set must have at least one round",
    });
    return { ok: false, violations: v };
  }

  checkOneTemplate(rounds, v);
  checkOneLO(input.learning_objective_count, v);
  checkBandCeiling(rounds, v);
  checkContentPacks(rounds, input.content_contract_validator, v);
  checkDifficultySteps(rounds, v);
  checkFirstRoundEasiest(rounds, v);
  checkConsistentTheme(rounds, v);
  checkAdjacentContent(rounds, v);
  checkPayloadSize(rounds, v);
  checkInstructions(rounds, v);
  checkConsistentBand(rounds, v);
  checkIndexContinuity(rounds, v);

  return { ok: v.length === 0, violations: v };
}
