import type {
  Projection,
  SkillDataset,
  SkillIdentity,
  SkillLevelPlan,
  SkillSeed,
} from "@mindkid/shared";
import type { ContentSeed, ContentSeedRound } from "../types.js";
import { ALL_BUILDERS } from "./registry.js";

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

    const instruction =
      typeof projected.content_pack === "object" &&
      projected.content_pack !== null &&
      "prompt" in projected.content_pack &&
      typeof (projected.content_pack as { prompt: unknown }).prompt === "string"
        ? (projected.content_pack as { prompt: string }).prompt
        : dataset.phrasing.prompt_template || dataset.concept_label;

    rounds.push({
      instruction,
      content_pack: projected.content_pack,
      difficulty_params: projected.difficulty_params,
      difficulty: levelPlan.difficulty,
    });
  }

  return rounds;
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

  return {
    kind: "game_level",
    header: {
      code: `${identity.code}-${levelPlan.template}-${levelPlan.difficulty}`,
      content_version: 1,
      template_code: levelPlan.template,
      title: `${identity.name} - ${levelPlan.template} (Cấp ${levelPlan.difficulty})`,
      instruction: firstRound.instruction,
      age_min: identity.age_min,
      age_max: identity.age_max,
      difficulty: levelPlan.difficulty,
      access_tier: identity.tier === "basic" ? "free" : "login",
      skill_codes: [identity.code],
      learning_objective_codes: (identity.learning_objectives ?? []).map(
        (lo) => lo.code
      ),
      what_tags: [identity.strand_code.toLowerCase().replace(/\./g, "_")],
      thinking_tags: [...identity.thinking_processes],
      theme_tag: levelPlan.theme,
      origin: "human",
      authored_in: "repo_seed",
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
