import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  getOwnerDb,
} from "@mindkid/db";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  COMPETENCY_LABELS,
  type ProgramCompetencyShare,
  type RawCurriculumItemRecord,
  toProgramDetailPublic,
} from "@mindkid/shared";
import { asc, eq, inArray } from "drizzle-orm";
import { defineEventHandler, getRouterParam, setHeader } from "h3";

const CURRICULUM_CODE_REGEX = /^CUR-[A-Za-z0-9_-]+$/;
const COMPETENCY_REGEX = /^(?:GL-)?(C[1-6])/i;
const ALL_COMPETENCIES = ["C1", "C2", "C3", "C4", "C5", "C6"];

interface GameLevelMapEntry {
  code: string;
  title: string;
  accessTier: AccessTier;
}

async function loadGameLevelsMap(
  db: ReturnType<typeof getOwnerDb>,
  entityIds: number[]
): Promise<Map<number, GameLevelMapEntry>> {
  const map = new Map<number, GameLevelMapEntry>();
  if (entityIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      title: gameLevels.title,
      accessTier: gameLevels.accessTier,
    })
    .from(gameLevels)
    .where(inArray(gameLevels.id, entityIds));

  for (const row of rows) {
    const entry: GameLevelMapEntry = {
      code: row.code,
      title: row.title,
      accessTier: row.accessTier as AccessTier,
    };
    map.set(row.id, entry);
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
  gameLevelsMap: Map<
    number,
    { code: string; title: string; accessTier: AccessTier }
  >
): RawCurriculumItemRecord {
  const gl = gameLevelsMap.get(item.entityId);
  return {
    weekNo: item.weekNo,
    sessionNo: item.sessionNo,
    position: item.position,
    entityType: "game_level",
    code: gl?.code || "",
    title: gl?.title || "",
    estimatedMinutes: 10,
    accessTier: gl?.accessTier || defaultTier,
  };
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!(code && CURRICULUM_CODE_REGEX.test(code))) {
    throw new CurriculumNotFoundError(code);
  }

  setHeader(event, "Cache-Control", "public, max-age=600");

  const db = getOwnerDb();

  const [curriculum] = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      title: curricula.title,
      description: curricula.description,
      programType: curricula.programType,
      targetAgeMin: curricula.targetAgeMin,
      targetAgeMax: curricula.targetAgeMax,
      durationWeeks: curricula.durationWeeks,
      sessionsPerWeek: curricula.sessionsPerWeek,
      accessTier: curricula.accessTier,
    })
    .from(curricula)
    .where(eq(curricula.code, code));

  if (!curriculum) {
    throw new CurriculumNotFoundError(code);
  }

  const rawWeeks = await db
    .select({
      weekNo: curriculumWeeks.weekNo,
      goal: curriculumWeeks.goal,
    })
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, curriculum.id))
    .orderBy(asc(curriculumWeeks.weekNo));

  const rawItems = await db
    .select({
      id: curriculumItems.id,
      weekNo: curriculumItems.weekNo,
      sessionNo: curriculumItems.sessionNo,
      position: curriculumItems.position,
      entityType: curriculumItems.entityType,
      entityId: curriculumItems.entityId,
    })
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, curriculum.id))
    .orderBy(
      asc(curriculumItems.weekNo),
      asc(curriculumItems.sessionNo),
      asc(curriculumItems.position)
    );

  const gameLevelIds = rawItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  const gameLevelsMap = await loadGameLevelsMap(db, gameLevelIds);

  const defaultTier = curriculum.accessTier as AccessTier;
  const competencyCounts = new Map<string, number>();
  let totalCountedItems = 0;

  const resolvedItems: RawCurriculumItemRecord[] = rawItems.map((item) => {
    const resolved = resolveSingleItem(item, defaultTier, gameLevelsMap);
    if (resolved.code) {
      const match = resolved.code.match(COMPETENCY_REGEX);
      const matchedComp = match?.[1];
      if (matchedComp) {
        const comp = matchedComp.toUpperCase();
        competencyCounts.set(comp, (competencyCounts.get(comp) || 0) + 1);
        totalCountedItems++;
      }
    }
    return resolved;
  });

  const competencyDistribution: ProgramCompetencyShare[] = [];
  for (const comp of ALL_COMPETENCIES) {
    const count = competencyCounts.get(comp) || 0;
    const share = totalCountedItems > 0 ? count / totalCountedItems : 0;
    competencyDistribution.push({
      code: comp,
      label: COMPETENCY_LABELS[comp] || comp,
      share: Number(share.toFixed(3)),
    });
  }

  return toProgramDetailPublic({
    curriculum,
    weeks: rawWeeks,
    items: resolvedItems,
    competencyDistribution,
  });
});
