import { deleteCached, getCached, setCached } from "@mindkid/cache";
import { ACCESS_TIER_CODEC, SKILL_TIER_CODEC } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import {
  InvalidCodeFormatError,
  SkillNotFoundError,
} from "@mindkid/errors/content";
import type { SkillProgressionTier } from "@mindkid/shared";
import { COMPETENCIES } from "@mindkid/taxonomy";
import {
  GUEST_SEO_TTL,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";
import { useOwnerRepositories } from "#server/utils/repositories";

const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;
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

interface ManagerTaxonomyPayload {
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
}

let taxonomyCache: { timestamp: number; data: ManagerTaxonomyPayload } | null =
  null;
const CACHE_TTL_MS = 5 * 60 * 1000;
const TAXONOMY_MANAGER_CACHE_KEY = "taxonomy:manager:summary:v1";

export function invalidateTaxonomyManagerCache(): void {
  taxonomyCache = null;
  deleteCached(TAXONOMY_MANAGER_CACHE_KEY).catch(() => null);
}

export async function getPublicTaxonomyTree(depth: string) {
  if (depth === "competency") {
    return { competencies: COMPETENCIES };
  }

  return await withGuestSeoCache({
    namespace: "taxonomy",
    key: `depth:${depth}`,
    ttlSeconds: GUEST_SEO_TTL.LONG,
    fetcher: async () => {
      const { taxonomy } = useOwnerRepositories();
      const dbStrands = await taxonomy.listStrands();

      if (depth === "strand") {
        return {
          competencies: COMPETENCIES,
          strands: dbStrands,
        };
      }

      const dbSkills = await taxonomy.listSkills();

      return {
        competencies: COMPETENCIES,
        strands: dbStrands,
        skills: dbSkills,
      };
    },
  });
}

export async function getPublicTaxonomySkillDetail(code: string) {
  if (!SKILL_CODE_REGEX.test(code)) {
    throw new InvalidCodeFormatError();
  }

  return await withGuestSeoCache({
    namespace: "taxonomy-skill",
    key: code,
    ttlSeconds: GUEST_SEO_TTL.LONG,
    fetcher: async () => {
      const { taxonomy } = useOwnerRepositories();
      const targetSkill = await taxonomy.findSkillByCode(code);
      if (!targetSkill) {
        throw new SkillNotFoundError(code);
      }

      const loRows = await taxonomy.listLearningObjectivesBySkillId(
        targetSkill.id
      );

      return {
        skill: targetSkill,
        learningObjectives: loRows,
        publishedAssetCount: 0,
      };
    },
  });
}

async function buildManagerTaxonomyPayload(
  now: number
): Promise<ManagerTaxonomyPayload> {
  const { taxonomy, tagging } = useOwnerRepositories();
  const [
    dbCompetencies,
    dbStrands,
    dbSkills,
    loCountBySkill,
    levelCountBySkill,
  ] = await Promise.all([
    taxonomy.listCompetencies(),
    taxonomy.listStrands(),
    taxonomy.listSkills(),
    taxonomy.countLearningObjectivesBySkill(),
    tagging.countDistinctGameLevelsBySkill(),
  ]);

  let totalPublished = 0;
  let totalGaps = 0;

  const enhancedSkills: TaxonomySkillSummary[] = dbSkills.map((s) => {
    const published = levelCountBySkill.get(s.id) ?? 0;
    let gapStatus: "empty" | "thin" | "sufficient" = "empty";
    if (published >= TAXONOMY_SUFFICIENT_THRESHOLD) {
      gapStatus = "sufficient";
    } else if (published > 0) {
      gapStatus = "thin";
    } else {
      gapStatus = "empty";
      totalGaps++;
    }
    totalPublished += published;

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
      tier: SKILL_TIER_CODEC.toLabel(s.tier),
      is_deprecated: false,
      published_count: published,
      draft_count: 0,
      total_count: published,
      lo_count: loCountBySkill.get(s.id) ?? 0,
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
    as_of: new Date(now).toISOString(),
    threshold_sufficient: TAXONOMY_SUFFICIENT_THRESHOLD,
    competencies: enhancedCompetencies,
    strands: enhancedStrands,
    skills: enhancedSkills,
    summary: {
      total_skills: enhancedSkills.length,
      total_published_levels: totalPublished,
      total_draft_levels: 0,
      total_gaps: totalGaps,
    },
  };
}

export async function getManagerTaxonomySummary(options: {
  gapsOnly: boolean;
  depth: string;
}) {
  const now = Date.now();
  let baseData: ManagerTaxonomyPayload;

  if (taxonomyCache && now - taxonomyCache.timestamp < CACHE_TTL_MS) {
    baseData = taxonomyCache.data;
  } else {
    const valkeyCached = await getCached<ManagerTaxonomyPayload>(
      TAXONOMY_MANAGER_CACHE_KEY
    ).catch(() => null);
    if (valkeyCached) {
      baseData = valkeyCached;
      taxonomyCache = { timestamp: now, data: baseData };
    } else {
      baseData = await buildManagerTaxonomyPayload(now);
      taxonomyCache = { timestamp: now, data: baseData };
      await setCached(TAXONOMY_MANAGER_CACHE_KEY, baseData, 300).catch(
        () => null
      );
    }
  }

  if (options.depth === "competency") {
    return {
      as_of: baseData.as_of,
      threshold_sufficient: baseData.threshold_sufficient,
      competencies: baseData.competencies,
      summary: baseData.summary,
    };
  }

  if (options.depth === "strand") {
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
    skills: options.gapsOnly
      ? baseData.skills.filter((s) => s.is_gap)
      : baseData.skills,
    summary: baseData.summary,
  };
}

export async function getManagerTaxonomySkillDetail(code: string) {
  const { taxonomy, tagging } = useOwnerRepositories();
  const hierarchy = await taxonomy.findSkillHierarchyByCode(code);
  if (!hierarchy) {
    throw new NotFoundError();
  }

  const skill = hierarchy;
  const strandCode = hierarchy.strand.code;
  const strandName = hierarchy.strand.name;
  const competencyCode = hierarchy.strand.competency.code;
  const competencyName = hierarchy.strand.competency.name;

  const [los, upstreamPrereqs, downstreamUnlocks, attachedLevelsRows] =
    await Promise.all([
      taxonomy.listLearningObjectivesBySkillId(skill.id),
      taxonomy.listUpstreamPrerequisites(skill.id),
      taxonomy.listDownstreamUnlocks(skill.id),
      tagging.listLevelsForSkill(skill.id),
    ]);

  const attachedLevels = attachedLevelsRows.flatMap((row) =>
    row.gameLevel
      ? [
          {
            id: row.gameLevel.id,
            code: row.gameLevel.code,
            title: row.gameLevel.title,
            access_tier: ACCESS_TIER_CODEC.toLabel(row.gameLevel.accessTier),
            weight: row.weight,
            status: "published" as const,
          },
        ]
      : []
  );

  return {
    identifiers: {
      code: skill.code,
      name: skill.name,
      description: skill.description,
      strand_code: strandCode,
      strand_name: strandName,
      competency_code: competencyCode,
      competency_name: competencyName,
      tier: SKILL_TIER_CODEC.toLabel(skill.tier),
      status: "seeded",
      is_deprecated: false,
    },
    attributes: {
      age_min: skill.ageMin,
      age_max: skill.ageMax,
      difficulty: skill.difficulty,
      thinking_processes: skill.thinkingProcesses || [],
      what_axis: skill.whatAxis || [],
    },
    learning_objectives: los.map((lo) => ({
      id: lo.id,
      code: lo.code,
      behaviour: lo.behaviour,
      observable_criteria: lo.observableCriteria,
      position: lo.position,
    })),
    prerequisites: {
      upstream: upstreamPrereqs.map((u) => u.prerequisite),
      downstream: downstreamUnlocks.map((d) => d.skill),
    },
    attached_content: {
      levels: attachedLevels,
      total_published: attachedLevels.length,
      total_draft: 0,
    },
    actions: {
      author_url: `/studio/levels?skill_code=${skill.code}`,
      pr_notice:
        "Taxonomy là Lớp 1 — thay đổi cấu trúc taxonomy cần thực hiện qua Pull Request trong kho lưu trữ, không thể sửa trực tiếp từ giao diện quản trị.",
    },
  };
}
