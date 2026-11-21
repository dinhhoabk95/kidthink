import { relations } from "drizzle-orm/_relations";
import { masteryState } from "./adaptive.ts";
import { childProfiles } from "./child.ts";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
} from "./curriculum.ts";
import { customGames } from "./custom-game.ts";
import { gameLevelRounds, gameLevels } from "./game.ts";
import { users } from "./identity.ts";
import { collections, libraryItems } from "./library.ts";
import {
  personalCurricula,
  personalCurriculumEnrollments,
  personalCurriculumItemProgress,
  personalCurriculumItems,
} from "./personal-curriculum.ts";
import {
  childSessionSummaries,
  playSessions,
  skillDailyStats,
} from "./play.ts";
import { contentSkillMap, contentTagMap, contentTags } from "./tagging.ts";
import {
  competencies,
  learningObjectives,
  skillDatasets,
  skillPrerequisites,
  skills,
  strands,
} from "./taxonomy.ts";

export const competenciesRelations = relations(competencies, ({ many }) => ({
  strands: many(strands),
}));

export const strandsRelations = relations(strands, ({ one, many }) => ({
  competency: one(competencies, {
    fields: [strands.competencyId],
    references: [competencies.id],
  }),
  parentStrand: one(strands, {
    fields: [strands.parentStrandId],
    references: [strands.id],
    relationName: "strand_hierarchy",
  }),
  childStrands: many(strands, {
    relationName: "strand_hierarchy",
  }),
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  strand: one(strands, {
    fields: [skills.strandId],
    references: [strands.id],
  }),
  prerequisites: many(skillPrerequisites, {
    relationName: "skill_prerequisites_skill",
  }),
  requiredForSkills: many(skillPrerequisites, {
    relationName: "skill_prerequisites_prerequisite",
  }),
  learningObjectives: many(learningObjectives),
  datasets: many(skillDatasets),
  contentSkillMaps: many(contentSkillMap),
  masteryStates: many(masteryState),
  dailyStats: many(skillDailyStats),
}));

export const skillPrerequisitesRelations = relations(
  skillPrerequisites,
  ({ one }) => ({
    skill: one(skills, {
      fields: [skillPrerequisites.skillId],
      references: [skills.id],
      relationName: "skill_prerequisites_skill",
    }),
    prerequisite: one(skills, {
      fields: [skillPrerequisites.prerequisiteId],
      references: [skills.id],
      relationName: "skill_prerequisites_prerequisite",
    }),
  })
);

export const learningObjectivesRelations = relations(
  learningObjectives,
  ({ one }) => ({
    skill: one(skills, {
      fields: [learningObjectives.skillId],
      references: [skills.id],
    }),
  })
);

export const skillDatasetsRelations = relations(
  skillDatasets,
  ({ one, many }) => ({
    skill: one(skills, {
      fields: [skillDatasets.skillId],
      references: [skills.id],
    }),
    gameLevels: many(gameLevels),
  })
);

export const contentTagsRelations = relations(contentTags, ({ many }) => ({
  tagMaps: many(contentTagMap),
}));

export const contentTagMapRelations = relations(contentTagMap, ({ one }) => ({
  tag: one(contentTags, {
    fields: [contentTagMap.tagId],
    references: [contentTags.id],
  }),
}));

export const contentSkillMapRelations = relations(
  contentSkillMap,
  ({ one }) => ({
    skill: one(skills, {
      fields: [contentSkillMap.skillId],
      references: [skills.id],
    }),
  })
);

export const gameLevelsRelations = relations(gameLevels, ({ one, many }) => ({
  skillDataset: one(skillDatasets, {
    fields: [gameLevels.skillDatasetId],
    references: [skillDatasets.id],
  }),
  rounds: many(gameLevelRounds),
  playSessions: many(playSessions),
  sessionSummaries: many(childSessionSummaries),
}));

export const gameLevelRoundsRelations = relations(
  gameLevelRounds,
  ({ one }) => ({
    gameLevel: one(gameLevels, {
      fields: [gameLevelRounds.gameLevelId],
      references: [gameLevels.id],
    }),
  })
);

