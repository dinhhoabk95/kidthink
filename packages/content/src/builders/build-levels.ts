import type {
  Projection,
  SkillDataset,
  SkillIdentity,
  SkillLevelPlan,
  SkillSeed,
} from "@mindkid/shared";
import type { ContentSeed, ContentSeedRound } from "../types.js";
import { ALL_BUILDERS } from "./registry.js";

const REGEX_MONTESSORI_CODE = /-01\d{2}$/;

function computeSeedNumber(code: string, difficulty: number): number {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum = Math.abs(sum * 31 + code.charCodeAt(i)) % 2_147_483_647;
  }
  return sum + difficulty * 100;
}

function validateContract(
  builder: Projection,
  dataset: SkillDataset,
  template: string,
  skillCode: string
): void {
  const requires = builder.requires;
  if (
    requires.min_items !== undefined &&
    dataset.items.length < requires.min_items
  ) {
    throw new Error(
      `[buildLevelsForSkill] Kỹ năng ${skillCode} có ${dataset.items.length} vật, nhưng khuôn ${template} đòi tối thiểu ${requires.min_items} vật`
    );
  }

  if (requires.needs && requires.needs.length > 0) {
    for (const field of requires.needs) {
      const missingItem = dataset.items.find(
        (item) => !(field in item) || Reflect.get(item, field) === undefined
      );
      if (missingItem) {
        throw new Error(
          `[buildLevelsForSkill] Kỹ năng ${skillCode} vật ${missingItem.id} thiếu trường bắt buộc '${field}' cho khuôn ${template}`
        );
      }
    }
  }
}

function buildLevelRounds(
  builder: Projection,
  dataset: SkillDataset,
  levelPlan: SkillLevelPlan,
  baseSeed: number
): ContentSeedRound[] {
  const roundCount = levelPlan.rounds ?? 3;
  const rounds: ContentSeedRound[] = [];

  for (let r = 0; r < roundCount; r++) {
    const projected = builder.project(dataset, {
      band: levelPlan.band,
      difficulty: levelPlan.difficulty,
      theme: levelPlan.theme,
      seed: baseSeed,
      round_index: r,
    });

    let instruction =
      typeof projected.content_pack === "object" &&
      projected.content_pack !== null &&
      "prompt" in projected.content_pack &&
      typeof (projected.content_pack as { prompt: unknown }).prompt === "string"
        ? (projected.content_pack as { prompt: string }).prompt
        : dataset.phrasing.prompt_template || dataset.concept_label;

    // Sanitize instruction: replace standalone "không" with "số 0" for child friendliness
    instruction = instruction.replace(/\bkhông\b/gi, "số 0");

    if (
      typeof projected.content_pack === "object" &&
      projected.content_pack !== null &&
      "prompt" in projected.content_pack &&
      typeof (projected.content_pack as { prompt: unknown }).prompt === "string"
    ) {
      (projected.content_pack as { prompt: string }).prompt = instruction;
    }

    rounds.push({
      instruction,
      content_pack: projected.content_pack,
      difficulty_params: projected.difficulty_params,
      difficulty: levelPlan.difficulty,
    });
  }

  return rounds;
}

function resolveAccessTier(
  difficulty: number,
  isMontessori: boolean,
  tier?: string
): "free" | "login" | "standard" | "premium" {
  if (isMontessori) {
    if (difficulty === 1) {
      return "free";
    }
    if (difficulty === 2) {
      return "login";
    }
    if (difficulty === 3) {
      return "standard";
    }
    return "premium";
  }
  if (difficulty === 1) {
    return tier === "basic" ? "free" : "login";
  }
  if (difficulty === 2) {
    return "login";
  }
  if (difficulty === 3) {
    return "standard";
  }
  return "premium";
}

function resolveLevelAgeBounds(
  band: SkillLevelPlan["band"],
  identity: SkillIdentity
): { age_min: number; age_max: number } {
  if (band === "3-4") {
    return { age_min: 3, age_max: 4 };
  }
  if (band === "4-5") {
    return { age_min: 4, age_max: 5 };
  }
  if (band === "5-6") {
    return { age_min: 5, age_max: 6 };
  }
  if (band === "3-5") {
    return { age_min: 3, age_max: 5 };
  }
  if (band === "4-6") {
    return { age_min: 4, age_max: 6 };
  }
  if (band === "3-6") {
    return { age_min: 3, age_max: 6 };
  }
  return {
    age_min: Math.max(3, Math.min(6, identity.age_min)),
    age_max: Math.max(3, Math.min(6, identity.age_max)),
  };
}

