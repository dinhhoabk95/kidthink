import {
  KOGUMA_DOMAINS,
  type KogumaAgeBand,
  type KogumaDomainDef,
  type KogumaMoetThemePublic,
  type KogumaPillarCode,
  type KogumaPillarShare,
  type KogumaProgramMeta,
  type KogumaSiblingTrackInfo,
  type KogumaStage,
  type KogumaTrack,
  type KogumaUnitDef,
  type KogumaUnitSchedule,
  type KogumaUnitSummary,
  type KogumaVariantCode,
  MOET_PRESCHOOL_THEMES,
  type MoetPreschoolThemeDef,
  type MoetPreschoolThemeId,
} from "./koguma-types.js";
import { KOGUMA_CHOI_UNITS } from "./koguma-units-choi.js";
import { KOGUMA_LA_UNITS } from "./koguma-units-la.js";
import { KOGUMA_MAM_UNITS } from "./koguma-units-mam.js";

export const KOGUMA_100_UNITS: readonly KogumaUnitDef[] = [
  ...KOGUMA_MAM_UNITS,
  ...KOGUMA_CHOI_UNITS,
  ...KOGUMA_LA_UNITS,
];

const UNIT_BY_CODE = new Map<string, KogumaUnitDef>(
  KOGUMA_100_UNITS.map((u) => [u.unit_code, u])
);

const DOMAIN_BY_CODE = new Map<KogumaPillarCode, KogumaDomainDef>(
  KOGUMA_DOMAINS.map((d) => [d.code, d])
);

const MOET_BY_ID = new Map<string, MoetPreschoolThemeDef>(
  MOET_PRESCHOOL_THEMES.map((t) => [t.id, t])
);

const PRIMARY_SKILL_MAP = new Map<string, KogumaUnitDef[]>();
const SUPPORT_SKILL_MAP = new Map<string, KogumaUnitDef[]>();
const STRAND_PREFIX_MAP = new Map<string, KogumaUnitDef[]>();

for (const unit of KOGUMA_100_UNITS) {
  const primaryList = PRIMARY_SKILL_MAP.get(unit.primary_skill_code) ?? [];
  primaryList.push(unit);
  PRIMARY_SKILL_MAP.set(unit.primary_skill_code, primaryList);

  const strandPrefix = unit.primary_skill_code.split(".").slice(0, 2).join(".");
  const strandList = STRAND_PREFIX_MAP.get(strandPrefix) ?? [];
  strandList.push(unit);
  STRAND_PREFIX_MAP.set(strandPrefix, strandList);

  for (const sc of unit.support_skill_codes) {
    const supList = SUPPORT_SKILL_MAP.get(sc) ?? [];
    supList.push(unit);
    SUPPORT_SKILL_MAP.set(sc, supList);
  }
}

const BAND_REGEX = /(?:^|-)(3-4|4-5|5-6)(?:-|$)/;
const KOGUMA_REGEX = /koguma/i;
const YEAR_TRACK_REGEX = /koguma-year/i;
const STAGE_2_REGEX = /koguma(?:-year)?-0?2(?:-|$)/i;
const STAGE_2_TITLE_REGEX = /chặng\s*2|học\s*kỳ\s*2|giai\s*đoạn\s*2/i;
const GL_SKILL_REGEX = /^GL-(C[1-6])-([A-Z]{2,5})(?:-(\d{2}))?/i;
const CUR_PREFIX_REGEX = /^CUR-/;

function pickPreferredBand(
  candidates: readonly KogumaUnitDef[],
  preferredBand?: KogumaAgeBand | null
): KogumaUnitDef | undefined {
  if (candidates.length === 0) {
    return undefined;
  }
  if (preferredBand) {
    const exact = candidates.find((u) => u.age_band === preferredBand);
    if (exact) {
      return exact;
    }
  }
  return candidates[0];
}

