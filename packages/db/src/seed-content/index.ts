import { C1_SEED_LEVELS } from "./c1/levels.js";
import { C2_SEED_LEVELS } from "./c2/levels.js";
import { C3_SEED_LEVELS } from "./c3/levels.js";
import { C4_SEED_LEVELS } from "./c4/levels.js";
import { C5_SEED_LEVELS } from "./c5/levels.js";
import { C6_SEED_LEVELS } from "./c6/levels.js";
import type { ContentSeed } from "./types.js";

// biome-ignore lint/performance/noBarrelFile: internal seed-content barrel
export * from "./gates/runner.js";
export * from "./service.js";
export * from "./types.js";

export const ALL_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...C1_SEED_LEVELS,
  ...C2_SEED_LEVELS,
  ...C3_SEED_LEVELS,
  ...C4_SEED_LEVELS,
  ...C5_SEED_LEVELS,
  ...C6_SEED_LEVELS,
];
