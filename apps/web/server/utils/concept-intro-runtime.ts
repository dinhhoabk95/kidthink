import {
  childProfiles,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  playSessions,
  skillPrerequisites,
  skills,
  telemetryEvents,
} from "@mindkid/db";
import { ALL_TEMPLATES, getGameTemplate } from "@mindkid/game-engine/registry";
import type {
  CallerIdentity,
  IntroCheckResult,
  IntroQueueItem,
} from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";

interface TopologicalSkill {
  id: number;
  code: string;
  name: string;
  prerequisiteIds: number[];
}

interface MappedSkillRow {
  skillId: number;
  skillCode: string;
  skillName: string;
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
    if (visited.has(skill.id)) {
      return;
    }
    if (visiting.has(skill.id)) {
      // Chu trình taxonomy: bỏ qua cạnh gây chu trình theo BR-CIG-15
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

async function collectTransitivePrerequisiteSkillIds(
  db: ReturnType<typeof getOwnerDb>,
  initialSkillIds: number[]
): Promise<number[]> {
  const allSkillIds = new Set<number>(initialSkillIds);
  let frontier = [...initialSkillIds];

  while (frontier.length > 0) {
    const prereqs = await db
      .select({ prereqId: skillPrerequisites.prerequisiteId })
      .from(skillPrerequisites)
      .where(inArray(skillPrerequisites.skillId, frontier));

    const nextFrontier: number[] = [];
    for (const row of prereqs) {
      if (!allSkillIds.has(row.prereqId)) {
        allSkillIds.add(row.prereqId);
        nextFrontier.push(row.prereqId);
      }
    }
    frontier = nextFrontier;
  }

  return Array.from(allSkillIds);
}

async function resolveCallerChildId(
  db: ReturnType<typeof getOwnerDb>,
  caller: CallerIdentity
): Promise<number | null> {
  if (caller.kind !== "user" || !caller.active_child_id) {
    return null;
  }
  const [child] = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, caller.active_child_id),
        eq(childProfiles.userId, Number(caller.user_id))
      )
    )
    .limit(1);

  return child?.id ?? null;
}

export interface IntroLevelRef {
  readonly levelCode: string;
  readonly levelId: number;
}

/**
 * Id các level làm quen (bản đang published) mà trẻ/khách đã hoàn thành.
 * Đối chiếu theo **mã level**: khi cả danh mục lên bản content mới (`BR-CSA-17`)
 * bản cũ bị archive và `game_levels.id` đổi, nhưng bài đã làm vẫn phải tính.
 */