export function isKogumaAgeBand(
  value: string | null | undefined
): value is KogumaAgeBand {
  return value === "3-4" || value === "4-5" || value === "5-6";
}

export function ageYearsToKogumaBand(
  ageYears: number | null | undefined
): KogumaAgeBand {
  if (typeof ageYears !== "number" || Number.isNaN(ageYears)) {
    return "4-5";
  }
  if (ageYears <= 3) {
    return "3-4";
  }
  if (ageYears === 4) {
    return "4-5";
  }
  return "5-6";
}

export function getKogumaDomainByCode(
  code: KogumaPillarCode
): KogumaDomainDef | undefined {
  return DOMAIN_BY_CODE.get(code);
}

export function getKogumaUnitByCode(code: string): KogumaUnitDef | undefined {
  return UNIT_BY_CODE.get(code.trim().toUpperCase());
}

export const getKogumaUnit = getKogumaUnitByCode;

export function getKogumaUnitBySkillCode(
  skillCode: string,
  preferredBand?: KogumaAgeBand | null
): KogumaUnitDef | undefined {
  const normalized = skillCode.trim().toUpperCase();
  const primaryMatches = PRIMARY_SKILL_MAP.get(normalized);
  if (primaryMatches && primaryMatches.length > 0) {
    return pickPreferredBand(primaryMatches, preferredBand);
  }
  const supportMatches = SUPPORT_SKILL_MAP.get(normalized);
  if (supportMatches && supportMatches.length > 0) {
    return pickPreferredBand(supportMatches, preferredBand);
  }
  const strandPrefix = normalized.split(".").slice(0, 2).join(".");
  const strandMatches = STRAND_PREFIX_MAP.get(strandPrefix);
  return strandMatches
    ? pickPreferredBand(strandMatches, preferredBand)
    : undefined;
}

export function getKogumaUnitSchedule(
  unitOrSkillCode: string,
  preferredBand?: KogumaAgeBand | null
): KogumaUnitSchedule | undefined {
  const trimmed = unitOrSkillCode.trim();
  const unit = trimmed.toUpperCase().startsWith("KGM-")
    ? getKogumaUnitByCode(trimmed)
    : getKogumaUnitBySkillCode(trimmed, preferredBand);
  if (!unit) {
    return undefined;
  }
  return {
    unit_code: unit.unit_code,
    age_band: unit.age_band,
    primary_skill_code: unit.primary_skill_code,
    scheduled_roadmap_code: unit.scheduled_roadmap_code,
    scheduled_curriculum_code: unit.scheduled_curriculum_code,
    scheduled_week_no: unit.scheduled_week_no,
    scheduled_core_roadmap_code: unit.scheduled_core_roadmap_code,
    scheduled_core_week_no: unit.scheduled_core_week_no,
  };
}

export function getKogumaUnitByLevelOrSkillCode(
  codeOrSkill: string,
  preferredBand?: KogumaAgeBand | null
): KogumaUnitDef | undefined {
  const trimmed = codeOrSkill.trim();
  if (trimmed.toUpperCase().startsWith("KGM-")) {
    return getKogumaUnitByCode(trimmed);
  }
  if (trimmed.includes(".")) {
    return getKogumaUnitBySkillCode(trimmed, preferredBand);
  }
  const glMatch = GL_SKILL_REGEX.exec(trimmed);
  if (!glMatch) {
    return undefined;
  }
  const comp = (glMatch[1] ?? "").toUpperCase();
  const strand = (glMatch[2] ?? "").toUpperCase();
  const num = glMatch[3];
  if (num) {
    const byExactSkill = getKogumaUnitBySkillCode(
      `${comp}.${strand}.${num}`,
      preferredBand
    );
    if (byExactSkill) {
      return byExactSkill;
    }
  }
  const strandMatches = STRAND_PREFIX_MAP.get(`${comp}.${strand}`);
  return strandMatches
    ? pickPreferredBand(strandMatches, preferredBand)
    : undefined;
}

