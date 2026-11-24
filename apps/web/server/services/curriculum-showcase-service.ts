import {
  ACCESS_TIER_CODEC,
  type AccessTierLabel,
  CONTENT_ENTITY_TYPE,
  CONTENT_ENTITY_TYPE_CODEC,
  type CurriculumEntity,
  type AccessTier as DbAccessTier,
  type ListCurriculaPaginatedFilter,
  PROGRAM_TYPE_CODEC,
  type ProgramType,
  type ProgramTypeLabel,
} from "@mindkid/db";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  COMPETENCY_LABELS,
  type ProgramCardPublic,
  type ProgramCompetencyShare,
  type ProgramWeekItemPublic,
  type ProgramWeekPublic,
  type RawCurriculumItemRecord,
  SHOWCASE_GROUP_LABELS,
  type ShowcaseGroup,
  toProgramCardPublic,
  toProgramDetailPublic,
} from "@mindkid/shared";
import {
  ageYearsToKogumaBand,
  computeKogumaPillarDistribution,
  getMoetThemeForWeek,
  type KogumaAgeBand,
  type KogumaMoetThemePublic,
  type KogumaStage,
  type KogumaTrack,
  type KogumaUnitSummary,
  type KogumaVariantCode,
  type MoetPreschoolThemeId,
  parseKogumaProgramMeta,
  resolveKogumaUnitSummaryForItem,
} from "@mindkid/taxonomy";
import {
  GUEST_SEO_TTL,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";
import { useOwnerRepositories } from "#server/utils/repositories";

const CURRICULUM_CODE_REGEX = /^(?:CUR-|RM-)[A-Za-z0-9_-]+$/;
const COMPETENCY_REGEX = /^(?:GL-)?(C[1-6])/i;
const ALL_COMPETENCIES = ["C1", "C2", "C3", "C4", "C5", "C6"] as const;

export interface EnrichedProgramCardPublic extends ProgramCardPublic {
  readonly roadmap_code: string;
  readonly is_koguma: boolean;
  readonly koguma_track: KogumaTrack | null;
  readonly koguma_stage: KogumaStage | null;
  readonly koguma_variant: KogumaVariantCode | null;
  readonly koguma_track_label_vi: string | null;
  readonly moet_themes: readonly KogumaMoetThemePublic[];
}

export interface EnrichedProgramGroupPublic {
  readonly code: ShowcaseGroup;
  readonly label: string;
  readonly programs: EnrichedProgramCardPublic[];
}

interface GameLevelMapEntry {
  code: string;
  title: string;
  accessTier: AccessTier;
  skillCodes: string[];
}

interface KogumaWeekSessionPublic {
  readonly session_no: number;
  readonly koguma_unit: KogumaUnitSummary | null;
}

interface EnrichedProgramPreviewItemPublic extends ProgramWeekItemPublic {
  readonly koguma_unit: KogumaUnitSummary | null;
}

interface EnrichedProgramWeekPublic extends Omit<ProgramWeekPublic, "items"> {
  readonly moet_theme_id: MoetPreschoolThemeId;
  readonly moet_theme_title: string;
  readonly koguma_sessions: readonly KogumaWeekSessionPublic[];
  readonly items?: EnrichedProgramPreviewItemPublic[];
}

const SHOWCASE_GROUP_ORDER: ShowcaseGroup[] = [
  "age",
  "journey",
  "competency",
  "topic",
];

function toRawCurriculumRecord(row: CurriculumEntity) {
  return {
    ...row,
    programType: PROGRAM_TYPE_CODEC.toLabel(row.programType),
    accessTier: ACCESS_TIER_CODEC.toLabel(row.accessTier),
  };
}

export async function listPublicCurriculaShowcase(): Promise<{
  groups: EnrichedProgramGroupPublic[];
}> {
  return await withGuestSeoCache<{ groups: EnrichedProgramGroupPublic[] }>({
    namespace: "curricula-list",
    key: "all",
    ttlSeconds: GUEST_SEO_TTL.MEDIUM,
    fetcher: async () => {
      const { curricula } = useOwnerRepositories();
      const publishedCurricula = await curricula.listPublished();

      if (publishedCurricula.length === 0) {
        return { groups: [] };
      }

      const groupedMap = new Map<ShowcaseGroup, EnrichedProgramCardPublic[]>();
      for (const group of SHOWCASE_GROUP_ORDER) {
        groupedMap.set(group, []);
      }

      for (const row of publishedCurricula) {
        const baseCard = toProgramCardPublic(toRawCurriculumRecord(row));
        const meta = parseKogumaProgramMeta(row.code, row.durationWeeks);
        const enrichedCard: EnrichedProgramCardPublic = {
          ...baseCard,
          roadmap_code: meta.roadmap_code,
          is_koguma: meta.is_koguma,
          koguma_track: meta.koguma_track,
          koguma_stage: meta.koguma_stage,
          koguma_variant: meta.koguma_variant,
          koguma_track_label_vi: meta.koguma_track_label_vi,
          moet_themes: meta.moet_themes,
        };
        const list = groupedMap.get(baseCard.group) ?? [];
        list.push(enrichedCard);
        groupedMap.set(baseCard.group, list);
      }

      const groups: EnrichedProgramGroupPublic[] = [];
      for (const groupCode of SHOWCASE_GROUP_ORDER) {
        const programs = groupedMap.get(groupCode) ?? [];
        if (programs.length > 0) {
          groups.push({
            code: groupCode,
            label: SHOWCASE_GROUP_LABELS[groupCode] || groupCode,
            programs,
          });
        }
      }

      return { groups };
    },
  });
}

async function loadGameLevelsMap(
  entityIds: number[]
): Promise<Map<number, GameLevelMapEntry>> {
  const map = new Map<number, GameLevelMapEntry>();
  if (entityIds.length === 0) {
    return map;
  }

  const { gameLevels, tagging } = useOwnerRepositories();
  const [levelsById, skillsByLevel] = await Promise.all([
    gameLevels.mapByIds(entityIds),
    tagging.mapSkillCodesByLevelIds(entityIds),
  ]);

  for (const [id, row] of levelsById.entries()) {
    map.set(id, {
      code: row.code,
      title: row.title,
      accessTier: ACCESS_TIER_CODEC.toLabel(row.accessTier),
      skillCodes: skillsByLevel.get(id) ?? [],
    });
  }
  return map;
}

function resolveSingleItem(
  item: {
    weekNo: number;
    sessionNo: number;
    position: number;
    entityType: string;
    entityId: number;
  },
  defaultTier: AccessTier,
  gameLevelsMap: Map<number, GameLevelMapEntry>,
  preferredBand: KogumaAgeBand
): {
  raw: RawCurriculumItemRecord;
  kogumaUnit: KogumaUnitSummary | null;
} {
  const gl = gameLevelsMap.get(item.entityId);
  const code = gl?.code || "";
  const kogumaUnit = resolveKogumaUnitSummaryForItem({
    skillCodes: gl?.skillCodes,
    levelCode: code,
    preferredBand,
  });

  return {
    raw: {
      weekNo: item.weekNo,
      sessionNo: item.sessionNo,
      position: item.position,
      entityType: "game_level",
      code,
      title: gl?.title || "",
      estimatedMinutes: 10,
      accessTier: gl?.accessTier || defaultTier,
    },
    kogumaUnit,
  };
}

function resolveWeekMoetTheme(
  weekNo: number,
  durationWeeks: number,
  trackMoetThemes: readonly KogumaMoetThemePublic[]
): { id: MoetPreschoolThemeId; title_vi: string } {
  const fromTrack = trackMoetThemes.find(
    (t) => weekNo >= t.week_start && weekNo <= t.week_end
  );
  if (fromTrack) {
    return { id: fromTrack.id, title_vi: fromTrack.title_vi };
  }
  const fallback = getMoetThemeForWeek(weekNo, durationWeeks);
  return { id: fallback.id, title_vi: fallback.title_vi };
}

function buildEnrichedWeeks(params: {
  baseWeeks: ProgramWeekPublic[];
  durationWeeks: number;
  trackMoetThemes: readonly KogumaMoetThemePublic[];
  unitByWeekItems: Map<number, (KogumaUnitSummary | null)[]>;
  sessionsByWeek: Map<number, KogumaWeekSessionPublic[]>;
}): EnrichedProgramWeekPublic[] {
  const {
    baseWeeks,
    durationWeeks,
    trackMoetThemes,
    unitByWeekItems,
    sessionsByWeek,
  } = params;
  return baseWeeks.map((week) => {
    const moetTheme = resolveWeekMoetTheme(
      week.week_no,
      durationWeeks,
      trackMoetThemes
    );
    const kogumaSessions = sessionsByWeek.get(week.week_no) ?? [];
    const baseEnriched: Omit<EnrichedProgramWeekPublic, "items"> = {
      week_no: week.week_no,
      goal: week.goal,
      session_count: week.session_count,
      item_count: week.item_count,
      moet_theme_id: moetTheme.id,
      moet_theme_title: moetTheme.title_vi,
      koguma_sessions: kogumaSessions,
    };

    if (week.items === undefined) {
      return baseEnriched;
    }

    const weekUnits = unitByWeekItems.get(week.week_no) ?? [];
    const enrichedItems: EnrichedProgramPreviewItemPublic[] = week.items.map(
      (previewItem, idx) => ({
        ...previewItem,
        koguma_unit: weekUnits[idx] ?? null,
      })
    );

    return {
      ...baseEnriched,
      items: enrichedItems,
    };
  });
}

function aggregateCurriculumItems(params: {
  rawItems: {
    weekNo: number;
    sessionNo: number;
    position: number;
    entityType: string;
    entityId: number;
  }[];
  defaultTier: AccessTier;
  gameLevelsMap: Map<number, GameLevelMapEntry>;
  preferredBand: KogumaAgeBand;
}) {
  const { rawItems, defaultTier, gameLevelsMap, preferredBand } = params;
  const competencyCounts = new Map<string, number>();
  let totalCountedItems = 0;

  const resolvedItems: RawCurriculumItemRecord[] = [];
  const allUnits: (KogumaUnitSummary | null)[] = [];
  const unitByWeekItems = new Map<number, (KogumaUnitSummary | null)[]>();
  const sessionsByWeek = new Map<number, KogumaWeekSessionPublic[]>();

  for (const item of rawItems) {
    const { raw, kogumaUnit } = resolveSingleItem(
      item,
      defaultTier,
      gameLevelsMap,
      preferredBand
    );
    resolvedItems.push(raw);
    allUnits.push(kogumaUnit);

    const wUnits = unitByWeekItems.get(item.weekNo) ?? [];
    wUnits.push(kogumaUnit);
    unitByWeekItems.set(item.weekNo, wUnits);

    const wSessions = sessionsByWeek.get(item.weekNo) ?? [];
    if (!wSessions.some((s) => s.session_no === item.sessionNo)) {
      wSessions.push({ session_no: item.sessionNo, koguma_unit: kogumaUnit });
      sessionsByWeek.set(item.weekNo, wSessions);
    }

    const matchedComp = raw.code?.match(COMPETENCY_REGEX)?.[1];
    if (matchedComp) {
      const comp = matchedComp.toUpperCase();
      competencyCounts.set(comp, (competencyCounts.get(comp) || 0) + 1);
      totalCountedItems++;
    }
  }

  const competencyDistribution: ProgramCompetencyShare[] = ALL_COMPETENCIES.map(
    (comp) => {
      const count = competencyCounts.get(comp) || 0;
      const share = totalCountedItems > 0 ? count / totalCountedItems : 0;
      return {
        code: comp,
        label: COMPETENCY_LABELS[comp] || comp,
        share: Number(share.toFixed(3)),
      };
    }
  );

  return {
    resolvedItems,
    allUnits,
    unitByWeekItems,
    sessionsByWeek,
    competencyDistribution,
  };
}

export async function getPublicCurriculumShowcaseDetail(code: string) {
  if (!CURRICULUM_CODE_REGEX.test(code)) {
    throw new CurriculumNotFoundError(code);
  }

  return await withGuestSeoCache({
    namespace: "curriculum-detail",
    key: code,
    ttlSeconds: GUEST_SEO_TTL.MEDIUM,
    fetcher: async () => {
      const { curricula } = useOwnerRepositories();
      const candidateCodes = code.startsWith("CUR-")
        ? [code]
        : [code, `CUR-${code}`];

      const curriculum = await curricula.findByCode(candidateCodes);
      if (!curriculum) {
        throw new CurriculumNotFoundError(code);
      }

      const [rawWeeks, rawItems] = await Promise.all([
        curricula.listWeeks(curriculum.id),
        curricula.listItems(curriculum.id),
      ]);

      const gameLevelIds = rawItems
        .filter((i) => i.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL)
        .map((i) => i.entityId);

      const gameLevelsMap = await loadGameLevelsMap(gameLevelIds);
      const kogumaMeta = parseKogumaProgramMeta(
        curriculum.code,
        curriculum.durationWeeks
      );
      const preferredBand =
        kogumaMeta.age_band ?? ageYearsToKogumaBand(curriculum.targetAgeMin);

      const {
        resolvedItems,
        allUnits,
        unitByWeekItems,
        sessionsByWeek,
        competencyDistribution,
      } = aggregateCurriculumItems({
        rawItems: rawItems.map((item) => ({
          ...item,
          entityType: CONTENT_ENTITY_TYPE_CODEC.toLabel(item.entityType),
        })),
        defaultTier: ACCESS_TIER_CODEC.toLabel(curriculum.accessTier),
        gameLevelsMap,
        preferredBand,
      });

      const baseDetail = toProgramDetailPublic({
        curriculum: toRawCurriculumRecord(curriculum),
        weeks: rawWeeks,
        items: resolvedItems,
        competencyDistribution,
      });

      const enrichedWeeks = buildEnrichedWeeks({
        baseWeeks: baseDetail.weeks,
        durationWeeks: curriculum.durationWeeks,
        trackMoetThemes: kogumaMeta.moet_themes,
        unitByWeekItems,
        sessionsByWeek,
      });

      return {
        ...baseDetail,
        roadmap_code: kogumaMeta.roadmap_code,
        is_koguma: kogumaMeta.is_koguma,
        koguma_track: kogumaMeta.koguma_track,
        koguma_stage: kogumaMeta.koguma_stage,
        koguma_variant: kogumaMeta.koguma_variant,
        koguma_track_label_vi: kogumaMeta.koguma_track_label_vi,
        moet_themes: kogumaMeta.moet_themes,
        pillar_distribution: computeKogumaPillarDistribution(allUnits),
        weeks: enrichedWeeks,
      };
    },
  });
}

export type ListManagerCurriculaCatalogFilter = Omit<
  ListCurriculaPaginatedFilter,
  "programType" | "accessTier"
> & {
  readonly programType?: DbAccessTier extends never
    ? never
    : ProgramType | ProgramTypeLabel;
  readonly accessTier?: DbAccessTier | AccessTierLabel;
};

export async function listManagerCurriculaCatalog(
  filter: ListManagerCurriculaCatalogFilter
) {
  const { curricula } = useOwnerRepositories();
  const normalizedFilter: ListCurriculaPaginatedFilter = {
    ...filter,
    programType:
      typeof filter.programType === "string"
        ? PROGRAM_TYPE_CODEC.toCode(filter.programType)
        : filter.programType,
    accessTier:
      typeof filter.accessTier === "string"
        ? ACCESS_TIER_CODEC.toCode(filter.accessTier)
        : filter.accessTier,
  };
  const paginated = await curricula.listPaginatedForManager(normalizedFilter);

  const enrichedRows = paginated.items.map((row) => {
    const meta = parseKogumaProgramMeta(row.code, row.durationWeeks);
    return {
      ...row,
      roadmap_code: meta.roadmap_code,
      is_koguma: meta.is_koguma,
      koguma_track: meta.koguma_track,
      koguma_stage: meta.koguma_stage,
      koguma_variant: meta.koguma_variant,
      koguma_track_label_vi: meta.koguma_track_label_vi,
      moet_themes: meta.moet_themes,
    };
  });

  return {
    items: enrichedRows,
    total: paginated.total,
    page: paginated.page,
    limit: paginated.limit,
  };
}
