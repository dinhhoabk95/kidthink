import {
  CHILD_STATUS,
  type ChildProfileEntity,
  type CompetencyEntity,
  type SkillEntity,
  type StrandEntity,
} from "@mindkid/db";
import { NoActiveChildError } from "@mindkid/errors/child";
import { NotFoundError } from "@mindkid/errors/common";
import {
  allowedTiers,
  COMPETENCY_CATALOG,
  type CopySystemCurriculumInput,
  deriveAgeBand,
  type MascotGearPutInput,
  type StickerDioramaPutInput,
} from "@mindkid/shared";
import {
  ageYearsToKogumaBand,
  getKogumaUnitsForBand,
  getMoetThemeById,
  getMoetThemeForWeek,
  inferKogumaMetaFromTitleOrCode,
  isKogumaAgeBand,
  type KogumaAgeBand,
  type KogumaMoetThemePublic,
  type KogumaUnitSummary,
  parseKogumaProgramMeta,
  resolveKogumaUnitSummaryForItem,
  toKogumaUnitSummary,
  toPublicMoetTheme,
} from "@mindkid/taxonomy";
import { findCompletedLevelCodes } from "#server/utils/concept-intro-runtime";
import { requireCurrentConsent } from "#server/utils/consent-guard";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";
import { getChildCompetencyGames } from "./child-competency-explorer.js";
import { loadStickerAlbum } from "./child-stickers.js";
import { getChildThemeMap } from "./child-theme-map.js";
import {
  getChildMascotGear,
  getDailyAdventure,
  getStickerDiorama,
  saveStickerDiorama,
  updateChildMascotGear,
} from "./kid-world.js";
import {
  copySystemCurriculum,
  getPersonalCurriculumByUuid,
} from "./personal-curriculum.js";
import type { PersonalCurriculumCallerContext } from "./personal-curriculum-enrollment.js";
import { getRecommendationsForChild } from "./recommendation.js";

export const COMPETENCY_CARDS = COMPETENCY_CATALOG.map((entry) => ({
  code: entry.code,
  name: entry.name,
  icon_id: `topic-${entry.code.toLowerCase()}`,
}));

export type StageVisualStatus = "not_started" | "learning" | "stable";

export interface MapMilestoneStage {
  strand_code: string;
  strand_name: string;
  competency_code: string;
  status: StageVisualStatus;
  has_star: boolean;
  is_current_focus: boolean;
}

export interface MapBadgePayload {
  badge_code: string;
  awarded_at: string;
}

export interface ChildPlayMapResponse {
  child: {
    uuid: string;
    display_name: string;
    avatar_id: string | null;
  };
  active_regions: Array<{
    competency_code: string;
    competency_name: string;
    stages: MapMilestoneStage[];
  }>;
  badges: MapBadgePayload[];
  completed_level_codes: string[];
}

interface SkillMasteryInfo {
  bestPLearn: number;
  attemptsTotal: number;
}

export async function resolveOwnedActiveChildProfile(
  userId: number,
  candidateUuid: string | undefined,
  missingMessage = "Vui lòng chọn hồ sơ trẻ trước khi tiếp tục."
): Promise<ChildProfileEntity> {
  if (!candidateUuid) {
    throw new NoActiveChildError(missingMessage);
  }
  await requireCurrentConsent(userId, "child_data");

  const repos = useOwnerRepositories();
  const activeChild = await repos.childProfiles.findByUuidForUser(
    candidateUuid,
    userId
  );

  if (activeChild?.status !== CHILD_STATUS.ACTIVE) {
    throw new NoActiveChildError(
      "Hồ sơ trẻ không tồn tại hoặc đã bị lưu trữ. Vui lòng chọn lại."
    );
  }

  return activeChild;
}

