import { RM_3_4_KOGUMA_01 } from "./rm-3-4-koguma-01.js";
import { RM_3_4_KOGUMA_02 } from "./rm-3-4-koguma-02.js";
import { RM_3_4_KOGUMA_YEAR_01 } from "./rm-3-4-koguma-year-01.js";
import { RM_3_4_KOGUMA_YEAR_02 } from "./rm-3-4-koguma-year-02.js";
import { RM_3_4_MAM_01 } from "./rm-3-4-mam-01.js";
import { RM_3_4_MAM_02 } from "./rm-3-4-mam-02.js";
import { RM_3_4_MAM_YEAR_01 } from "./rm-3-4-mam-year-01.js";
import { RM_3_4_TOAN_DIEN_NGON_NGU_KHAM_PHA_01 } from "./rm-3-4-toan-dien-ngon-ngu-kham-pha-01.js";
import { RM_3_4_TOAN_DIEN_TOAN_LOGIC_01 } from "./rm-3-4-toan-dien-toan-logic-01.js";
import { RM_3_4_TOAN_DIEN_YEAR_01 } from "./rm-3-4-toan-dien-year-01.js";
import { RM_4_5_CHI_01 } from "./rm-4-5-chi-01.js";
import { RM_4_5_CHI_02 } from "./rm-4-5-chi-02.js";
import { RM_4_5_CHI_YEAR_01 } from "./rm-4-5-chi-year-01.js";
import { RM_4_5_KOGUMA_01 } from "./rm-4-5-koguma-01.js";
import { RM_4_5_KOGUMA_02 } from "./rm-4-5-koguma-02.js";
import { RM_4_5_KOGUMA_YEAR_01 } from "./rm-4-5-koguma-year-01.js";
import { RM_4_5_KOGUMA_YEAR_02 } from "./rm-4-5-koguma-year-02.js";
import { RM_4_5_TOAN_DIEN_NGON_NGU_KHAM_PHA_01 } from "./rm-4-5-toan-dien-ngon-ngu-kham-pha-01.js";
import { RM_4_5_TOAN_DIEN_TOAN_LOGIC_01 } from "./rm-4-5-toan-dien-toan-logic-01.js";
import { RM_4_5_TOAN_DIEN_YEAR_01 } from "./rm-4-5-toan-dien-year-01.js";
import { RM_5_6_KOGUMA_01 } from "./rm-5-6-koguma-01.js";
import { RM_5_6_KOGUMA_02 } from "./rm-5-6-koguma-02.js";
import { RM_5_6_KOGUMA_YEAR_01 } from "./rm-5-6-koguma-year-01.js";
import { RM_5_6_KOGUMA_YEAR_02 } from "./rm-5-6-koguma-year-02.js";
import { RM_5_6_LA_01 } from "./rm-5-6-la-01.js";
import { RM_5_6_LA_02 } from "./rm-5-6-la-02.js";
import { RM_5_6_LA_YEAR_01 } from "./rm-5-6-la-year-01.js";
import { RM_5_6_TOAN_DIEN_NGON_NGU_KHAM_PHA_01 } from "./rm-5-6-toan-dien-ngon-ngu-kham-pha-01.js";
import { RM_5_6_TOAN_DIEN_TOAN_LOGIC_01 } from "./rm-5-6-toan-dien-toan-logic-01.js";
import { RM_5_6_TOAN_DIEN_YEAR_01 } from "./rm-5-6-toan-dien-year-01.js";
import type { RoadmapSeed } from "./types.js";

