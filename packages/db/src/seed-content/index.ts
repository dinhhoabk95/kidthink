import { ALL_SEED_ACTIVITIES } from "./activities/index.js";
import { C1_SEED_LEVELS } from "./c1/levels.js";
import { C2_SEED_LEVELS } from "./c2/levels.js";
import { C3_ALL_LEVELS } from "./c3/levels.js";
import { C4_SEED_LEVELS } from "./c4/levels.js";
import { C5_SEED_LEVELS } from "./c5/levels.js";
import { C6_SEED_LEVELS } from "./c6/levels.js";
import { ALL_SEED_LESSONS } from "./lessons/index.js";
import { PEDAGOGY_MISSING_SKILL_LEVELS } from "./pedagogy-missing-skills.js";
import { QUARANTINED_LEVEL_SET } from "./quarantine.js";
import type { AnyContentSeed, ContentSeed } from "./types.js";

// biome-ignore lint/performance/noBarrelFile: internal seed-content barrel
export * from "./activities/index.js";
export * from "./gates/runner.js";
export * from "./lessons/index.js";
export * from "./quarantine.js";
export * from "./service.js";
export * from "./types.js";

export const ALL_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...C1_SEED_LEVELS,
  ...C2_SEED_LEVELS,
  ...C3_ALL_LEVELS,
  ...C4_SEED_LEVELS,
  ...C5_SEED_LEVELS,
  ...C6_SEED_LEVELS,
  ...PEDAGOGY_MISSING_SKILL_LEVELS,
];

/**
 * Level đủ điều kiện gieo — `ALL_SEED_LEVELS` trừ danh sách cách ly.
 *
 * `ALL_SEED_LEVELS` giữ **toàn bộ** corpus vì các cổng chất lượng (độ sâu
 * engine, phủ trục tư duy, theme registry) đo trên corpus, không đo trên tập
 * gieo được. Xem `./quarantine.ts`.
 */
export const SHIPPABLE_SEED_LEVELS: ContentSeed<unknown, unknown>[] =
  ALL_SEED_LEVELS.filter(
    (level) => !QUARANTINED_LEVEL_SET.has(level.header.code)
  );

export const ALL_SEED_CONTENT: AnyContentSeed[] = [
  ...SHIPPABLE_SEED_LEVELS,
  ...ALL_SEED_ACTIVITIES,
  ...ALL_SEED_LESSONS,
];