export function getKogumaUnitsForBand(
  band: KogumaAgeBand
): readonly KogumaUnitDef[] {
  return KOGUMA_100_UNITS.filter((u) => u.age_band === band);
}

export function getKogumaUnitsForPillar(
  pillar: KogumaPillarCode,
  band?: KogumaAgeBand
): readonly KogumaUnitDef[] {
  return KOGUMA_100_UNITS.filter(
    (u) => u.pillar === pillar && (!band || u.age_band === band)
  );
}

export function getKogumaUnitsForMoetTheme(
  themeId: MoetPreschoolThemeId,
  band?: KogumaAgeBand
): readonly KogumaUnitDef[] {
  return KOGUMA_100_UNITS.filter(
    (u) => u.moet_theme === themeId && (!band || u.age_band === band)
  );
}

export function getMoetThemeById(
  themeId: string
): MoetPreschoolThemeDef | undefined {
  return MOET_BY_ID.get(themeId);
}

const DEFAULT_MOET_THEME: MoetPreschoolThemeDef = {
  order: 1,
  id: "mam_non",
  title_vi: "Trường mầm non",
  roadmap_label_vi: "Trường mầm non",
  week_start: 1,
  week_end: 3,
  content_themes_by_band: {
    "3-4": ["school"],
    "4-5": ["school"],
    "5-6": ["school"],
  },
};

export function getMoetThemeForWeek(
  weekNo: number,
  totalWeeks = 36
): MoetPreschoolThemeDef {
  const safeTotal = totalWeeks > 0 ? totalWeeks : 36;
  const clampedWeek = Math.max(1, Math.min(weekNo, safeTotal));
  const scaledWeek =
    safeTotal === 36
      ? clampedWeek
      : Math.max(1, Math.min(36, Math.ceil((clampedWeek / safeTotal) * 36)));
  const found = MOET_PRESCHOOL_THEMES.find(
    (t) => scaledWeek >= t.week_start && scaledWeek <= t.week_end
  );
  return found ?? MOET_PRESCHOOL_THEMES[0] ?? DEFAULT_MOET_THEME;
}

export function toPublicMoetTheme(
  theme: MoetPreschoolThemeDef,
  weekStartOverride?: number,
  weekEndOverride?: number
): KogumaMoetThemePublic {
  return {
    id: theme.id,
    order: theme.order,
    title_vi: theme.title_vi,
    roadmap_label_vi: theme.roadmap_label_vi,
    week_start: weekStartOverride ?? theme.week_start,
    week_end: weekEndOverride ?? theme.week_end,
  };
}

export function getPublicMoetThemesForTrack(
  track: KogumaTrack | null,
  stage: KogumaStage = 1
): readonly KogumaMoetThemePublic[] {
  if (!track) {
    return [];
  }
  if (track === "year_36w") {
    return MOET_PRESCHOOL_THEMES.map((t) => toPublicMoetTheme(t));
  }
  const slice =
    stage === 2
      ? MOET_PRESCHOOL_THEMES.slice(4, 10)
      : MOET_PRESCHOOL_THEMES.slice(0, 6);
  return slice.map((t, idx) => toPublicMoetTheme(t, idx * 2 + 1, idx * 2 + 2));
}

