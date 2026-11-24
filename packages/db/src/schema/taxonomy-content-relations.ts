import type { RelationsBuilder } from "drizzle-orm";
import { CONTENT_ENTITY_TYPE } from "#src/constants/learning-enums";
import type { DbTables } from "./tables.ts";

type SchemaTables = DbTables;

export function buildTaxonomyContentRelations(
  r: RelationsBuilder<SchemaTables>
) {
  return {
    competencies: {
      strands: r.many.strands({
        from: r.competencies.id,
        to: r.strands.competencyId,
      }),
    },
    strands: {
      competency: r.one.competencies({
        from: r.strands.competencyId,
        to: r.competencies.id,
        optional: false,
      }),
      parentStrand: r.one.strands({
        from: r.strands.parentStrandId,
        to: r.strands.id,
        optional: true,
        alias: "strand_hierarchy",
      }),
      childStrands: r.many.strands({
        from: r.strands.id,
        to: r.strands.parentStrandId,
        alias: "strand_hierarchy",
      }),
      skills: r.many.skills({
        from: r.strands.id,
        to: r.skills.strandId,
      }),
    },
    skills: {
      strand: r.one.strands({
        from: r.skills.strandId,
        to: r.strands.id,
        optional: false,
      }),
      prerequisites: r.many.skillPrerequisites({
        from: r.skills.id,
        to: r.skillPrerequisites.skillId,
        alias: "skill_prerequisites_skill",
      }),
      requiredForSkills: r.many.skillPrerequisites({
        from: r.skills.id,
        to: r.skillPrerequisites.prerequisiteId,
        alias: "skill_prerequisites_prerequisite",
      }),
      learningObjectives: r.many.learningObjectives({
        from: r.skills.id,
        to: r.learningObjectives.skillId,
      }),
      datasets: r.many.skillDatasets({
        from: r.skills.id,
        to: r.skillDatasets.skillId,
      }),
      contentSkillMaps: r.many.contentSkillMap({
        from: r.skills.id,
        to: r.contentSkillMap.skillId,
      }),
      masteryStates: r.many.masteryState({
        from: r.skills.id,
        to: r.masteryState.skillId,
      }),
      dailyStats: r.many.skillDailyStats({
        from: r.skills.id,
        to: r.skillDailyStats.skillId,
      }),
    },
    skillPrerequisites: {
      skill: r.one.skills({
        from: r.skillPrerequisites.skillId,
        to: r.skills.id,
        optional: false,
        alias: "skill_prerequisites_skill",
      }),
      prerequisite: r.one.skills({
        from: r.skillPrerequisites.prerequisiteId,
        to: r.skills.id,
        optional: false,
        alias: "skill_prerequisites_prerequisite",
      }),
    },
    learningObjectives: {
      skill: r.one.skills({
        from: r.learningObjectives.skillId,
        to: r.skills.id,
        optional: false,
      }),
    },
    skillDatasets: {
      skill: r.one.skills({
        from: r.skillDatasets.skillId,
        to: r.skills.id,
        optional: false,
      }),
      gameLevels: r.many.gameLevels({
        from: r.skillDatasets.id,
        to: r.gameLevels.skillDatasetId,
      }),
    },
    contentTags: {
      tagMaps: r.many.contentTagMap({
        from: r.contentTags.id,
        to: r.contentTagMap.tagId,
      }),
    },
    contentTagMap: {
      tag: r.one.contentTags({
        from: r.contentTagMap.tagId,
        to: r.contentTags.id,
        optional: false,
      }),
      gameLevel: r.one.gameLevels({
        from: r.contentTagMap.entityId,
        to: r.gameLevels.id,
        optional: true,
        alias: "tag_map_game_level",
      }),
      curriculum: r.one.curricula({
        from: r.contentTagMap.entityId,
        to: r.curricula.id,
        optional: true,
        alias: "tag_map_curriculum",
      }),
    },
    contentSkillMap: {
      skill: r.one.skills({
        from: r.contentSkillMap.skillId,
        to: r.skills.id,
        optional: false,
      }),
      gameLevel: r.one.gameLevels({
        from: r.contentSkillMap.entityId,
        to: r.gameLevels.id,
        optional: true,
        alias: "skill_map_game_level",
      }),
      curriculum: r.one.curricula({
        from: r.contentSkillMap.entityId,
        to: r.curricula.id,
        optional: true,
        alias: "skill_map_curriculum",
      }),
    },
    gameLevels: {
      skillDataset: r.one.skillDatasets({
        from: r.gameLevels.skillDatasetId,
        to: r.skillDatasets.id,
        optional: true,
      }),
      rounds: r.many.gameLevelRounds({
        from: r.gameLevels.id,
        to: r.gameLevelRounds.gameLevelId,
      }),
      playSessions: r.many.playSessions({
        from: r.gameLevels.id,
        to: r.playSessions.gameLevelId,
      }),
      sessionSummaries: r.many.childSessionSummaries({
        from: r.gameLevels.id,
        to: r.childSessionSummaries.gameLevelId,
      }),
      skillMaps: r.many.contentSkillMap({
        from: r.gameLevels.id,
        to: r.contentSkillMap.entityId,
        where: { entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL },
        alias: "skill_map_game_level",
      }),
      tagMaps: r.many.contentTagMap({
        from: r.gameLevels.id,
        to: r.contentTagMap.entityId,
        where: { entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL },
        alias: "tag_map_game_level",
      }),
    },
    gameLevelRounds: {
      gameLevel: r.one.gameLevels({
        from: r.gameLevelRounds.gameLevelId,
        to: r.gameLevels.id,
        optional: false,
      }),
    },
    curricula: {
      weeks: r.many.curriculumWeeks({
        from: r.curricula.id,
        to: r.curriculumWeeks.curriculumId,
      }),
      items: r.many.curriculumItems({
        from: r.curricula.id,
        to: r.curriculumItems.curriculumId,
      }),
      enrollments: r.many.curriculumEnrollments({
        from: r.curricula.id,
        to: r.curriculumEnrollments.curriculumId,
      }),
      currentChildren: r.many.childProfiles({
        from: r.curricula.id,
        to: r.childProfiles.currentCurriculumId,
      }),
      skillMaps: r.many.contentSkillMap({
        from: r.curricula.id,
        to: r.contentSkillMap.entityId,
        where: { entityType: CONTENT_ENTITY_TYPE.CURRICULUM },
        alias: "skill_map_curriculum",
      }),
      tagMaps: r.many.contentTagMap({
        from: r.curricula.id,
        to: r.contentTagMap.entityId,
        where: { entityType: CONTENT_ENTITY_TYPE.CURRICULUM },
        alias: "tag_map_curriculum",
      }),
    },
    curriculumWeeks: {
      curriculum: r.one.curricula({
        from: r.curriculumWeeks.curriculumId,
        to: r.curricula.id,
        optional: false,
      }),
    },
    curriculumItems: {
      curriculum: r.one.curricula({
        from: r.curriculumItems.curriculumId,
        to: r.curricula.id,
        optional: false,
      }),
      progressRecords: r.many.curriculumItemProgress({
        from: r.curriculumItems.id,
        to: r.curriculumItemProgress.curriculumItemId,
      }),
    },
    curriculumEnrollments: {
      childProfile: r.one.childProfiles({
        from: r.curriculumEnrollments.childId,
        to: r.childProfiles.id,
        optional: false,
      }),
      curriculum: r.one.curricula({
        from: r.curriculumEnrollments.curriculumId,
        to: r.curricula.id,
        optional: false,
      }),
      itemProgress: r.many.curriculumItemProgress({
        from: r.curriculumEnrollments.id,
        to: r.curriculumItemProgress.enrollmentId,
      }),
    },
    curriculumItemProgress: {
      enrollment: r.one.curriculumEnrollments({
        from: r.curriculumItemProgress.enrollmentId,
        to: r.curriculumEnrollments.id,
        optional: false,
      }),
      childProfile: r.one.childProfiles({
        from: r.curriculumItemProgress.childId,
        to: r.childProfiles.id,
        optional: false,
      }),
      curriculumItem: r.one.curriculumItems({
        from: r.curriculumItemProgress.curriculumItemId,
        to: r.curriculumItems.id,
        optional: false,
      }),
    },
    personalCurricula: {
      user: r.one.users({
        from: r.personalCurricula.userId,
        to: r.users.id,
        optional: false,
      }),
      items: r.many.personalCurriculumItems({
        from: r.personalCurricula.id,
        to: r.personalCurriculumItems.personalCurriculumId,
      }),
      enrollments: r.many.personalCurriculumEnrollments({
        from: r.personalCurricula.id,
        to: r.personalCurriculumEnrollments.personalCurriculumId,
      }),
    },
    personalCurriculumItems: {
      personalCurriculum: r.one.personalCurricula({
        from: r.personalCurriculumItems.personalCurriculumId,
        to: r.personalCurricula.id,
        optional: false,
      }),
      progressRecords: r.many.personalCurriculumItemProgress({
        from: r.personalCurriculumItems.id,
        to: r.personalCurriculumItemProgress.personalCurriculumItemId,
      }),
    },
    personalCurriculumEnrollments: {
      childProfile: r.one.childProfiles({
        from: r.personalCurriculumEnrollments.childId,
        to: r.childProfiles.id,
        optional: false,
      }),
      personalCurriculum: r.one.personalCurricula({
        from: r.personalCurriculumEnrollments.personalCurriculumId,
        to: r.personalCurricula.id,
        optional: false,
      }),
      itemProgress: r.many.personalCurriculumItemProgress({
        from: r.personalCurriculumEnrollments.id,
        to: r.personalCurriculumItemProgress.enrollmentId,
      }),
    },
    personalCurriculumItemProgress: {
      enrollment: r.one.personalCurriculumEnrollments({
        from: r.personalCurriculumItemProgress.enrollmentId,
        to: r.personalCurriculumEnrollments.id,
        optional: false,
      }),
      childProfile: r.one.childProfiles({
        from: r.personalCurriculumItemProgress.childId,
        to: r.childProfiles.id,
        optional: false,
      }),
      personalCurriculumItem: r.one.personalCurriculumItems({
        from: r.personalCurriculumItemProgress.personalCurriculumItemId,
        to: r.personalCurriculumItems.id,
        optional: false,
      }),
    },
    customGames: {
      user: r.one.users({
        from: r.customGames.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    collections: {
      user: r.one.users({
        from: r.collections.userId,
        to: r.users.id,
        optional: false,
      }),
      items: r.many.libraryItems({
        from: r.collections.id,
        to: r.libraryItems.collectionId,
      }),
    },
    libraryItems: {
      user: r.one.users({
        from: r.libraryItems.userId,
        to: r.users.id,
        optional: false,
      }),
      collection: r.one.collections({
        from: r.libraryItems.collectionId,
        to: r.collections.id,
        optional: true,
      }),
    },
  };
}
