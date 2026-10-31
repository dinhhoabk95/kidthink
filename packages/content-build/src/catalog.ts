import { ALL_SKILL_SEEDS, buildLevelsForSkill } from "@mindkid/content";
import { QUARANTINED_LEVEL_SET } from "./quarantine.js";
import type { AnyContentSeed, ContentSeed } from "./types.js";

export const ALL_SEED_LEVELS: ContentSeed[] = ALL_SKILL_SEEDS.flatMap((skill) =>
  buildLevelsForSkill(skill)
);

export const SHIPPABLE_SEED_LEVELS: ContentSeed[] = ALL_SEED_LEVELS.filter(
  (level) => !QUARANTINED_LEVEL_SET.has(level.header.code)
);

export const ALL_SEED_CONTENT: AnyContentSeed[] = [...SHIPPABLE_SEED_LEVELS];
