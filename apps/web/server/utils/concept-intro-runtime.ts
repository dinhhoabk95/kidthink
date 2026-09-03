import {
  childProfiles,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  playSessions,
  skillPrerequisites,
  skills,
} from "@mindkid/db";
import { ALL_TEMPLATES, getGameTemplate } from "@mindkid/game-engine";
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
  const queueToExpand = [...initialSkillIds];

  while (queueToExpand.length > 0) {
    const currentId = queueToExpand.pop();
    if (!currentId) {
      continue;
    }

    const prereqs = await db
      .select({ prereqId: skillPrerequisites.prerequisiteId })
      .from(skillPrerequisites)
      .where(eq(skillPrerequisites.skillId, currentId));

    for (const row of prereqs) {
      if (!allSkillIds.has(row.prereqId)) {
        allSkillIds.add(row.prereqId);
        queueToExpand.push(row.prereqId);
      }
    }
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

async function findCompletedLevelIds(
  db: ReturnType<typeof getOwnerDb>,
  levelIds: number[],
  childProfileId: number | null,
  guestDeviceId?: string
): Promise<Set<number>> {
  if (levelIds.length === 0) {
    return new Set();
  }

  const conditions = [
    inArray(playSessions.gameLevelId, levelIds),
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
    .select({ gameLevelId: playSessions.gameLevelId })
    .from(playSessions)
    .where(and(...conditions));

  return new Set(completedSessions.map((s) => s.gameLevelId));
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
  options: {
    guestDeviceId?: string;
    lessonRunId?: string | null;
    isManagerPreview?: boolean;
  } = {}
): Promise<IntroCheckResult> {
  if (options.isManagerPreview || options.lessonRunId) {
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
        eq(gameLevels.status, "published"),
        inArray(contentSkillMap.skillId, transitiveSkillIds)
      )
    );

  if (introLevels.length === 0) {
    return { intro_required: false };
  }

  const childProfileId = await resolveCallerChildId(db, caller);
  const completedLevelIds = await findCompletedLevelIds(
    db,
    introLevels.map((l) => l.levelId),
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