async function resolveChildHomeKogumaContext(params: {
  childId: number;
  band: KogumaAgeBand;
  continueLevelId: number | null;
  continueLevelCode: string | null;
}) {
  const repos = useOwnerRepositories();
  const { childId, band, continueLevelId, continueLevelCode } = params;
  const enrollment = await repos.curricula.findEnrollmentForChild(
    childId,
    true
  );

  const fallbackCode = `CUR-RM-${band}-koguma-year-01`;
  const meta = parseKogumaProgramMeta(
    enrollment?.curriculum.code ?? fallbackCode,
    enrollment?.curriculum.durationWeeks ?? 36
  );

  let currentUnit: KogumaUnitSummary | null = null;
  if (continueLevelId || continueLevelCode) {
    const skillMap = continueLevelId
      ? await repos.tagging.mapSkillCodesByLevelIds([continueLevelId])
      : new Map<number, string[]>();
    const skillCodes = continueLevelId
      ? (skillMap.get(continueLevelId) ?? [])
      : [];
    currentUnit = resolveKogumaUnitSummaryForItem({
      skillCodes,
      levelCode: continueLevelCode,
      preferredBand: band,
    });
  }
  if (!currentUnit) {
    const bandUnits = getKogumaUnitsForBand(band);
    const matchedRoadmapUnit = meta.is_koguma
      ? bandUnits.find(
          (u) =>
            u.scheduled_roadmap_code === meta.roadmap_code ||
            u.scheduled_core_roadmap_code === meta.roadmap_code
        )
      : undefined;
    const fallbackUnit = matchedRoadmapUnit ?? bandUnits[0];
    currentUnit = fallbackUnit ? toKogumaUnitSummary(fallbackUnit, band) : null;
  }

  const matchedTheme = currentUnit
    ? getMoetThemeById(currentUnit.moet_theme_id)
    : undefined;
  const activeMoetTheme = matchedTheme
    ? toPublicMoetTheme(matchedTheme)
    : (meta.moet_themes[0] ??
      toPublicMoetTheme(
        getMoetThemeForWeek(1, enrollment?.curriculum.durationWeeks ?? 36)
      ));

  return {
    roadmap_code: meta.roadmap_code,
    is_koguma: meta.is_koguma,
    koguma_track: meta.koguma_track,
    koguma_stage: meta.koguma_stage,
    koguma_variant: meta.koguma_variant,
    koguma_track_label_vi: meta.koguma_track_label_vi,
    moet_themes: meta.moet_themes,
    active_moet_theme: activeMoetTheme,
    current_koguma_unit: currentUnit,
  };
}

export async function getChildPlayHomeExperience(
  userId: number,
  candidateUuid: string | undefined
) {
  const activeChild = await resolveOwnedActiveChildProfile(
    userId,
    candidateUuid,
    "Vui lòng chọn hồ sơ trẻ trước khi vào sảnh chơi."
  );

  const repos = useOwnerRepositories();
  const currentYear = new Date().getFullYear();
  const ageBand = deriveAgeBand(activeChild.birthYear, currentYear);
  const kogumaBand: KogumaAgeBand = isKogumaAgeBand(ageBand) ? ageBand : "4-5";

  const lastSession = await repos.playSessions.findLatestInProgressForChild(
    activeChild.id
  );

  const kogumaCtx = await resolveChildHomeKogumaContext({
    childId: activeChild.id,
    band: kogumaBand,
    continueLevelId: lastSession?.gameLevelId ?? null,
    continueLevelCode: lastSession?.gameLevel.code ?? null,
  });

  const continueLevel = lastSession
    ? {
        session_uuid: lastSession.sessionUuid,
        game_level_code: lastSession.gameLevel.code ?? "",
        koguma_unit: kogumaCtx.current_koguma_unit,
      }
    : null;

  return {
    child: {
      uuid: activeChild.uuid,
      display_name: activeChild.displayName,
      avatar_id: activeChild.avatarId,
      age_band: ageBand,
    },
    continue_level: continueLevel,
    competency_cards: COMPETENCY_CARDS,
    locked_items: [
      {
        code: "LVL-PREMIUM-LOCK",
        locked: true,
        icon: "🔒",
      },
    ],
    ...kogumaCtx,
  };
}

