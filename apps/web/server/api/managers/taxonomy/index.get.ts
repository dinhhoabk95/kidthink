import {
  competencies,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  learningObjectives,
  skills,
  strands,
} from "@mindkid/db";
import type { SkillProgressionTier } from "@mindkid/shared";
import { sql } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export const TAXONOMY_SUFFICIENT_THRESHOLD = 3;

export interface TaxonomySkillSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  strand_id: number;
  age_min: number;
  age_max: number;
  difficulty: number;
  thinking_processes: string[];
  what_axis: string[];
  tier: SkillProgressionTier;
  is_deprecated: boolean;
  published_count: number;
  draft_count: number;
  total_count: number;
  lo_count: number;
  gap_status: "empty" | "thin" | "sufficient";
  is_gap: boolean;
}

export interface TaxonomyStrandSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  competency_id: number;
  parent_strand_id: number | null;
  total_skills: number;
  published_count: number;
  draft_count: number;
  gap_skills_count: number;
}

export interface TaxonomyCompetencySummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  color_token: string;
  icon: string;
  total_strands: number;
  total_skills: number;
  published_count: number;
  draft_count: number;
  gap_skills_count: number;
}

interface CachedTaxonomyData {
  timestamp: number;
  data: {
    as_of: string;
    threshold_sufficient: number;
    competencies: TaxonomyCompetencySummary[];
    strands: TaxonomyStrandSummary[];
    skills: TaxonomySkillSummary[];
    summary: {
      total_skills: number;
      total_published_levels: number;
      total_draft_levels: number;
      total_gaps: number;
    };
  };
}

let taxonomyCache: CachedTaxonomyData | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (BR-TXB-06)

export function invalidateTaxonomyManagerCache(): void {
  taxonomyCache = null;
}

async function fetchRawTaxonomyHierarchy() {
  const db = getOwnerDb();
  const dbCompetencies = await db
    .select()
    .from(competencies)
    .orderBy(competencies.position);
  const dbStrands = await db.select().from(strands).orderBy(strands.position);
  const dbSkills = await db.select().from(skills).orderBy(skills.position);
  const dbLos = await db
    .select()
    .from(learningObjectives)
    .orderBy(learningObjectives.position);
  return { dbCompetencies, dbStrands, dbSkills, dbLos };
}

async function fetchLevelCountsMap() {
  const db = getOwnerDb();
  const levelMappings = await db
    .select({
      skillId: contentSkillMap.skillId,
      status: gameLevels.status,
      count: sql<number>`count(distinct ${gameLevels.id})::int`,
    })
    .from(contentSkillMap)
    .innerJoin(
      gameLevels,
      sql`(${contentSkillMap.entityType} = 'game_level') AND (${contentSkillMap.entityId} = ${gameLevels.id} OR ${contentSkillMap.entityId} = ${gameLevels.entityId})`
    )
    .groupBy(contentSkillMap.skillId, gameLevels.status);

  const skillCountsMap = new Map<
    number,
    { published: number; draft: number; total: number }
  >();
  for (const m of levelMappings) {
    const current = skillCountsMap.get(m.skillId) || {
      published: 0,
      draft: 0,
      total: 0,
    };
    if (m.status === "published") {
      current.published += Number(m.count);
    } else if (m.status === "draft") {
      current.draft += Number(m.count);
    }
    current.total += Number(m.count);
    skillCountsMap.set(m.skillId, current);
  }
  return skillCountsMap;
}

