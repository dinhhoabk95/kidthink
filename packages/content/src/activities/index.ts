import type { ActivitySeed } from "../types.js";
import { C1_ACTIVITIES } from "./c1.js";
import { C2_ACTIVITIES } from "./c2.js";
import { C3_ACTIVITIES } from "./c3.js";
import { C4_ACTIVITIES } from "./c4.js";
import { C5_ACTIVITIES } from "./c5.js";
import { C6_ACTIVITIES } from "./c6.js";

export { C1_ACTIVITIES } from "./c1.js";
export { C2_ACTIVITIES } from "./c2.js";
export { C3_ACTIVITIES } from "./c3.js";
export { C4_ACTIVITIES } from "./c4.js";
export { C5_ACTIVITIES } from "./c5.js";
export { C6_ACTIVITIES } from "./c6.js";

export const ALL_ACTIVITIES: readonly ActivitySeed[] = [
  ...C1_ACTIVITIES,
  ...C2_ACTIVITIES,
  ...C3_ACTIVITIES,
  ...C4_ACTIVITIES,
  ...C5_ACTIVITIES,
  ...C6_ACTIVITIES,
];