function evaluateStrandStage(params: {
  strand: StrandEntity;
  stSkills: SkillEntity[];
  competenciesList: CompetencyEntity[];
  masteryBySkillId: Map<number, SkillMasteryInfo>;
  foundFirstLearning: boolean;
}): { stage: MapMilestoneStage; isFirstLearning: boolean } {
  const {
    strand,
    stSkills,
    competenciesList,
    masteryBySkillId,
    foundFirstLearning,
  } = params;
  const compId = Number(strand.competencyId);

  let hasTouch = false;
  let allStable = stSkills.length > 0;

  for (const sk of stSkills) {
    const m = masteryBySkillId.get(Number(sk.id));
    if (m && (m.attemptsTotal > 0 || m.bestPLearn > 0.1)) {
      hasTouch = true;
    }
    if (!m || m.bestPLearn < 0.8) {
      allStable = false;
    }
  }

  let status: StageVisualStatus = "not_started";
  let hasStar = false;
  let isCurrentFocus = false;
  let markedFirstLearning = false;

  if (allStable) {
    status = "stable";
    hasStar = true;
  } else if (hasTouch) {
    status = "learning";
    if (!foundFirstLearning) {
      isCurrentFocus = true;
      markedFirstLearning = true;
    }
  }

  const stage: MapMilestoneStage = {
    strand_code: strand.code,
    strand_name: strand.name,
    competency_code:
      competenciesList.find((c) => Number(c.id) === compId)?.code ?? "C1",
    status,
    has_star: hasStar,
    is_current_focus: isCurrentFocus,
  };

  return { stage, isFirstLearning: markedFirstLearning };
}

function buildActiveRegions(params: {
  allCompetencies: CompetencyEntity[];
  allStrands: StrandEntity[];
  allSkills: SkillEntity[];
  masteryBySkillId: Map<number, SkillMasteryInfo>;
}) {
  const { allCompetencies, allStrands, allSkills, masteryBySkillId } = params;

  const skillsByStrandId = new Map<number, SkillEntity[]>();
  for (const sk of allSkills) {
    const strandId = Number(sk.strandId);
    const list = skillsByStrandId.get(strandId) ?? [];
    list.push(sk);
    skillsByStrandId.set(strandId, list);
  }

  let foundFirstLearning = false;
  const strandsByCompetencyId = new Map<number, MapMilestoneStage[]>();

  for (const st of allStrands) {
    const compId = Number(st.competencyId);
    const stSkills = skillsByStrandId.get(Number(st.id)) ?? [];

    const { stage, isFirstLearning } = evaluateStrandStage({
      strand: st,
      stSkills,
      competenciesList: allCompetencies,
      masteryBySkillId,
      foundFirstLearning,
    });

    if (isFirstLearning) {
      foundFirstLearning = true;
    }

    const list = strandsByCompetencyId.get(compId) ?? [];
    list.push(stage);
    strandsByCompetencyId.set(compId, list);
  }

  return allCompetencies.slice(0, 2).map((c) => ({
    competency_code: c.code,
    competency_name: c.name,
    stages: strandsByCompetencyId.get(Number(c.id)) ?? [],
  }));
}