function computeEnhancedTaxonomy(
  rawHierarchy: Awaited<ReturnType<typeof fetchRawTaxonomyHierarchy>>,
  skillCountsMap: Map<
    number,
    { published: number; draft: number; total: number }
  >
) {
  const { dbCompetencies, dbStrands, dbSkills, dbLos } = rawHierarchy;

  const losBySkill = new Map<number, typeof dbLos>();
  for (const lo of dbLos) {
    const list = losBySkill.get(lo.skillId) || [];
    list.push(lo);
    losBySkill.set(lo.skillId, list);
  }

  let totalPublished = 0;
  let totalDraft = 0;
  let totalGaps = 0;

  const enhancedSkills: TaxonomySkillSummary[] = dbSkills.map((s) => {
    const counts = skillCountsMap.get(s.id) || {
      published: 0,
      draft: 0,
      total: 0,
    };
    const skillLos = losBySkill.get(s.id) || [];

    let gapStatus: "empty" | "thin" | "sufficient" = "empty";
    if (counts.published >= TAXONOMY_SUFFICIENT_THRESHOLD) {
      gapStatus = "sufficient";
    } else if (counts.published > 0) {
      gapStatus = "thin";
    } else {
      gapStatus = "empty";
      totalGaps++;
    }

    totalPublished += counts.published;
    totalDraft += counts.draft;

    return {
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      strand_id: s.strandId,
      age_min: s.ageMin,
      age_max: s.ageMax,
      difficulty: s.difficulty,
      thinking_processes: s.thinkingProcesses || [],
      what_axis: s.whatAxis || [],
      tier: s.tier,
      is_deprecated: false,
      published_count: counts.published,
      draft_count: counts.draft,
      total_count: counts.total,
      lo_count: skillLos.length,
      gap_status: gapStatus,
      is_gap: gapStatus === "empty",
    };
  });

  const enhancedStrands: TaxonomyStrandSummary[] = dbStrands.map((st) => {
    const strandSkills = enhancedSkills.filter((s) => s.strand_id === st.id);
    return {
      id: st.id,
      code: st.code,
      name: st.name,
      description: st.description,
      competency_id: st.competencyId,
      parent_strand_id: st.parentStrandId,
      total_skills: strandSkills.length,
      published_count: strandSkills.reduce(
        (acc, s) => acc + s.published_count,
        0
      ),
      draft_count: strandSkills.reduce((acc, s) => acc + s.draft_count, 0),
      gap_skills_count: strandSkills.filter((s) => s.is_gap).length,
    };
  });

  const enhancedCompetencies: TaxonomyCompetencySummary[] = dbCompetencies.map(
    (comp) => {
      const compStrands = enhancedStrands.filter(
        (st) => st.competency_id === comp.id
      );
      const compStrandIds = new Set(compStrands.map((st) => st.id));
      const compSkills = enhancedSkills.filter((s) =>
        compStrandIds.has(s.strand_id)
      );

      return {
        id: comp.id,
        code: comp.code,
        name: comp.name,
        description: comp.description,
        color_token: comp.colorToken,
        icon: comp.icon,
        total_strands: compStrands.length,
        total_skills: compSkills.length,
        published_count: compSkills.reduce(
          (acc, s) => acc + s.published_count,
          0
        ),
        draft_count: compSkills.reduce((acc, s) => acc + s.draft_count, 0),
        gap_skills_count: compSkills.filter((s) => s.is_gap).length,
      };
    }
  );

  return {
    competencies: enhancedCompetencies,
    strands: enhancedStrands,
    skills: enhancedSkills,
    summary: {
      total_skills: enhancedSkills.length,
      total_published_levels: totalPublished,
      total_draft_levels: totalDraft,
      total_gaps: totalGaps,
    },
  };
}

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const query = getQuery(event);
  const gapsOnly = query.gaps_only === "true" || query.gaps_only === true;
  const depth = (query.depth as string) || "skill";

  const now = Date.now();
  let baseData: CachedTaxonomyData["data"];

  if (taxonomyCache && now - taxonomyCache.timestamp < CACHE_TTL_MS) {
    baseData = taxonomyCache.data;
  } else {
    const rawHierarchy = await fetchRawTaxonomyHierarchy();
    const skillCountsMap = await fetchLevelCountsMap();
    const enhanced = computeEnhancedTaxonomy(rawHierarchy, skillCountsMap);

    baseData = {
      as_of: new Date(now).toISOString(),
      threshold_sufficient: TAXONOMY_SUFFICIENT_THRESHOLD,
      ...enhanced,
    };

    taxonomyCache = { timestamp: now, data: baseData };
  }

  const returnSkills = gapsOnly
    ? baseData.skills.filter((s) => s.is_gap)
    : baseData.skills;

  if (depth === "competency") {
    return {
      as_of: baseData.as_of,
      threshold_sufficient: baseData.threshold_sufficient,
      competencies: baseData.competencies,
      summary: baseData.summary,
    };
  }

  if (depth === "strand") {
    return {
      as_of: baseData.as_of,
      threshold_sufficient: baseData.threshold_sufficient,
      competencies: baseData.competencies,
      strands: baseData.strands,
      summary: baseData.summary,
    };
  }

  return {
    as_of: baseData.as_of,
    threshold_sufficient: baseData.threshold_sufficient,
    competencies: baseData.competencies,
    strands: baseData.strands,
    skills: returnSkills,
    summary: baseData.summary,
  };
});