export async function findCompletedIntroLevelIds(
  db: ReturnType<typeof getOwnerDb>,
  levels: readonly IntroLevelRef[],
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<Set<number>> {
  if (levels.length === 0) {
    return new Set();
  }

  const conditions = [
    inArray(
      gameLevels.code,
      levels.map((l) => l.levelCode)
    ),
    eq(playSessions.completionStatus, "completed"),
    eq(playSessions.isPreview, false),
  ];

  if (childProfileId !== null) {
    conditions.push(eq(playSessions.childProfileId, childProfileId));
  } else if (guestDeviceId) {
    conditions.push(eq(playSessions.guestDeviceId, guestDeviceId));
  } else {
    return new Set();
  }

  const completedSessions = await db
    .selectDistinct({ code: gameLevels.code })
    .from(playSessions)
    .innerJoin(gameLevels, eq(gameLevels.id, playSessions.gameLevelId))
    .where(and(...conditions));

  const completedCodes = new Set(completedSessions.map((s) => s.code));
  return new Set(
    levels.filter((l) => completedCodes.has(l.levelCode)).map((l) => l.levelId)
  );
}

export async function findCompletedLevelCodes(
  db: ReturnType<typeof getOwnerDb>,
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<string[]> {
  const conditions = [
    eq(playSessions.completionStatus, "completed"),
    eq(playSessions.isPreview, false),
  ];

  if (childProfileId !== null) {
    conditions.push(eq(playSessions.childProfileId, childProfileId));
  } else if (guestDeviceId) {
    conditions.push(eq(playSessions.guestDeviceId, guestDeviceId));
  } else {
    return [];
  }

  const rows = await db
    .selectDistinct({ code: gameLevels.code })
    .from(playSessions)
    .innerJoin(gameLevels, eq(gameLevels.id, playSessions.gameLevelId))
    .where(and(...conditions));

  return rows.map((r) => r.code);
}

async function sortIntroLevelsTopologically(
  db: ReturnType<typeof getOwnerDb>,
  uncompletedLevels: IntroLevelRow[]
): Promise<IntroQueueItem[]> {
  const uncompletedSkillIds = Array.from(
    new Set(uncompletedLevels.map((l) => l.skillId))
  );

  const prereqRows = await db
    .select({
      skillId: skillPrerequisites.skillId,
      prerequisiteId: skillPrerequisites.prerequisiteId,
    })
    .from(skillPrerequisites)
    .where(inArray(skillPrerequisites.skillId, uncompletedSkillIds));

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
  level: typeof gameLevels.$inferSelect,
  caller: CallerIdentity,
  optionsOrResolvedChildId:
    | {
        guestDeviceId?: string;
        isManagerPreview?: boolean;
        resolvedChildId?: number | null;
      }
    | number
    | null = {},
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

  const db = getOwnerDb();

  const templateDef = getGameTemplate(level.templateCode);
  if (templateDef?.kind === "teach") {
    return { intro_required: false };
  }

  const mappedSkills: MappedSkillRow[] = await db
    .select({
      skillId: contentSkillMap.skillId,
      skillCode: skills.code,
      skillName: skills.name,
    })
    .from(contentSkillMap)
    .innerJoin(skills, eq(contentSkillMap.skillId, skills.id))
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, level.id)
      )
    );

  if (mappedSkills.length === 0) {
    return { intro_required: false };
  }

  const primarySkillCode = mappedSkills[0]?.skillCode ?? "";
  const initialSkillIds = mappedSkills.map((s) => s.skillId);
  const transitiveSkillIds = await collectTransitivePrerequisiteSkillIds(
    db,
    initialSkillIds
  );

  const teachTemplateCodes = Object.values(ALL_TEMPLATES)
    .filter((t) => t.kind === "teach")
    .map((t) => t.code as string);

  if (teachTemplateCodes.length === 0) {
    return { intro_required: false };
  }

  const introLevels: IntroLevelRow[] = await db
    .select({
      levelId: gameLevels.id,
      levelCode: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      skillId: contentSkillMap.skillId,
      skillCode: skills.code,
      skillName: skills.name,
    })
    .from(gameLevels)
    .innerJoin(
      contentSkillMap,
      and(
        eq(contentSkillMap.entityId, gameLevels.id),
        eq(contentSkillMap.entityType, "game_level")
      )
    )
    .innerJoin(skills, eq(contentSkillMap.skillId, skills.id))
    .where(
      and(
        inArray(gameLevels.templateCode, teachTemplateCodes),
        inArray(contentSkillMap.skillId, transitiveSkillIds)
      )
    );

  if (introLevels.length === 0) {
    return { intro_required: false };
  }

  const childProfileId =
    explicitChildId !== undefined && explicitChildId !== null
      ? explicitChildId
      : await resolveCallerChildId(db, caller);
  const completedLevelIds = await findCompletedIntroLevelIds(
    db,
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

  const fullQueue = await sortIntroLevelsTopologically(db, uncompletedLevels);
  const introQueue = fullQueue.slice(0, 2);
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

export interface ResolveIntroResumeParams {
  readonly levelId: number;
  readonly levelCode: string;
  readonly totalSegments: number;
  readonly childProfileId: number | null;
  readonly guestDeviceId?: string;
  readonly isPreview?: boolean;
}

function readSegmentIndexFromPayload(payload: object | null): number | null {
  if (!(payload && "segment_index" in payload)) {
    return null;
  }
  const val = Reflect.get(payload, "segment_index");
  return typeof val === "number" && Number.isInteger(val) && val >= 0
    ? val
    : null;
}

export function computeIntroResumeSegmentIndex(params: {
  readonly eventPayloads: readonly (object | null)[];
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
 * quen đang dang dở (`in_progress` hoặc `abandoned`). Nếu bài đã từng
 * `completed`, chưa có sự kiện `intro_segment_completed`, hoặc vượt tổng số
 * phân đoạn thì trả `0` (chạy từ đầu).
 */
export async function resolveIntroResumeSegmentIndex(
  db: ReturnType<typeof getOwnerDb>,
  params: ResolveIntroResumeParams
): Promise<number> {
  if (params.isPreview || params.totalSegments <= 1) {
    return 0;
  }
  if (params.childProfileId === null && !params.guestDeviceId) {
    return 0;
  }

  const completedIds = await findCompletedIntroLevelIds(
    db,
    [{ levelId: params.levelId, levelCode: params.levelCode }],
    params.childProfileId,
    params.guestDeviceId
  );
  if (completedIds.has(params.levelId)) {
    return 0;
  }

  const ownerCond =
    params.childProfileId === null
      ? eq(playSessions.guestDeviceId, params.guestDeviceId ?? "")
      : eq(playSessions.childProfileId, params.childProfileId);

  const eventRows = await db
    .select({ payload: telemetryEvents.payload })
    .from(telemetryEvents)
    .innerJoin(
      playSessions,
      eq(playSessions.sessionUuid, telemetryEvents.sessionUuid)
    )
    .innerJoin(gameLevels, eq(gameLevels.id, playSessions.gameLevelId))
    .where(
      and(
        eq(gameLevels.code, params.levelCode),
        eq(playSessions.isPreview, false),
        inArray(playSessions.completionStatus, ["in_progress", "abandoned"]),
        ownerCond,
        eq(telemetryEvents.eventName, "intro_segment_completed")
      )
    );

  return computeIntroResumeSegmentIndex({
    eventPayloads: eventRows.map((row) =>
      typeof row.payload === "object" ? row.payload : null
    ),
    totalSegments: params.totalSegments,
    isCompleted: false,
    isPreview: params.isPreview,
  });
}
