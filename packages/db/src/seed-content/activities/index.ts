import type { ActivitySeed } from "#src/seed-content/types";
import { C1_SEED_ACTIVITIES } from "./c1-activities.js";
import { C2_SEED_ACTIVITIES } from "./c2-activities.js";
import { C3_SEED_ACTIVITIES } from "./c3-activities.js";
import { C4_SEED_ACTIVITIES } from "./c4-activities.js";
import { C5_SEED_ACTIVITIES } from "./c5-activities.js";
import { C6_SEED_ACTIVITIES } from "./c6-activities.js";
import { DIGITAL_GAME_ACTIVITIES } from "./digital-game-activities.js";
import { SEED_MONT_ACT_01_07 } from "./seed-mont-act01-07.js";
import { SEED_MONT_ACT_08_14 } from "./seed-mont-act08-14.js";
import { SEED_MONT_ACT_15_21 } from "./seed-mont-act15-21.js";

export const ALL_SEED_ACTIVITIES: ActivitySeed[] = [
  ...C1_SEED_ACTIVITIES,
  ...C2_SEED_ACTIVITIES,
  ...C3_SEED_ACTIVITIES,
  ...C4_SEED_ACTIVITIES,
  ...C5_SEED_ACTIVITIES,
  ...C6_SEED_ACTIVITIES,
  ...SEED_MONT_ACT_01_07,
  ...SEED_MONT_ACT_08_14,
  ...SEED_MONT_ACT_15_21,
  ...DIGITAL_GAME_ACTIVITIES,
];
