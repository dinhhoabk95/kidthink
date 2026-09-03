import type { LessonSeed } from "../types.js";
import { C1_LESSONS } from "./c1.js";
import { C2_LESSONS } from "./c2.js";
import { C3_LESSONS } from "./c3.js";
import { C4_LESSONS } from "./c4.js";
import { C5_LESSONS } from "./c5.js";
import { C6_LESSONS } from "./c6.js";

export { C1_LESSONS } from "./c1.js";
export { C2_LESSONS } from "./c2.js";
export { C3_LESSONS } from "./c3.js";
export { C4_LESSONS } from "./c4.js";
export { C5_LESSONS } from "./c5.js";
export { C6_LESSONS } from "./c6.js";

export const ALL_LESSONS: readonly LessonSeed[] = [
  ...C1_LESSONS,
  ...C2_LESSONS,
  ...C3_LESSONS,
  ...C4_LESSONS,
  ...C5_LESSONS,
  ...C6_LESSONS,
];
