import type { ActivitySeed } from "../types.js";
import { C1_SEED_ACTIVITIES } from "./c1-activities.js";
import { C2_SEED_ACTIVITIES } from "./c2-activities.js";
import { C3_SEED_ACTIVITIES } from "./c3-activities.js";
import { C4_SEED_ACTIVITIES } from "./c4-activities.js";
import { C5_SEED_ACTIVITIES } from "./c5-activities.js";
import { C6_SEED_ACTIVITIES } from "./c6-activities.js";

export const ALL_SEED_ACTIVITIES: ActivitySeed[] = [
  ...C1_SEED_ACTIVITIES,
  ...C2_SEED_ACTIVITIES,
  ...C3_SEED_ACTIVITIES,
  ...C4_SEED_ACTIVITIES,
  ...C5_SEED_ACTIVITIES,
  ...C6_SEED_ACTIVITIES,
];
