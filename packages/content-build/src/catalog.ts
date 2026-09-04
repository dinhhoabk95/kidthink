import {
  ALL_ACTIVITIES,
  ALL_LESSONS,
  ALL_SKILL_SEEDS,
  buildLevelsForSkill,
} from "@mindkid/content";
import { QUARANTINED_LEVEL_SET } from "./quarantine.js";
import type { AnyContentSeed, ContentSeed } from "./types.js";

export const ALL_SEED_ACTIVITIES = ALL_ACTIVITIES;
export const ALL_SEED_LESSONS = ALL_LESSONS;

export const ALL_BUILT_LEVELS: ContentSeed<unknown, unknown>[] =
  ALL_SKILL_SEEDS.flatMap((skill) => buildLevelsForSkill(skill));

export const STATIC_SEED_LEVELS: ContentSeed<unknown, unknown>[] =
  ALL_BUILT_LEVELS;

export const ALL_SEED_LEVELS: ContentSeed<unknown, unknown>[] =
  ALL_BUILT_LEVELS;

export const SHIPPABLE_SEED_LEVELS: ContentSeed<unknown, unknown>[] =
  ALL_SEED_LEVELS.filter(
    (level) => !QUARANTINED_LEVEL_SET.has(level.header.code)
  );

export const ALL_SEED_CONTENT: AnyContentSeed[] = [
  ...SHIPPABLE_SEED_LEVELS,
  ...ALL_SEED_ACTIVITIES,
  ...ALL_SEED_LESSONS,
];