export async function getChildPlayMapExperience(
  userId: number,
  candidateUuid: string | undefined
): Promise<ChildPlayMapResponse> {
  const activeChild = await resolveOwnedActiveChildProfile(
    userId,
    candidateUuid,
    "Vui lòng chọn hồ sơ trẻ trước khi xem bản đồ tiến độ."
  );

  const repos = useOwnerRepositories();
  const childId = Number(activeChild.id);

  const [
    allCompetencies,
    allStrands,
    allSkills,
    childMasteryRows,
    badgeRows,
    completedCodes,
  ] = await Promise.all([
    repos.taxonomy.listCompetencies(),
    repos.taxonomy.listStrands(),
    repos.taxonomy.listSkills(),
    repos.mastery.listForChild(childId),
    repos.badges.listForChild(childId),
    findCompletedLevelCodes(childId),
  ]);

  const masteryBySkillId = new Map(
    childMasteryRows.map((row) => [
      Number(row.skillId),
      {
        bestPLearn: Number(row.bestPLearn),
        attemptsTotal: row.attemptsTotal,
      },
    ])
  );

  const activeRegions = buildActiveRegions({
    allCompetencies,
    allStrands,
    allSkills,
    masteryBySkillId,
  });

  const badges: MapBadgePayload[] = badgeRows.map((b) => ({
    badge_code: b.badgeCode,
    awarded_at: new Date(b.awardedAt).toISOString(),
  }));

  return {
    child: {
      uuid: activeChild.uuid,
      display_name: activeChild.displayName,
      avatar_id: activeChild.avatarId,
    },
    active_regions: activeRegions,
    badges,
    completed_level_codes: completedCodes,
  };
}

export async function getChildAdventureExperience(
  userId: number,
  candidateUuid: string | undefined,
  guestDeviceId?: string | (() => string)
) {
  const repos = useOwnerRepositories();
  const [child, activeKeys] = await Promise.all([
    resolveOwnedActiveChildProfile(userId, candidateUuid),
    resolveUserActiveEntitlements(userId),
  ]);

  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: String(child.id),
    },
    activeKeys
  );

  const resolvedGuestDeviceId =
    typeof guestDeviceId === "function" ? guestDeviceId() : guestDeviceId;

  const baseAdventure = await getDailyAdventure({
    userId,
    childId: child.id,
    childUuid: child.uuid,
    childDisplayName: child.displayName,
    allowedTiers: userAllowedTiers,
    guestDeviceId: resolvedGuestDeviceId,
  });

  const rawBand = deriveAgeBand(child.birthYear, new Date().getFullYear());
  const preferredBand: KogumaAgeBand = isKogumaAgeBand(rawBand)
    ? rawBand
    : "4-5";

  const skillsByCode = await repos.tagging.mapSkillCodesByLevelCodes(
    baseAdventure.steps.map((s) => s.level_code)
  );

  const enrichedSteps = baseAdventure.steps.map((step) => ({
    ...step,
    koguma_unit: resolveKogumaUnitSummaryForItem({
      skillCodes: skillsByCode.get(step.level_code),
      levelCode: step.level_code,
      preferredBand,
    }),
  }));

  const primaryStep =
    enrichedSteps.find((s) => s.kind === "play" && s.koguma_unit !== null) ??
    enrichedSteps.find((s) => s.koguma_unit !== null);
  const currentUnit = primaryStep?.koguma_unit ?? null;
  const matchedTheme = currentUnit
    ? getMoetThemeById(currentUnit.moet_theme_id)
    : undefined;

  return {
    ...baseAdventure,
    steps: enrichedSteps,
    current_koguma_unit: currentUnit,
    active_moet_theme: toPublicMoetTheme(
      matchedTheme ?? getMoetThemeForWeek(1, 36)
    ),
  };
}

function resolveThemeMapWeekMoetTheme(
  weekNo: number,
  totalWeeks: number,
  trackMoetThemes: readonly KogumaMoetThemePublic[]
): KogumaMoetThemePublic {
  const fromTrack = trackMoetThemes.find(
    (t) => weekNo >= t.week_start && weekNo <= t.week_end
  );
  if (fromTrack) {
    return fromTrack;
  }
  return toPublicMoetTheme(getMoetThemeForWeek(weekNo, totalWeeks));
}