export function getKogumaSiblingTracksForBand(
  band: KogumaAgeBand
): readonly KogumaSiblingTrackInfo[] {
  return [
    {
      variant: "01",
      koguma_track: "core_12w",
      koguma_stage: 1,
      roadmap_code: `RM-${band}-koguma-01`,
      curriculum_code: `CUR-RM-${band}-koguma-01`,
      duration_weeks: 12,
      label_vi: "Học kỳ 1 · 12 tuần",
      short_label_vi: "HK1 · 12w",
    },
    {
      variant: "02",
      koguma_track: "core_12w",
      koguma_stage: 2,
      roadmap_code: `RM-${band}-koguma-02`,
      curriculum_code: `CUR-RM-${band}-koguma-02`,
      duration_weeks: 12,
      label_vi: "Học kỳ 2 · 12 tuần",
      short_label_vi: "HK2 · 12w",
    },
    {
      variant: "year-01",
      koguma_track: "year_36w",
      koguma_stage: 1,
      roadmap_code: `RM-${band}-koguma-year-01`,
      curriculum_code: `CUR-RM-${band}-koguma-year-01`,
      duration_weeks: 36,
      label_vi: "Năm học · 36 tuần (Chặng 1)",
      short_label_vi: "Năm học · Chặng 1",
    },
    {
      variant: "year-02",
      koguma_track: "year_36w",
      koguma_stage: 2,
      roadmap_code: `RM-${band}-koguma-year-02`,
      curriculum_code: `CUR-RM-${band}-koguma-year-02`,
      duration_weeks: 36,
      label_vi: "Năm học · 36 tuần (Chặng 2)",
      short_label_vi: "Năm học · Chặng 2",
    },
  ];
}

export function normalizeCurriculumRoadmapCode(code: string): {
  readonly roadmap_code: string;
  readonly curriculum_code: string;
} {
  const trimmed = code.trim();
  const stripped = trimmed.replace(CUR_PREFIX_REGEX, "");
  return {
    roadmap_code: stripped,
    curriculum_code: stripped.startsWith("RM-") ? `CUR-${stripped}` : trimmed,
  };
}

export function isKogumaProgramCode(code: string | null | undefined): boolean {
  if (!code) {
    return false;
  }
  return KOGUMA_REGEX.test(code);
}

export function parseKogumaProgramMeta(
  code: string,
  durationWeeks?: number | null
): KogumaProgramMeta {
  const { roadmap_code, curriculum_code } =
    normalizeCurriculumRoadmapCode(code);
  const bandMatch = BAND_REGEX.exec(roadmap_code);
  const ageBand = isKogumaAgeBand(bandMatch?.[1]) ? bandMatch[1] : null;
  const isKoguma = isKogumaProgramCode(roadmap_code);

  if (!isKoguma) {
    return {
      is_koguma: false,
      koguma_track: null,
      koguma_stage: null,
      koguma_variant: null,
      koguma_track_label_vi: null,
      age_band: ageBand,
      roadmap_code,
      curriculum_code,
      moet_themes: [],
    };
  }

  const isYear =
    YEAR_TRACK_REGEX.test(roadmap_code) ||
    (typeof durationWeeks === "number" && durationWeeks >= 30);
  const track: KogumaTrack = isYear ? "year_36w" : "core_12w";
  const stage: KogumaStage = STAGE_2_REGEX.test(roadmap_code) ? 2 : 1;

  let variant: KogumaVariantCode;
  let trackLabelVi: string;
  if (isYear) {
    variant = stage === 2 ? "year-02" : "year-01";
    trackLabelVi =
      stage === 2
        ? "Năm học · 36 tuần (Chặng 2)"
        : "Năm học · 36 tuần (Chặng 1)";
  } else {
    variant = stage === 2 ? "02" : "01";
    trackLabelVi = stage === 2 ? "Học kỳ 2 · 12 tuần" : "Học kỳ 1 · 12 tuần";
  }

  return {
    is_koguma: true,
    koguma_track: track,
    koguma_stage: stage,
    koguma_variant: variant,
    koguma_track_label_vi: trackLabelVi,
    age_band: ageBand,
    roadmap_code,
    curriculum_code,
    moet_themes: getPublicMoetThemesForTrack(track, stage),
  };
}

