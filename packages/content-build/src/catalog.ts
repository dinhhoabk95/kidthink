import { ALL_ACTIVITIES, ALL_LESSONS } from "@mindkid/content";
import { GT001_BACKFILL_LEVELS } from "./backfill/seed-gt001-backfill.js";
import { GT003_BACKFILL_LEVELS } from "./backfill/seed-gt003-backfill.js";
import { GT006_GT005_BACKFILL_LEVELS } from "./backfill/seed-gt006-gt005-backfill.js";
import { GT008_BACKFILL_LEVELS } from "./backfill/seed-gt008-backfill.js";
import { MID_LOAD_BACKFILL_LEVELS } from "./backfill/seed-mid-load-backfill.js";
import { SINGLE_TYPE_BACKFILL_LEVELS } from "./backfill/seed-single-type-backfill.js";
import { C1_SEED_LEVELS } from "./c1/levels.js";
import { C2_SEED_LEVELS } from "./c2/levels.js";
import { C3_ALL_LEVELS } from "./c3/levels.js";
import { C4_SEED_LEVELS } from "./c4/levels.js";
import { C5_SEED_LEVELS } from "./c5/levels.js";
import { C6_SEED_LEVELS } from "./c6/levels.js";
import { ALL_GENERATED_LEVELS } from "./corpus/index.js";
import { PEDAGOGY_MISSING_SKILL_LEVELS } from "./pedagogy-missing-skills.js";
import { QUARANTINED_LEVEL_SET } from "./quarantine.js";

import type { AnyContentSeed, ContentSeed } from "./types.js";

export const ALL_SEED_ACTIVITIES = ALL_ACTIVITIES;
export const ALL_SEED_LESSONS = ALL_LESSONS;

export const STATIC_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...C1_SEED_LEVELS,
  ...C2_SEED_LEVELS,
  ...C3_ALL_LEVELS,
  ...C4_SEED_LEVELS,
  ...C5_SEED_LEVELS,
  ...C6_SEED_LEVELS,
  ...PEDAGOGY_MISSING_SKILL_LEVELS,
  ...GT001_BACKFILL_LEVELS,
  ...GT003_BACKFILL_LEVELS,
  ...GT006_GT005_BACKFILL_LEVELS,
  ...GT008_BACKFILL_LEVELS,
  ...MID_LOAD_BACKFILL_LEVELS,
  ...SINGLE_TYPE_BACKFILL_LEVELS,
];

export const ALL_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...STATIC_SEED_LEVELS,
  ...ALL_GENERATED_LEVELS,
];

export const SHIPPABLE_SEED_LEVELS: ContentSeed<unknown, unknown>[] =
  ALL_SEED_LEVELS.filter(
    (level) => !QUARANTINED_LEVEL_SET.has(level.header.code)
  );

export const ALL_SEED_CONTENT: AnyContentSeed[] = [
  ...SHIPPABLE_SEED_LEVELS,
  ...ALL_SEED_ACTIVITIES,
  ...ALL_SEED_LESSONS,
];