export async function getChildThemeMapExperience(
  userId: number,
  candidateUuid: string | undefined
) {
  const repos = useOwnerRepositories();
  const child = await resolveOwnedActiveChildProfile(userId, candidateUuid);

  const baseMap = await getChildThemeMap({
    childId: child.id,
    childUuid: child.uuid,
    displayName: child.displayName,
    birthYear: child.birthYear,
  });

  const totalWeeks = baseMap.weeks.length > 0 ? baseMap.weeks.length : 36;
  const meta = parseKogumaProgramMeta(baseMap.roadmap_code, totalWeeks);
  const preferredBand: KogumaAgeBand = isKogumaAgeBand(baseMap.child.age_band)
    ? baseMap.child.age_band
    : (meta.age_band ?? "4-5");

  const allLessonCodes = baseMap.weeks.flatMap((w) =>
    w.lessons.map((l) => l.code)
  );
  const skillsByCode =
    await repos.tagging.mapSkillCodesByLevelCodes(allLessonCodes);

  let currentKogumaUnit: KogumaUnitSummary | null = null;
  const enrichedWeeks = baseMap.weeks.map((week) => {
    const moetTheme = resolveThemeMapWeekMoetTheme(
      week.week_no,
      totalWeeks,
      meta.moet_themes
    );

    const enrichedLessons = week.lessons.map((lesson) => {
      const kogumaUnit = resolveKogumaUnitSummaryForItem({
        skillCodes: skillsByCode.get(lesson.code),
        levelCode: lesson.code,
        preferredBand,
      });
      if (lesson.is_current && kogumaUnit) {
        currentKogumaUnit = kogumaUnit;
      }
      return {
        ...lesson,
        koguma_unit: kogumaUnit,
      };
    });

    return {
      ...week,
      moet_theme_id: moetTheme.id,
      moet_theme_title: moetTheme.title_vi,
      lessons: enrichedLessons,
    };
  });

  const activeMoetTheme = resolveThemeMapWeekMoetTheme(
    baseMap.current_week_no,
    totalWeeks,
    meta.moet_themes
  );

  return {
    ...baseMap,
    is_koguma: meta.is_koguma,
    koguma_track: meta.koguma_track,
    koguma_stage: meta.koguma_stage,
    koguma_variant: meta.koguma_variant,
    koguma_track_label_vi: meta.koguma_track_label_vi,
    moet_themes: meta.moet_themes,
    active_moet_theme: activeMoetTheme,
    current_koguma_unit: currentKogumaUnit,
    weeks: enrichedWeeks,
  };
}

export async function getChildCompetencyExplorerExperience(
  userId: number,
  candidateUuid: string | undefined,
  competencyCode: string
) {
  const [child, activeKeys] = await Promise.all([
    resolveOwnedActiveChildProfile(userId, candidateUuid),
    resolveUserActiveEntitlements(userId),
  ]);

  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: child.uuid,
    },
    activeKeys
  );

  const result = await getChildCompetencyGames({
    childId: child.id,
    childUuid: child.uuid,
    childDisplayName: child.displayName,
    birthYear: child.birthYear,
    competencyCode,
    allowedTiers: userAllowedTiers,
  });

  if (!result) {
    throw new NotFoundError("Không tìm thấy nhóm năng lực hợp lệ.");
  }

  return result;
}

export async function getChildPlayRecommendationsExperience(
  userId: number,
  candidateUuid: string | undefined,
  limit: number
) {
  const [activeChild, activeKeys] = await Promise.all([
    resolveOwnedActiveChildProfile(
      userId,
      candidateUuid,
      "Vui lòng chọn hồ sơ trẻ trước khi lấy gợi ý chơi."
    ),
    resolveUserActiveEntitlements(userId),
  ]);

  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: String(activeChild.id),
    },
    activeKeys
  );

  return await getRecommendationsForChild({
    childId: Number(activeChild.id),
    allowedTiers: userAllowedTiers,
    limit,
  });
}

export async function getChildStickerAlbumExperience(
  userId: number,
  candidateUuid: string | undefined,
  themeCode?: string
) {
  const child = await resolveOwnedActiveChildProfile(userId, candidateUuid);
  return await loadStickerAlbum({
    childId: child.id,
    themeCode,
  });
}

