import type { LessonSeed } from "../types.js";
import { LESSON_BATCH_01 } from "./batch-01.js";
import { LESSON_BATCH_02 } from "./batch-02.js";
import { LESSON_BATCH_03 } from "./batch-03.js";
import { LESSON_BATCH_04 } from "./batch-04.js";
import { LESSON_BATCH_05 } from "./batch-05.js";
import { LESSON_BATCH_06 } from "./batch-06.js";
import { LESSON_BATCH_07 } from "./batch-07.js";
import { LESSON_BATCH_08 } from "./batch-08.js";
import { LESSON_BATCH_09 } from "./batch-09.js";
import { LESSON_BATCH_10 } from "./batch-10.js";
import { SEED_MONT_L_01_07 } from "./seed-mont-l01-07.js";
import { SEED_MONT_L_08_14 } from "./seed-mont-l08-14.js";
import { SEED_MONT_L_15_21 } from "./seed-mont-l15-21.js";

export const ALL_SEED_LESSONS: LessonSeed[] = [
  ...LESSON_BATCH_01,
  ...LESSON_BATCH_02,
  ...LESSON_BATCH_03,
  ...LESSON_BATCH_04,
  ...LESSON_BATCH_05,
  ...LESSON_BATCH_06,
  ...LESSON_BATCH_07,
  ...LESSON_BATCH_08,
  ...LESSON_BATCH_09,
  ...LESSON_BATCH_10,
  ...SEED_MONT_L_01_07,
  ...SEED_MONT_L_08_14,
  ...SEED_MONT_L_15_21,
];
