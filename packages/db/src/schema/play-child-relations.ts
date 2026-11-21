import { relations } from "drizzle-orm/_relations";
import { childBadges, masteryState } from "./adaptive.ts";
import { childProfiles } from "./child.ts";
import { childStickers } from "./child-stickers.ts";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
} from "./curriculum.ts";
import { gameLevels } from "./game.ts";
import { users } from "./identity.ts";
import { childMascotGear, childStickerPlacements } from "./kid-world.ts";
import {
  personalCurriculumEnrollments,
  personalCurriculumItemProgress,
} from "./personal-curriculum.ts";
import {
  childDailyStats,
  childSessionSummaries,
  playSessions,
  skillDailyStats,
  telemetryEvents,
} from "./play.ts";
import { skills } from "./taxonomy.ts";

export const childProfilesRelations = relations(
  childProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [childProfiles.userId],
      references: [users.id],
    }),
    currentCurriculum: one(curricula, {
      fields: [childProfiles.currentCurriculumId],
      references: [curricula.id],
    }),
    playSessions: many(playSessions),
    sessionSummaries: many(childSessionSummaries),
    dailyStats: many(childDailyStats),
    masteryStates: many(masteryState),
    badges: many(childBadges),
    stickers: many(childStickers),
    stickerPlacements: many(childStickerPlacements),
    mascotGear: one(childMascotGear),
    curriculumEnrollments: many(curriculumEnrollments),
    curriculumItemProgress: many(curriculumItemProgress),
    personalCurriculumEnrollments: many(personalCurriculumEnrollments),
    personalCurriculumItemProgress: many(personalCurriculumItemProgress),
  })
);

export const playSessionsRelations = relations(
  playSessions,
  ({ one, many }) => ({
    childProfile: one(childProfiles, {
      fields: [playSessions.childProfileId],
      references: [childProfiles.id],
    }),
    gameLevel: one(gameLevels, {
      fields: [playSessions.gameLevelId],
      references: [gameLevels.id],
    }),
    telemetryEvents: many(telemetryEvents),
    awardedStickers: many(childStickers),
  })
);

export const telemetryEventsRelations = relations(
  telemetryEvents,
  ({ one }) => ({
    playSession: one(playSessions, {
      fields: [telemetryEvents.sessionUuid],
      references: [playSessions.sessionUuid],
    }),
  })
);

export const childSessionSummariesRelations = relations(
  childSessionSummaries,
  ({ one }) => ({
    childProfile: one(childProfiles, {
      fields: [childSessionSummaries.childProfileId],
      references: [childProfiles.id],
    }),
    gameLevel: one(gameLevels, {
      fields: [childSessionSummaries.gameLevelId],
      references: [gameLevels.id],
    }),
  })
);

export const childDailyStatsRelations = relations(
  childDailyStats,
  ({ one }) => ({
    childProfile: one(childProfiles, {
      fields: [childDailyStats.childProfileId],
      references: [childProfiles.id],
    }),
  })
);

export const skillDailyStatsRelations = relations(
  skillDailyStats,
  ({ one }) => ({
    skill: one(skills, {
      fields: [skillDailyStats.skillId],
      references: [skills.id],
    }),
  })
);

export const masteryStateRelations = relations(masteryState, ({ one }) => ({
  childProfile: one(childProfiles, {
    fields: [masteryState.childProfileId],
    references: [childProfiles.id],
  }),
  skill: one(skills, {
    fields: [masteryState.skillId],
    references: [skills.id],
  }),
}));

export const childBadgesRelations = relations(childBadges, ({ one }) => ({
  childProfile: one(childProfiles, {
    fields: [childBadges.childProfileId],
    references: [childProfiles.id],
  }),
}));

export const childStickersRelations = relations(childStickers, ({ one }) => ({
  childProfile: one(childProfiles, {
    fields: [childStickers.childProfileId],
    references: [childProfiles.id],
  }),
  playSession: one(playSessions, {
    fields: [childStickers.playSessionId],
    references: [playSessions.id],
  }),
}));

export const childStickerPlacementsRelations = relations(
  childStickerPlacements,
  ({ one }) => ({
    childProfile: one(childProfiles, {
      fields: [childStickerPlacements.childProfileId],
      references: [childProfiles.id],
    }),
  })
);

export const childMascotGearRelations = relations(
  childMascotGear,
  ({ one }) => ({
    childProfile: one(childProfiles, {
      fields: [childMascotGear.childProfileId],
      references: [childProfiles.id],
    }),
  })
);