const STRAND_WHAT_TAG_MAP: Record<string, string> = {
  // C1
  "C1.CNT": "number",
  "C1.ADD": "number",
  "C1.SUB": "number",
  "C1.CMP": "size",
  "C1.ORD": "sequence",
  "C1.OTO": "quantity",
  "C1.PAT": "pattern",
  "C1.MEAS": "size",
  "C1.DAT": "category",
  "C1.PROB": "rule",
  "C1.NCOMP": "number",
  "C1.NREC": "number",
  // C2
  "C2.GEO": "geometry",
  "C2.CON": "geometry",
  "C2.DIR": "space",
  "C2.GRD": "space",
  "C2.MAZ": "space",
  "C2.MIR": "geometry",
  "C2.ORI": "space",
  "C2.PER": "space",
  "C2.ROT": "space",
  "C2.SOL": "geometry",
  // C3
  "C3.ALG": "rule",
  "C3.ANA": "rule",
  "C3.CLS": "category",
  "C3.DED": "rule",
  "C3.INF": "rule",
  "C3.MTX": "pattern",
  "C3.RULE": "rule",
  "C3.SEQ": "sequence",
  "C3.SET": "category",
  "C3.SRT": "category",
  // C4
  "C4.AUD": "sound",
  "C4.CAU": "rule",
  "C4.DET": "category",
  "C4.ECO": "category",
  "C4.EXP": "rule",
  "C4.HOM": "category",
  "C4.LIV": "category",
  "C4.MAT": "category",
  "C4.MEM": "category",
  "C4.OBS": "category",
  "C4.SAF": "rule",
  "C4.SEN": "category",
  "C4.SOC": "category",
  "C4.TAC": "category",
  "C4.TOO": "category",
  "C4.VIS": "colour",
  // C5
  "C5.ALP": "letter",
  "C5.BOK": "letter",
  "C5.DES": "sound",
  "C5.GRM": "rule",
  "C5.LIS": "sound",
  "C5.PHO": "sound",
  "C5.PRA": "sound",
  "C5.PRN": "sound",
  "C5.QUE": "rule",
  "C5.RHY": "sound",
  "C5.STO": "letter",
  "C5.TON": "sound",
  "C5.VOC": "letter",
  "C5.WRD": "letter",
  "C5.WRT": "letter",
  // C6
  "C6.ATT": "rule",
  "C6.FLX": "rule",
  "C6.INH": "rule",
  "C6.INI": "rule",
  "C6.MON": "rule",
  "C6.PER": "rule",
  "C6.PLN": "rule",
  "C6.WM": "sequence",
};

const CANONICAL_THINKING_TAGS = new Set([
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

const THINKING_TAG_NORMALIZE_MAP: Record<string, string> = {
  listen: "observe",
  solve: "infer",
  verify: "compare",
  create: "plan",
  describe: "observe",
  visual: "observe",
  analytical: "infer",
  inhibitory: "inhibit",
  working_memory: "recall",
  focus: "observe",
};

function normalizeThinkingTags(tags: readonly string[]): string[] {
  const result = new Set<string>();
  for (const tag of tags) {
    if (CANONICAL_THINKING_TAGS.has(tag)) {
      result.add(tag);
    } else if (THINKING_TAG_NORMALIZE_MAP[tag]) {
      result.add(THINKING_TAG_NORMALIZE_MAP[tag]);
    } else {
      result.add("observe");
    }
  }
  return result.size > 0 ? [...result] : ["observe"];
}

function resolveWhatTag(strandCode: string): string {
  return STRAND_WHAT_TAG_MAP[strandCode] ?? "rule";
}

function buildSingleLevel(
  builder: Projection,
  dataset: SkillDataset,
  identity: SkillIdentity,
  levelPlan: SkillLevelPlan
): ContentSeed {
  validateContract(builder, dataset, levelPlan.template, identity.code);

  const baseSeed = computeSeedNumber(identity.code, levelPlan.difficulty);
  const rounds = buildLevelRounds(builder, dataset, levelPlan, baseSeed);
  const firstRound = rounds[0];

  if (!firstRound) {
    throw new Error(
      `[buildLevelsForSkill] Không sinh được round nào cho khuôn ${levelPlan.template} (kỹ năng ${identity.code})`
    );
  }

  const levelCode =
    levelPlan.code ??
    `${identity.code}-${levelPlan.template}-${levelPlan.difficulty}`;

  const isMontessori =
    Boolean(levelPlan.montessori_ref) ||
    Boolean(levelPlan.code && REGEX_MONTESSORI_CODE.test(levelPlan.code));

  const ageBounds = resolveLevelAgeBounds(levelPlan.band, identity);

  return {
    kind: "game_level",
    header: {
      code: levelCode,
      content_version: 1,
      template_code: levelPlan.template,
      title: `${identity.name} - ${levelPlan.template} (Cấp ${levelPlan.difficulty})`,
      instruction: firstRound.instruction,
      age_min: ageBounds.age_min,
      age_max: ageBounds.age_max,
      difficulty: levelPlan.difficulty,
      access_tier: resolveAccessTier(
        levelPlan.difficulty,
        isMontessori,
        identity.tier
      ),
      skill_codes: [identity.code],
      learning_objective_codes: (identity.learning_objectives ?? []).map(
        (lo) => lo.code
      ),
      what_tags: [resolveWhatTag(identity.strand_code)],
      thinking_tags: normalizeThinkingTags(identity.thinking_processes),
      theme_tag: levelPlan.theme,
      origin: "human",
      authored_in: "repo_seed",
      montessori_ref: levelPlan.montessori_ref,
      legacy_v1_ref: levelPlan.legacy_v1_ref,
    },
    content_pack: firstRound.content_pack,
    difficulty_params: firstRound.difficulty_params,
    rounds,
  };
}

/**
 * Builds game levels from a skill's levels matrix (Task #208 / G4).
 * Enforces builder contract strictly: If contract is violated, throws and halts immediately.
 */
export function buildLevelsForSkill(skill: SkillSeed): ContentSeed[] {
  if (!skill.identity) {
    throw new Error(
      `[buildLevelsForSkill] Kỹ năng thiếu identity: ${skill.dataset.skill_code}`
    );
  }

  const identity = skill.identity;
  const dataset = skill.dataset;
  const contentSeeds: ContentSeed[] = [];

  for (const levelPlan of skill.levels) {
    const builder = ALL_BUILDERS[levelPlan.template];
    if (!builder) {
      throw new Error(
        `[buildLevelsForSkill] Không tìm thấy bộ dựng cho khuôn ${levelPlan.template} (kỹ năng ${identity.code})`
      );
    }
    contentSeeds.push(buildSingleLevel(builder, dataset, identity, levelPlan));
  }

  return contentSeeds;
}