export type {
  KogumaCompetencyCode,
  KogumaDomainDef,
  KogumaPillarCode,
  KogumaUnitDef,
  KogumaUnitSchedule,
  MoetPreschoolThemeDef,
  MoetPreschoolThemeId,
} from "./koguma-types.js";
export {
  KOGUMA_DOMAINS,
  KOGUMA_PILLARS,
  MOET_PRESCHOOL_THEMES,
} from "./koguma-types.js";
export {
  getKogumaUnit,
  getKogumaUnitBySkillCode,
  getKogumaUnitSchedule,
  getKogumaUnitsForBand,
  getKogumaUnitsForMoetTheme,
  getKogumaUnitsForPillar,
  KOGUMA_100_UNITS,
} from "./koguma-units.js";
export { KOGUMA_CHOI_UNITS } from "./koguma-units-choi.js";
export { KOGUMA_LA_UNITS } from "./koguma-units-la.js";
export { KOGUMA_MAM_UNITS } from "./koguma-units-mam.js";
export { RM_3_4_KOGUMA_01 } from "./rm-3-4-koguma-01.js";
export { RM_3_4_KOGUMA_02 } from "./rm-3-4-koguma-02.js";
export { RM_3_4_KOGUMA_YEAR_01 } from "./rm-3-4-koguma-year-01.js";
export { RM_3_4_KOGUMA_YEAR_02 } from "./rm-3-4-koguma-year-02.js";
export { RM_3_4_MAM_01 } from "./rm-3-4-mam-01.js";
export { RM_3_4_MAM_02 } from "./rm-3-4-mam-02.js";
export { RM_3_4_MAM_YEAR_01 } from "./rm-3-4-mam-year-01.js";
export { RM_3_4_TOAN_DIEN_NGON_NGU_KHAM_PHA_01 } from "./rm-3-4-toan-dien-ngon-ngu-kham-pha-01.js";
export { RM_3_4_TOAN_DIEN_TOAN_LOGIC_01 } from "./rm-3-4-toan-dien-toan-logic-01.js";
export { RM_3_4_TOAN_DIEN_YEAR_01 } from "./rm-3-4-toan-dien-year-01.js";
export { RM_4_5_CHI_01 } from "./rm-4-5-chi-01.js";
export { RM_4_5_CHI_02 } from "./rm-4-5-chi-02.js";
export { RM_4_5_CHI_YEAR_01 } from "./rm-4-5-chi-year-01.js";
export { RM_4_5_KOGUMA_01 } from "./rm-4-5-koguma-01.js";
export { RM_4_5_KOGUMA_02 } from "./rm-4-5-koguma-02.js";
export { RM_4_5_KOGUMA_YEAR_01 } from "./rm-4-5-koguma-year-01.js";
export { RM_4_5_KOGUMA_YEAR_02 } from "./rm-4-5-koguma-year-02.js";
export { RM_4_5_TOAN_DIEN_NGON_NGU_KHAM_PHA_01 } from "./rm-4-5-toan-dien-ngon-ngu-kham-pha-01.js";
export { RM_4_5_TOAN_DIEN_TOAN_LOGIC_01 } from "./rm-4-5-toan-dien-toan-logic-01.js";
export { RM_4_5_TOAN_DIEN_YEAR_01 } from "./rm-4-5-toan-dien-year-01.js";
export { RM_5_6_KOGUMA_01 } from "./rm-5-6-koguma-01.js";
export { RM_5_6_KOGUMA_02 } from "./rm-5-6-koguma-02.js";
export { RM_5_6_KOGUMA_YEAR_01 } from "./rm-5-6-koguma-year-01.js";
export { RM_5_6_KOGUMA_YEAR_02 } from "./rm-5-6-koguma-year-02.js";
export { RM_5_6_LA_01 } from "./rm-5-6-la-01.js";
export { RM_5_6_LA_02 } from "./rm-5-6-la-02.js";
export { RM_5_6_LA_YEAR_01 } from "./rm-5-6-la-year-01.js";
export { RM_5_6_TOAN_DIEN_NGON_NGU_KHAM_PHA_01 } from "./rm-5-6-toan-dien-ngon-ngu-kham-pha-01.js";
export { RM_5_6_TOAN_DIEN_TOAN_LOGIC_01 } from "./rm-5-6-toan-dien-toan-logic-01.js";
export { RM_5_6_TOAN_DIEN_YEAR_01 } from "./rm-5-6-toan-dien-year-01.js";
export type * from "./types.js";

export const KOGUMA_ROADMAPS: readonly RoadmapSeed[] = [
  RM_3_4_KOGUMA_01,
  RM_4_5_KOGUMA_01,
  RM_5_6_KOGUMA_01,
  RM_3_4_KOGUMA_02,
  RM_4_5_KOGUMA_02,
  RM_5_6_KOGUMA_02,
  RM_3_4_KOGUMA_YEAR_01,
  RM_4_5_KOGUMA_YEAR_01,
  RM_5_6_KOGUMA_YEAR_01,
  RM_3_4_KOGUMA_YEAR_02,
  RM_4_5_KOGUMA_YEAR_02,
  RM_5_6_KOGUMA_YEAR_02,
];

export const COMPREHENSIVE_ROADMAPS: readonly RoadmapSeed[] = [
  RM_3_4_TOAN_DIEN_NGON_NGU_KHAM_PHA_01,
  RM_4_5_TOAN_DIEN_NGON_NGU_KHAM_PHA_01,
  RM_5_6_TOAN_DIEN_NGON_NGU_KHAM_PHA_01,
  RM_3_4_TOAN_DIEN_TOAN_LOGIC_01,
  RM_4_5_TOAN_DIEN_TOAN_LOGIC_01,
  RM_5_6_TOAN_DIEN_TOAN_LOGIC_01,
  RM_3_4_TOAN_DIEN_YEAR_01,
  RM_4_5_TOAN_DIEN_YEAR_01,
  RM_5_6_TOAN_DIEN_YEAR_01,
];

export const ALL_ROADMAPS: readonly RoadmapSeed[] = [
  RM_3_4_MAM_01,
  RM_3_4_MAM_02,
  RM_4_5_CHI_01,
  RM_4_5_CHI_02,
  RM_5_6_LA_01,
  RM_5_6_LA_02,
  RM_3_4_MAM_YEAR_01,
  RM_4_5_CHI_YEAR_01,
  RM_5_6_LA_YEAR_01,
  ...KOGUMA_ROADMAPS,
  ...COMPREHENSIVE_ROADMAPS,
];
