import type { RelationsBuilder } from "drizzle-orm";
import type { DbTables } from "./tables.ts";

type SchemaTables = DbTables;

export function buildPlayChildRelations(r: RelationsBuilder<SchemaTables>) {
  return {
    childProfiles: {
      user: r.one.users({
        from: r.childProfiles.userId,
        to: r.users.id,
        optional: false,
      }),
      currentCurriculum: r.one.curricula({
        from: r.childProfiles.currentCurriculumId,
        to: r.curricula.id,
        optional: true,
      }),
      playSessions: r.many.playSessions({
        from: r.childProfiles.id,
        to: r.playSessions.childProfileId,
      }),
      sessionSummaries: r.many.childSessionSummaries({
        from: r.childProfiles.id,
        to: r.childSessionSummaries.childProfileId,
      }),
      dailyStats: r.many.childDailyStats({
        from: r.childProfiles.id,
        to: r.childDailyStats.childProfileId,
      }),
      masteryStates: r.many.masteryState({
        from: r.childProfiles.id,
        to: r.masteryState.childProfileId,
      }),
      badges: r.many.childBadges({
        from: r.childProfiles.id,
        to: r.childBadges.childProfileId,
      }),
      stickers: r.many.childStickers({
        from: r.childProfiles.id,
        to: r.childStickers.childProfileId,
      }),
      stickerPlacements: r.many.childStickerPlacements({
        from: r.childProfiles.id,
        to: r.childStickerPlacements.childProfileId,
      }),
      mascotGear: r.one.childMascotGear({
        from: r.childProfiles.id,
        to: r.childMascotGear.childProfileId,
        optional: true,
      }),
      curriculumEnrollments: r.many.curriculumEnrollments({
        from: r.childProfiles.id,
        to: r.curriculumEnrollments.childId,
      }),
      curriculumItemProgress: r.many.curriculumItemProgress({
        from: r.childProfiles.id,
        to: r.curriculumItemProgress.childId,
      }),
      personalCurriculumEnrollments: r.many.personalCurriculumEnrollments({
        from: r.childProfiles.id,
        to: r.personalCurriculumEnrollments.childId,
      }),
      personalCurriculumItemProgress: r.many.personalCurriculumItemProgress({
        from: r.childProfiles.id,
        to: r.personalCurriculumItemProgress.childId,
      }),
    },
    playSessions: {
      childProfile: r.one.childProfiles({
        from: r.playSessions.childProfileId,
        to: r.childProfiles.id,
        optional: true,
      }),
      gameLevel: r.one.gameLevels({
        from: r.playSessions.gameLevelId,
        to: r.gameLevels.id,
        optional: false,
      }),
      telemetryEvents: r.many.telemetryEvents({
        from: r.playSessions.sessionUuid,
        to: r.telemetryEvents.sessionUuid,
      }),
      awardedStickers: r.many.childStickers({
        from: r.playSessions.id,
        to: r.childStickers.playSessionId,
      }),
    },
    telemetryEvents: {
      playSession: r.one.playSessions({
        from: r.telemetryEvents.sessionUuid,
        to: r.playSessions.sessionUuid,
        optional: true,
      }),
    },
    childSessionSummaries: {
      childProfile: r.one.childProfiles({
        from: r.childSessionSummaries.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
      gameLevel: r.one.gameLevels({
        from: r.childSessionSummaries.gameLevelId,
        to: r.gameLevels.id,
        optional: false,
      }),
    },
    childDailyStats: {
      childProfile: r.one.childProfiles({
        from: r.childDailyStats.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
    },
    skillDailyStats: {
      skill: r.one.skills({
        from: r.skillDailyStats.skillId,
        to: r.skills.id,
        optional: false,
      }),
    },
    masteryState: {
      childProfile: r.one.childProfiles({
        from: r.masteryState.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
      skill: r.one.skills({
        from: r.masteryState.skillId,
        to: r.skills.id,
        optional: false,
      }),
    },
    childBadges: {
      childProfile: r.one.childProfiles({
        from: r.childBadges.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
    },
    childStickers: {
      childProfile: r.one.childProfiles({
        from: r.childStickers.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
      playSession: r.one.playSessions({
        from: r.childStickers.playSessionId,
        to: r.playSessions.id,
        optional: true,
      }),
    },
    childStickerPlacements: {
      childProfile: r.one.childProfiles({
        from: r.childStickerPlacements.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
    },
    childMascotGear: {
      childProfile: r.one.childProfiles({
        from: r.childMascotGear.childProfileId,
        to: r.childProfiles.id,
        optional: false,
      }),
    },
  };
}
