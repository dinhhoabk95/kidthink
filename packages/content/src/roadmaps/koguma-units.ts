import type {
  KogumaPillarCode,
  KogumaUnitDef,
  KogumaUnitSchedule,
  MoetPreschoolThemeId,
} from "./koguma-types.js";
import { KOGUMA_CHOI_UNITS } from "./koguma-units-choi.js";
import { KOGUMA_LA_UNITS } from "./koguma-units-la.js";
import { KOGUMA_MAM_UNITS } from "./koguma-units-mam.js";
import type { RoadmapBand } from "./types.js";

export const KOGUMA_100_UNITS: readonly KogumaUnitDef[] = [
  ...KOGUMA_MAM_UNITS,
  ...KOGUMA_CHOI_UNITS,
  ...KOGUMA_LA_UNITS,
];

const UNIT_BY_CODE = new Map<string, KogumaUnitDef>(
  KOGUMA_100_UNITS.map((unit) => [unit.unit_code, unit])
);

const UNIT_BY_SKILL = new Map<string, KogumaUnitDef>(
  KOGUMA_100_UNITS.flatMap((unit) => [
    [unit.primary_skill_code, unit] as const,
    ...unit.support_skill_codes.map((code) => [code, unit] as const),
  ])
);

export function getKogumaUnit(unitCode: string): KogumaUnitDef | undefined {
  return UNIT_BY_CODE.get(unitCode.trim().toUpperCase());
}

export function getKogumaUnitBySkillCode(
  skillCode: string
): KogumaUnitDef | undefined {
  return UNIT_BY_SKILL.get(skillCode.trim().toUpperCase());
}

export function getKogumaUnitSchedule(
  unitOrSkillCode: string
): KogumaUnitSchedule | undefined {
  const normalized = unitOrSkillCode.trim().toUpperCase();
  const unit = normalized.startsWith("KGM-")
    ? UNIT_BY_CODE.get(normalized)
    : UNIT_BY_SKILL.get(normalized);
  if (!unit) {
    return undefined;
  }
  return {
    unit_code: unit.unit_code,
    age_band: unit.age_band,
    primary_skill_code: unit.primary_skill_code,
    scheduled_roadmap_code: unit.scheduled_roadmap_code,
    scheduled_week_no: unit.scheduled_week_no,
    scheduled_core_roadmap_code: unit.scheduled_core_roadmap_code,
    scheduled_core_week_no: unit.scheduled_core_week_no,
  };
}

export function getKogumaUnitsForBand(
  band: RoadmapBand
): readonly KogumaUnitDef[] {
  return KOGUMA_100_UNITS.filter((unit) => unit.age_band === band);
}

export function getKogumaUnitsForPillar(
  pillar: KogumaPillarCode
): readonly KogumaUnitDef[] {
  return KOGUMA_100_UNITS.filter((unit) => unit.pillar === pillar);
}

export function getKogumaUnitsForMoetTheme(
  moetTheme: MoetPreschoolThemeId
): readonly KogumaUnitDef[] {
  return KOGUMA_100_UNITS.filter((unit) => unit.moet_theme === moetTheme);
}
