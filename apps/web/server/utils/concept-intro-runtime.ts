import {
  ACCESS_TIER_CODEC,
  CONTENT_ENTITY_TYPE,
  type JsonRecord,
  type OwnerDb,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { ALL_TEMPLATES, getGameTemplate } from "@mindkid/game-engine/registry";
import {
  type AccessTier,
  allowedTiers,
  type CallerIdentity,
  type EntitlementKey,
  type IntroCheckResult,
  type IntroQueueItem,
} from "@mindkid/shared";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

/** `BR-CIG-16`: một lượt vào đòi tối đa một bài làm quen. */
export const MAX_INTROS_PER_ENTRY = 1;

interface TopologicalSkill {
  id: number;
  code: string;
  name: string;
  prerequisiteIds: number[];
}

interface IntroLevelRow {
  levelId: number;
  levelCode: string;
  title: string;
  thumbnailEmoji: string | null;
  skillId: number;
  skillCode: string;
  skillName: string;
}

export interface IntroLevelRef {
  readonly levelCode: string;
  readonly levelId: number;
}

export interface IntroCheckLevelSource {
  readonly id: number;
  readonly code: string;
  readonly templateCode: string;
}

export interface CheckLevelIntroOptions {
  guestDeviceId?: string;
  isManagerPreview?: boolean;
  resolvedChildId?: number | null;
  /** Entitlement đang hiệu lực của người gọi; vắng thì tự tra (`BR-CIG-19`). */
  activeKeys?: EntitlementKey[];
}

export interface ResolveIntroResumeParams {
  readonly levelId: number;
  readonly levelCode: string;
  readonly totalSegments: number;
  readonly childProfileId: number | null;
  readonly guestDeviceId?: string;
  readonly isPreview?: boolean;
}

function isIntroLevelRefList(
  value: OwnerDb | readonly IntroLevelRef[]
): value is readonly IntroLevelRef[] {
  return Array.isArray(value);
}

function topologicalSortSkills(
  skillList: TopologicalSkill[]
): TopologicalSkill[] {
  const result: TopologicalSkill[] = [];
  const visited = new Set<number>();
  const visiting = new Set<number>();
  const skillMap = new Map<number, TopologicalSkill>(
    skillList.map((s) => [s.id, s])
  );

  function visit(skill: TopologicalSkill): void {
    if (visited.has(skill.id) || visiting.has(skill.id)) {
      return;
    }

    visiting.add(skill.id);
    for (const prereqId of skill.prerequisiteIds) {
      const prereq = skillMap.get(prereqId);
      if (prereq) {
        visit(prereq);
      }
    }
    visiting.delete(skill.id);
    visited.add(skill.id);
    result.push(skill);
  }

  for (const skill of skillList) {
    if (!visited.has(skill.id)) {
      visit(skill);
    }
  }

  return result;
}

async function resolveCallerChildId(
  repos: MindKidRepositories,
  caller: CallerIdentity
): Promise<number | null> {
  if (caller.kind !== "user" || !caller.active_child_id) {
    return null;
  }
  const child = await repos.childProfiles.findByUuidForUser(
    caller.active_child_id,
    Number(caller.user_id)
  );
  return child?.id ?? null;
}

/**
 * Id các level làm quen (bản đang published) mà trẻ/khách đã hoàn thành.
 * Đối chiếu theo **mã level** theo `BR-CSA-17`.
 */
export async function findCompletedIntroLevelIds(
  levels: readonly IntroLevelRef[],
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<Set<number>>;
export async function findCompletedIntroLevelIds(
  db: OwnerDb,
  levels: readonly IntroLevelRef[],
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<Set<number>>;
export async function findCompletedIntroLevelIds(
  dbOrLevels: OwnerDb | readonly IntroLevelRef[],
  levelsOrChildId: readonly IntroLevelRef[] | number | null,
  childOrGuestId: number | null | string | undefined,
  maybeGuestId?: string
): Promise<Set<number>> {
  const isDbFirst = !isIntroLevelRefList(dbOrLevels);
  const repos = isDbFirst
    ? createRepositories(dbOrLevels)
    : useOwnerRepositories();
  const levels = isDbFirst
    ? (levelsOrChildId as readonly IntroLevelRef[])
    : dbOrLevels;
  const childProfileId = isDbFirst
    ? (childOrGuestId as number | null)
    : (levelsOrChildId as number | null);
  const guestDeviceId = isDbFirst
    ? maybeGuestId
    : (childOrGuestId as string | undefined);

  if (levels.length === 0) {
    return new Set();
  }

  const completedList = await repos.playSessions.listCompletedLevelCodes(
    childProfileId,
    guestDeviceId,
    levels.map((l) => l.levelCode)
  );
  const completedCodes = new Set(completedList);
  return new Set(
    levels.filter((l) => completedCodes.has(l.levelCode)).map((l) => l.levelId)
  );
}

export async function findCompletedLevelCodes(
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<string[]>;
export async function findCompletedLevelCodes(
  db: OwnerDb,
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<string[]>;
export async function findCompletedLevelCodes(
  dbOrChildId: OwnerDb | number | null,
  childOrGuestId?: number | null | string,
  maybeGuestId?: string
): Promise<string[]> {
  if (dbOrChildId === null || typeof dbOrChildId === "number") {
    const repos = useOwnerRepositories();
    return await repos.playSessions.listCompletedLevelCodes(
      dbOrChildId,
      typeof childOrGuestId === "string" ? childOrGuestId : undefined
    );
  }
  const repos = createRepositories(dbOrChildId);
  const childId = typeof childOrGuestId === "number" ? childOrGuestId : null;
  return await repos.playSessions.listCompletedLevelCodes(
    childId,
    maybeGuestId
  );
}

/**
 * `BR-CIG-19`: bậc mà người gọi mở được ở bước 4–5 của cùng thứ tự kiểm quyền.
 * Khách và người dùng chưa chọn hồ sơ trẻ chỉ vào được `free` (bậc khác trả
 * 403 `TIER_LOCKED` hoặc 428 `NO_ACTIVE_CHILD`).
 */
async function resolvePlayableIntroTiers(
  caller: CallerIdentity,
  activeKeys: EntitlementKey[] | undefined
): Promise<ReadonlySet<AccessTier>> {
  if (caller.kind === "manager") {
    return new Set(await allowedTiers(caller, activeKeys ?? []));
  }
  if (caller.kind !== "user" || !caller.active_child_id) {
    return new Set<AccessTier>(["free"]);
  }
  const userId = Number(caller.user_id);
  const keys =
    activeKeys ??
    (Number.isInteger(userId) && userId > 0
      ? await resolveUserActiveEntitlements(userId)
      : []);
  return new Set(await allowedTiers(caller, keys));
}

async function sortIntroLevelsTopologically(
  repos: MindKidRepositories,
  uncompletedLevels: IntroLevelRow[]
): Promise<IntroQueueItem[]> {
  const uncompletedSkillIds = Array.from(
    new Set(uncompletedLevels.map((l) => l.skillId))
  );

  const prereqRows =
    await repos.taxonomy.listPrerequisitesForSkillIds(uncompletedSkillIds);

  const prereqMap = new Map<number, number[]>();
  for (const row of prereqRows) {
    const list = prereqMap.get(row.skillId) ?? [];
    list.push(row.prerequisiteId);
    prereqMap.set(row.skillId, list);
  }

  const topoInput: TopologicalSkill[] = uncompletedSkillIds.map((id) => {
    const match = uncompletedLevels.find((l) => l.skillId === id);
    return {
      id,
      code: match?.skillCode ?? "",
      name: match?.skillName ?? "",
      prerequisiteIds: prereqMap.get(id) ?? [],
    };
  });

  const sortedSkills = topologicalSortSkills(topoInput);
  const fullQueue: IntroQueueItem[] = [];
  const addedLevelIds = new Set<number>();

  for (const skill of sortedSkills) {
    const levelsForSkill = uncompletedLevels.filter(
      (l) => l.skillId === skill.id
    );
    for (const lvl of levelsForSkill) {
      if (!addedLevelIds.has(lvl.levelId)) {
        addedLevelIds.add(lvl.levelId);
        fullQueue.push({
          intro_level_code: lvl.levelCode,
          skill_code: lvl.skillCode,
          title: lvl.title,
          thumbnail_emoji: lvl.thumbnailEmoji ?? undefined,
        });
      }
    }
  }

  return fullQueue;
}

export async function checkLevelIntroRequired(
  level: IntroCheckLevelSource,
  caller: CallerIdentity,
  optionsOrResolvedChildId: CheckLevelIntroOptions | number | null = {},
  resolvedChildIdArg?: number | null
): Promise<IntroCheckResult> {
  const options =
    typeof optionsOrResolvedChildId === "object" &&
    optionsOrResolvedChildId !== null
      ? optionsOrResolvedChildId
      : {};
  const explicitChildId =
    typeof optionsOrResolvedChildId === "number"
      ? optionsOrResolvedChildId
      : (options.resolvedChildId ?? resolvedChildIdArg);

  if (options.isManagerPreview) {
    return { intro_required: false };
  }

  const templateDef = getGameTemplate(level.templateCode);
  if (templateDef?.kind === "teach") {
    return { intro_required: false };
  }

  const repos = useOwnerRepositories();
  const skillMaps = await repos.tagging.listSkillMaps(
    CONTENT_ENTITY_TYPE.GAME_LEVEL,
    level.id
  );
  if (skillMaps.length === 0) {
    return { intro_required: false };
  }

  const initialSkillIds = skillMaps.map((m) => m.skillId);
  const skillMapById = await repos.taxonomy.mapSkillsByIds(initialSkillIds);
  const primarySkillCode =
    skillMapById.get(initialSkillIds[0] ?? -1)?.code ?? "";

  const transitiveSkillIds =
    await repos.taxonomy.collectTransitivePrerequisiteSkillIds(initialSkillIds);

  const teachTemplateCodes = Object.values(ALL_TEMPLATES)
    .filter((t) => t.kind === "teach")
    .map((t) => t.code as string);

  if (teachTemplateCodes.length === 0) {
    return { intro_required: false };
  }

  const rawIntroLevels = await repos.gameLevels.listByTeachTemplates(
    teachTemplateCodes,
    transitiveSkillIds
  );
  // BR-CIG-19: bài làm quen trẻ không mở được thì không đòi.
  const playableTiers = await resolvePlayableIntroTiers(
    caller,
    options.activeKeys
  );
  const playableIntroLevels = rawIntroLevels.filter((lvl) =>
    playableTiers.has(ACCESS_TIER_CODEC.toLabel(lvl.accessTier))
  );
  const introLevels: IntroLevelRow[] = playableIntroLevels.flatMap((lvl) =>
    lvl.skillMaps.map((sm) => ({
      levelId: lvl.id,
      levelCode: lvl.code,
      title: lvl.title,
      thumbnailEmoji: lvl.thumbnailEmoji,
      skillId: sm.skill.id,
      skillCode: sm.skill.code,
      skillName: sm.skill.name,
    }))
  );

  if (introLevels.length === 0) {
    return { intro_required: false };
  }

  const childProfileId =
    explicitChildId !== undefined && explicitChildId !== null
      ? explicitChildId
      : await resolveCallerChildId(repos, caller);
  const completedLevelIds = await findCompletedIntroLevelIds(
    introLevels,
    childProfileId,
    options.guestDeviceId
  );

  const uncompletedLevels = introLevels.filter(
    (l) => !completedLevelIds.has(l.levelId)
  );

  if (uncompletedLevels.length === 0) {
    return { intro_required: false };
  }

  // BR-CIG-16: đã đi hết một bài làm quen kể từ phiên gần nhất của level này
  // → lượt vào này đã trả bài, mở.
  const [lastIntroCompletedId, lastEntryId] = await Promise.all([
    repos.playSessions.findLatestSessionIdForLevelCodes(
      childProfileId,
      options.guestDeviceId,
      playableIntroLevels.map((l) => l.code),
      { completedOnly: true }
    ),
    repos.playSessions.findLatestSessionIdForLevelCodes(
      childProfileId,
      options.guestDeviceId,
      [level.code]
    ),
  ]);
  if (
    lastIntroCompletedId !== null &&
    (lastEntryId === null || lastIntroCompletedId > lastEntryId)
  ) {
    return { intro_required: false };
  }

  const fullQueue = await sortIntroLevelsTopologically(
    repos,
    uncompletedLevels
  );
  const introQueue = fullQueue.slice(0, MAX_INTROS_PER_ENTRY);
  const introRemaining = fullQueue.length - introQueue.length;

  return {
    intro_required: true,
    intro_queue: introQueue,
    intro_remaining: introRemaining,
    return_level_code: level.code,
    primary_skill_code: primarySkillCode,
    intro_level_code: introQueue[0]?.intro_level_code,
  };
}

function readSegmentIndexFromPayload(
  payload: JsonRecord | object | null
): number | null {
  if (!(payload && "segment_index" in payload)) {
    return null;
  }
  const val = Reflect.get(payload, "segment_index");
  return typeof val === "number" && Number.isInteger(val) && val >= 0
    ? val
    : null;
}

export function computeIntroResumeSegmentIndex(params: {
  readonly eventPayloads: readonly (JsonRecord | object | null)[];
  readonly totalSegments: number;
  readonly isCompleted: boolean;
  readonly isPreview?: boolean;
}): number {
  if (params.isPreview || params.isCompleted || params.totalSegments <= 1) {
    return 0;
  }
  let maxCompletedIndex = -1;
  for (const payload of params.eventPayloads) {
    const idx = readSegmentIndexFromPayload(payload);
    if (idx !== null && idx > maxCompletedIndex) {
      maxCompletedIndex = idx;
    }
  }
  if (maxCompletedIndex < 0) {
    return 0;
  }
  const nextIndex = maxCompletedIndex + 1;
  return nextIndex < params.totalSegments ? nextIndex : 0;
}

/**
 * `BR-CIR-18`: tìm chỉ số phân đoạn tiếp theo khi trẻ/khách mở lại một bài làm
 * quen đang dang dở (`in_progress` hoặc `abandoned`).
 */
export async function resolveIntroResumeSegmentIndex(
  params: ResolveIntroResumeParams
): Promise<number>;
export async function resolveIntroResumeSegmentIndex(
  db: OwnerDb,
  params: ResolveIntroResumeParams
): Promise<number>;
export async function resolveIntroResumeSegmentIndex(
  dbOrParams: OwnerDb | ResolveIntroResumeParams,
  maybeParams?: ResolveIntroResumeParams
): Promise<number> {
  const params = maybeParams ?? (dbOrParams as ResolveIntroResumeParams);
  const repos = maybeParams
    ? createRepositories(dbOrParams as OwnerDb)
    : useOwnerRepositories();

  if (params.isPreview || params.totalSegments <= 1) {
    return 0;
  }
  if (params.childProfileId === null && !params.guestDeviceId) {
    return 0;
  }

  const completedIds = await findCompletedIntroLevelIds(
    [{ levelId: params.levelId, levelCode: params.levelCode }],
    params.childProfileId,
    params.guestDeviceId
  );
  if (completedIds.has(params.levelId)) {
    return 0;
  }

  const eventRows = await repos.telemetry.listIntroSegmentEvents(
    params.levelCode,
    params.childProfileId,
    params.guestDeviceId
  );

  return computeIntroResumeSegmentIndex({
    eventPayloads: eventRows.map((row) => row.payload),
    totalSegments: params.totalSegments,
    isCompleted: false,
    isPreview: params.isPreview,
  });
}
