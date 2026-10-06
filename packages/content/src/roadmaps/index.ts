import { RM_3_4_MAM_01 } from "./rm-3-4-mam-01.js";
import { RM_3_4_MAM_YEAR_01 } from "./rm-3-4-mam-year-01.js";
import { RM_4_5_CHI_01 } from "./rm-4-5-chi-01.js";
import { RM_4_5_CHI_YEAR_01 } from "./rm-4-5-chi-year-01.js";
import { RM_5_6_LA_01 } from "./rm-5-6-la-01.js";
import { RM_5_6_LA_YEAR_01 } from "./rm-5-6-la-year-01.js";
import type { RoadmapSeed } from "./types.js";

export { RM_3_4_MAM_01 } from "./rm-3-4-mam-01.js";
export { RM_3_4_MAM_YEAR_01 } from "./rm-3-4-mam-year-01.js";
export { RM_4_5_CHI_01 } from "./rm-4-5-chi-01.js";
export { RM_4_5_CHI_YEAR_01 } from "./rm-4-5-chi-year-01.js";
export { RM_5_6_LA_01 } from "./rm-5-6-la-01.js";
export { RM_5_6_LA_YEAR_01 } from "./rm-5-6-la-year-01.js";
export type * from "./types.js";

export const ALL_ROADMAPS: readonly RoadmapSeed[] = [
  RM_3_4_MAM_01,
  RM_4_5_CHI_01,
  RM_5_6_LA_01,
  RM_3_4_MAM_YEAR_01,
  RM_4_5_CHI_YEAR_01,
  RM_5_6_LA_YEAR_01,
];
