import { appError } from "@kidthink/auth";
import {
  competencies,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  learningObjectives,
  skillPrerequisites,
  skills,
  strands,
} from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    // Both super_admin and content_reviewer can read (BR-TXB-01)
    await requireManagerSession(event);

    const code = getRouterParam(event, "code");
    if (!code) {
      throw appError("VALIDATION_ERROR");
    }

    const db = getOwnerDb();

    // 1. Fetch skill
    const skillRows = await db
      .select({
        id: skills.id,
        code: skills.code,
        name: skills.nameVi,
        description: skills.descriptionVi,
        strandId: skills.strandId,
        ageMin: skills.ageMin,
        ageMax: skills.ageMax,
        difficulty: skills.difficulty,
        thinkingProcesses: skills.thinkingProcesses,
        whatAxis: skills.whatAxis,
        status: skills.status,
        strandCode: strands.code,
        strandName: strands.nameVi,
        competencyCode: competencies.code,
        competencyName: competencies.nameVi,
      })
      .from(skills)
      .innerJoin(strands, eq(skills.strandId, strands.id))
      .innerJoin(competencies, eq(strands.competencyId, competencies.id))
      .where(eq(skills.code, code))
      .limit(1);

    if (skillRows.length === 0) {
      throw appError("NOT_FOUND");
    }

    const skill = skillRows[0];

    // 2. Fetch learning objectives
    const los = await db
      .select()
      .from(learningObjectives)
      .where(eq(learningObjectives.skillId, skill.id))
      .orderBy(learningObjectives.position);

    // 3. Fetch 2-way prerequisites (Upstream prerequisites and Downstream unlocks) (BR-TXB-05)
    const upstreamPrereqs = await db
      .select({
        skillId: skills.id,
        code: skills.code,
        name: skills.nameVi,
        strength: skillPrerequisites.strength,
      })
      .from(skillPrerequisites)
      .innerJoin(skills, eq(skillPrerequisites.prerequisiteId, skills.id))
      .where(eq(skillPrerequisites.skillId, skill.id));

    const downstreamUnlocks = await db
      .select({
        skillId: skills.id,
        code: skills.code,
        name: skills.nameVi,
        strength: skillPrerequisites.strength,
      })
      .from(skillPrerequisites)
      .innerJoin(skills, eq(skillPrerequisites.skillId, skills.id))
      .where(eq(skillPrerequisites.prerequisiteId, skill.id));

    // 4. Fetch attached content (game levels & lessons)
    const attachedLevels = await db
      .select({
        id: gameLevels.id,
        code: gameLevels.code,
        title: gameLevels.titleVi,
        status: gameLevels.status,
        access_tier: gameLevels.accessTier,
        weight: contentSkillMap.weight,
      })
      .from(contentSkillMap)
      .innerJoin(
        gameLevels,
        and(
          eq(contentSkillMap.entityType, "level"),
          eq(contentSkillMap.entityId, gameLevels.id)
        )
      )
      .where(eq(contentSkillMap.skillId, skill.id));

    // 5. Structure response per §7.2
    return {
      identifiers: {
        code: skill.code,
        name: skill.name,
        description: skill.description,
        strand_code: skill.strandCode,
        strand_name: skill.strandName,
        competency_code: skill.competencyCode,
        competency_name: skill.competencyName,
        status: skill.status,
        is_deprecated: skill.status === "deprecated",
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
        behaviour: lo.behaviourVi,
        observable_criteria: lo.observableCriteriaVi,
        position: lo.position,
      })),
      prerequisites: {
        upstream: upstreamPrereqs,
        downstream: downstreamUnlocks,
      },
      attached_content: {
        levels: attachedLevels,
        total_published: attachedLevels.filter((l) => l.status === "published")
          .length,
        total_draft: attachedLevels.filter((l) => l.status === "draft").length,
      },
      actions: {
        author_url: `/admin/seed-authoring?skill_code=${skill.code}`,
        pr_notice:
          "Taxonomy là Lớp 1 — thay đổi cấu trúc taxonomy cần thực hiện qua Pull Request trong kho lưu trữ, không thể sửa trực tiếp từ giao diện quản trị.",
      },
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