export async function getChildStickerDioramaExperience(
  userId: number,
  candidateUuid: string | undefined,
  themeCode?: string
) {
  const child = await resolveOwnedActiveChildProfile(userId, candidateUuid);
  return await getStickerDiorama({
    childId: child.id,
    themeCode,
  });
}

export async function saveChildStickerDioramaExperience(
  userId: number,
  candidateUuid: string | undefined,
  payload: StickerDioramaPutInput
) {
  const child = await resolveOwnedActiveChildProfile(userId, candidateUuid);
  return await saveStickerDiorama(child.id, {
    theme_code: payload.theme_code,
    placements: payload.placements.map((item) => ({
      emoji: item.emoji,
      instance_index: item.instance_index,
      norm_x: item.norm_x,
      norm_y: item.norm_y,
      scale: item.scale ?? 1,
    })),
  });
}

export async function getChildMascotGearExperience(
  userId: number,
  candidateUuid: string | undefined
) {
  const child = await resolveOwnedActiveChildProfile(userId, candidateUuid);
  return await getChildMascotGear(child.id);
}

export async function saveChildMascotGearExperience(
  userId: number,
  candidateUuid: string | undefined,
  input: MascotGearPutInput
) {
  const child = await resolveOwnedActiveChildProfile(userId, candidateUuid);
  return await updateChildMascotGear(child.id, input);
}

export async function getPersonalCurriculumDetailWithKoguma(
  context: PersonalCurriculumCallerContext,
  uuid: string
) {
  const curriculum = await getPersonalCurriculumByUuid(context, uuid);
  const meta = inferKogumaMetaFromTitleOrCode({
    title: curriculum.title,
    durationWeeks: curriculum.duration_weeks,
    ageMin: curriculum.age_min ?? null,
  });
  const preferredBand =
    meta.age_band ?? ageYearsToKogumaBand(curriculum.age_min ?? null);

  const levelIds = curriculum.items
    .filter((i) => i.entity_type === "game_level")
    .map((i) => i.entity_id);
  const ownerRepos = useOwnerRepositories();
  const skillsByLevel =
    await ownerRepos.tagging.mapSkillCodesByLevelIds(levelIds);

  const enrichedItems = curriculum.items.map((item) => ({
    ...item,
    koguma_unit: resolveKogumaUnitSummaryForItem({
      skillCodes: skillsByLevel.get(item.entity_id),
      levelCode: item.code ?? null,
      preferredBand,
    }),
  }));

  return {
    ...curriculum,
    is_koguma: meta.is_koguma,
    koguma_track: meta.koguma_track,
    koguma_stage: meta.koguma_stage,
    koguma_variant: meta.koguma_variant,
    koguma_track_label_vi: meta.koguma_track_label_vi,
    moet_themes: meta.moet_themes,
    items: enrichedItems,
  };
}

export async function copySystemCurriculumWithKoguma(
  context: PersonalCurriculumCallerContext,
  input: CopySystemCurriculumInput
) {
  const ownerRepos = useOwnerRepositories();
  let canonicalCode = input.system_curriculum_code;
  if (!canonicalCode.startsWith("CUR-")) {
    const direct = await ownerRepos.curricula.findByCode(canonicalCode);
    if (direct) {
      canonicalCode = direct.code;
    } else {
      const withPrefix = await ownerRepos.curricula.findByCode(
        `CUR-${canonicalCode}`
      );
      if (withPrefix) {
        canonicalCode = withPrefix.code;
      }
    }
  }

  const curriculum = await copySystemCurriculum(context, {
    ...input,
    system_curriculum_code: canonicalCode,
  });

  const meta = parseKogumaProgramMeta(canonicalCode, curriculum.duration_weeks);

  return {
    ...curriculum,
    roadmap_code: meta.roadmap_code,
    is_koguma: meta.is_koguma,
    koguma_track: meta.koguma_track,
    koguma_stage: meta.koguma_stage,
    koguma_variant: meta.koguma_variant,
    koguma_track_label_vi: meta.koguma_track_label_vi,
    moet_themes: meta.moet_themes,
  };
}