export function toKogumaUnitSummary(
  unit: KogumaUnitDef,
  preferredBand?: KogumaAgeBand | null
): KogumaUnitSummary {
  const domain = DOMAIN_BY_CODE.get(unit.pillar_code);
  const prompt =
    preferredBand && unit.offscreen_parent_activity[preferredBand]
      ? unit.offscreen_parent_activity[preferredBand]
      : unit.taiwa_parent_prompt_vi;

  return {
    code: unit.code,
    title_vi: unit.title_vi,
    pillar_code: unit.pillar_code,
    pillar_title_vi: domain?.title_vi ?? unit.pillar_code,
    moet_theme_id: unit.moet_theme,
    moet_theme_title: unit.moet_theme_title,
    jibutsu_manipulative_vi: unit.jibutsu_manipulative_vi,
    taiwa_parent_prompt_vi: prompt,
    primary_skill_code: unit.primary_skill_code,
    age_band: unit.age_band,
    scheduled_roadmap_code: unit.scheduled_roadmap_code,
    scheduled_curriculum_code: unit.scheduled_curriculum_code,
    scheduled_week_no: unit.scheduled_week_no,
    scheduled_core_roadmap_code: unit.scheduled_core_roadmap_code,
    scheduled_core_week_no: unit.scheduled_core_week_no,
  };
}

export function resolveKogumaUnitSummaryForItem(params: {
  readonly skillCodes?: readonly string[];
  readonly levelCode?: string | null;
  readonly preferredBand?: KogumaAgeBand | null;
}): KogumaUnitSummary | null {
  const band = params.preferredBand ?? null;
  if (params.skillCodes) {
    for (const sc of params.skillCodes) {
      const unit = getKogumaUnitBySkillCode(sc, band);
      if (unit) {
        return toKogumaUnitSummary(unit, band);
      }
    }
  }
  if (params.levelCode) {
    const unit = getKogumaUnitByLevelOrSkillCode(params.levelCode, band);
    if (unit) {
      return toKogumaUnitSummary(unit, band);
    }
  }
  return null;
}

export function computeKogumaPillarDistribution(
  units: readonly (KogumaUnitSummary | null | undefined)[]
): readonly KogumaPillarShare[] {
  const counts = new Map<KogumaPillarCode, number>();
  let total = 0;
  for (const unit of units) {
    if (!unit) {
      continue;
    }
    counts.set(unit.pillar_code, (counts.get(unit.pillar_code) ?? 0) + 1);
    total += 1;
  }

  return KOGUMA_DOMAINS.map((domain) => {
    const count = counts.get(domain.code) ?? 0;
    const share = total > 0 ? Number((count / total).toFixed(3)) : 0;
    return {
      code: domain.code,
      title_vi: domain.title_vi,
      short_title_vi: domain.short_title_vi,
      count,
      share,
    };
  });
}

export function inferKogumaMetaFromTitleOrCode(input: {
  readonly code?: string | null;
  readonly title?: string | null;
  readonly durationWeeks?: number | null;
  readonly ageMin?: number | null;
}): KogumaProgramMeta {
  if (input.code && isKogumaProgramCode(input.code)) {
    return parseKogumaProgramMeta(input.code, input.durationWeeks);
  }
  const titleText = input.title ?? "";
  if (KOGUMA_REGEX.test(titleText)) {
    const band = ageYearsToKogumaBand(input.ageMin);
    const isYear =
      typeof input.durationWeeks === "number" && input.durationWeeks >= 30;
    const isStage2 = STAGE_2_TITLE_REGEX.test(titleText);
    let syntheticCode: string;
    if (isYear) {
      syntheticCode = isStage2
        ? `RM-${band}-koguma-year-02`
        : `RM-${band}-koguma-year-01`;
    } else {
      syntheticCode = isStage2
        ? `RM-${band}-koguma-02`
        : `RM-${band}-koguma-01`;
    }
    return parseKogumaProgramMeta(syntheticCode, input.durationWeeks);
  }
  return parseKogumaProgramMeta(input.code ?? "", input.durationWeeks);
}