export const curriculaRelations = relations(curricula, ({ many }) => ({
  weeks: many(curriculumWeeks),
  items: many(curriculumItems),
  enrollments: many(curriculumEnrollments),
  currentChildren: many(childProfiles),
}));

export const curriculumWeeksRelations = relations(
  curriculumWeeks,
  ({ one }) => ({
    curriculum: one(curricula, {
      fields: [curriculumWeeks.curriculumId],
      references: [curricula.id],
    }),
  })
);

export const curriculumItemsRelations = relations(
  curriculumItems,
  ({ one, many }) => ({
    curriculum: one(curricula, {
      fields: [curriculumItems.curriculumId],
      references: [curricula.id],
    }),
    progressRecords: many(curriculumItemProgress),
  })
);

export const curriculumEnrollmentsRelations = relations(
  curriculumEnrollments,
  ({ one, many }) => ({
    childProfile: one(childProfiles, {
      fields: [curriculumEnrollments.childId],
      references: [childProfiles.id],
    }),
    curriculum: one(curricula, {
      fields: [curriculumEnrollments.curriculumId],
      references: [curricula.id],
    }),
    itemProgress: many(curriculumItemProgress),
  })
);

export const curriculumItemProgressRelations = relations(
  curriculumItemProgress,
  ({ one }) => ({
    enrollment: one(curriculumEnrollments, {
      fields: [curriculumItemProgress.enrollmentId],
      references: [curriculumEnrollments.id],
    }),
    childProfile: one(childProfiles, {
      fields: [curriculumItemProgress.childId],
      references: [childProfiles.id],
    }),
    curriculumItem: one(curriculumItems, {
      fields: [curriculumItemProgress.curriculumItemId],
      references: [curriculumItems.id],
    }),
  })
);

export const personalCurriculaRelations = relations(
  personalCurricula,
  ({ one, many }) => ({
    user: one(users, {
      fields: [personalCurricula.userId],
      references: [users.id],
    }),
    items: many(personalCurriculumItems),
    enrollments: many(personalCurriculumEnrollments),
  })
);

export const personalCurriculumItemsRelations = relations(
  personalCurriculumItems,
  ({ one, many }) => ({
    personalCurriculum: one(personalCurricula, {
      fields: [personalCurriculumItems.personalCurriculumId],
      references: [personalCurricula.id],
    }),
    progressRecords: many(personalCurriculumItemProgress),
  })
);

export const personalCurriculumEnrollmentsRelations = relations(
  personalCurriculumEnrollments,
  ({ one, many }) => ({
    childProfile: one(childProfiles, {
      fields: [personalCurriculumEnrollments.childId],
      references: [childProfiles.id],
    }),
    personalCurriculum: one(personalCurricula, {
      fields: [personalCurriculumEnrollments.personalCurriculumId],
      references: [personalCurricula.id],
    }),
    itemProgress: many(personalCurriculumItemProgress),
  })
);

export const personalCurriculumItemProgressRelations = relations(
  personalCurriculumItemProgress,
  ({ one }) => ({
    enrollment: one(personalCurriculumEnrollments, {
      fields: [personalCurriculumItemProgress.enrollmentId],
      references: [personalCurriculumEnrollments.id],
    }),
    childProfile: one(childProfiles, {
      fields: [personalCurriculumItemProgress.childId],
      references: [childProfiles.id],
    }),
    personalCurriculumItem: one(personalCurriculumItems, {
      fields: [personalCurriculumItemProgress.personalCurriculumItemId],
      references: [personalCurriculumItems.id],
    }),
  })
);

export const customGamesRelations = relations(customGames, ({ one }) => ({
  user: one(users, {
    fields: [customGames.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  items: many(libraryItems),
}));

export const libraryItemsRelations = relations(libraryItems, ({ one }) => ({
  user: one(users, {
    fields: [libraryItems.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [libraryItems.collectionId],
    references: [collections.id],
  }),
}));
