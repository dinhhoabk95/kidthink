import {
  ACCESS_TIER,
  AI_CREDIT_REASON,
  CONTENT_ENTITY_TYPE,
  CUSTOM_GAME_STATUS,
  EXPORT_JOB_KIND,
  type MindKidRepositories,
  PLAY_COMPLETION_STATUS,
} from "#src/index";
import {
  FIXED_EXPIRES_PAST,
  FIXED_T0,
  FIXED_T1,
  FIXED_T2,
  FIXED_T3,
  SESSION_1_UUID,
  SESSION_2_UUID,
  type SeededLearningFixtures,
} from "#tests/repositories/parity-helpers";

export async function runPlayTelemetryRollupScenario(
  repos: MindKidRepositories,
  fx: SeededLearningFixtures,
  c1Id: number
) {
  await repos.tagging.replaceEntitySkills(
    CONTENT_ENTITY_TYPE.GAME_LEVEL,
    fx.levelId,
    [{ skillId: fx.skillId, weight: 1 }]
  );

  const s1 = await repos.playSessions.startSession({
    sessionUuid: SESSION_1_UUID,
    childProfileId: c1Id,
    gameLevelId: fx.levelId,
    templateCode: "GT-001",
    accessTierAtStart: ACCESS_TIER.FREE,
    layoutSeed: 42,
    startedAt: FIXED_T0,
  });
  await repos.playSessions.updateSessionDuration(SESSION_1_UUID, 90, FIXED_T1);
  const s1Completed = await repos.playSessions.completeSession(SESSION_1_UUID, {
    completionStatus: PLAY_COMPLETION_STATUS.COMPLETED,
    starsEarned: 3,
    score: 100,
    durationSeconds: 120,
    completedAt: FIXED_T1,
  });

  await repos.playSessions.startSession({
    sessionUuid: SESSION_2_UUID,
    childProfileId: c1Id,
    gameLevelId: fx.levelId,
    templateCode: "GT-001",
    startedAt: FIXED_T2,
  });

  await repos.telemetry.insertBatchReturningSeqs([
    {
      sessionUuid: SESSION_2_UUID,
      seq: 1,
      gameLevelId: fx.levelId,
      templateCode: "GT-001",
      eventName: "intro_segment_completed",
      occurredAtMs: 1500,
      payload: { segment: "voice-1" },
      clientTimestamp: FIXED_T2,
      ingestedAt: FIXED_T2,
    },
    {
      sessionUuid: SESSION_2_UUID,
      seq: 2,
      gameLevelId: fx.levelId,
      templateCode: "GT-001",
      eventName: "attempt",
      payload: { correct: true },
      ingestedAt: FIXED_T2,
    },
  ]);

  await repos.mastery.upsertMastery({
    childProfileId: c1Id,
    skillId: fx.skillId,
    pLearn: 0.45,
    emaCorrect: 0.6,
    attemptsTotal: 4,
    bestPLearn: 0.45,
    lastSeenAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });
  const mastery2 = await repos.mastery.upsertMastery({
    childProfileId: c1Id,
    skillId: fx.skillId,
    pLearn: 0.725,
    emaCorrect: 0.85,
    attemptsTotal: 7,
    bestPLearn: 0.725,
    lastSeenAt: FIXED_T1,
    updatedAt: FIXED_T1,
  });
  const masteryWithInfo = await repos.mastery.listForChildWithSkillInfo(
    c1Id,
    5
  );

  const awarded = await repos.badges.awardBadges(
    c1Id,
    ["first_star", "count_master"],
    SESSION_1_UUID,
    FIXED_T1
  );
  const badgeCodes = await repos.badges.listBadgeCodesForChild(c1Id);

  const [
    completedCodes,
    levelStatsMap,
    childAgg,
    windowSummary,
    telEvents,
    telSeqs,
    introSegs,
  ] = await Promise.all([
    repos.playSessions.listCompletedLevelCodes(c1Id),
    repos.playSessions.mapLevelStatsForChild(c1Id, [fx.levelId]),
    repos.playSessions.getChildAggregateSince(c1Id, FIXED_T0),
    repos.playSessions.getWindowActivitySummary(FIXED_T0),
    repos.telemetry.listBySession(SESSION_2_UUID),
    repos.telemetry.listSeqsBySession(SESSION_2_UUID),
    repos.telemetry.listIntroSegmentEvents("GL-C1-001", c1Id),
  ]);

  const summary = await repos.analyticsRollup.upsertSessionSummary({
    childProfileId: c1Id,
    sessionUuid: SESSION_1_UUID,
    gameLevelId: fx.levelId,
    templateCode: "GT-001",
    completionStatus: PLAY_COMPLETION_STATUS.COMPLETED,
    score: 100,
    durationSeconds: 120,
    starsEarned: 3,
    hintsUsed: 1,
    retriesCount: 0,
    completedAt: FIXED_T1,
    updatedAt: FIXED_T1,
  });
  await repos.analyticsRollup.upsertChildDailyStatsBatch([
    {
      childProfileId: c1Id,
      dateIct: "2026-11-22",
      sessionsCount: 1,
      totalPlayTimeSeconds: 120,
      levelsAttempted: 1,
      levelsCompleted: 1,
      skillsTouched: 1,
      starsEarned: 3,
      updatedAt: FIXED_T1,
    },
  ]);
  const extraGranted = await repos.analyticsRollup.grantExtraTimeMinutes(
    c1Id,
    "2026-11-22",
    15,
    FIXED_T2
  );
  const [levelAggs, skillAggs, childDaily, playDates, latestLevel] =
    await Promise.all([
      repos.analyticsRollup.computeLevelDailyAggregates(FIXED_T0, FIXED_T3),
      repos.analyticsRollup.computeSkillDailyAggregates(FIXED_T0, FIXED_T3),
      repos.analyticsRollup.getChildDailyStat(c1Id, "2026-11-22"),
      repos.analyticsRollup.listDistinctPlayDatesForChild(c1Id),
      repos.analyticsRollup.findLatestSessionLevelForChild(c1Id),
    ]);
  await repos.analyticsRollup.upsertLevelDailyStatsBatch(
    levelAggs.map((a) => ({
      ...a,
      dateIct: "2026-11-22",
      avgHintsUsed: 1,
      updatedAt: FIXED_T2,
    }))
  );
  await repos.analyticsRollup.upsertSkillDailyStatsBatch(
    skillAggs.map((a) => ({
      skillId: a.skillId,
      dateIct: "2026-11-22",
      exposureCount: a.exposureCount,
      avgAccuracyPercent: 100,
      updatedAt: FIXED_T2,
    }))
  );
  const playsByLevel = await repos.analyticsRollup.sumPlaysByLevelCode();

  return {
    s1,
    s1Completed,
    mastery2,
    masteryWithInfo,
    awarded,
    badgeCodes,
    completedCodes,
    levelStatsEntries: Array.from(levelStatsMap.entries()),
    childAgg,
    windowSummary,
    telEvents,
    telSeqs,
    introSegs,
    summary,
    extraGranted,
    levelAggs,
    skillAggs,
    childDaily,
    playDates,
    latestLevel,
    playsByLevelEntries: Array.from(playsByLevel.entries()),
  };
}

export async function runLibraryCreditsExportsScenario(
  repos: MindKidRepositories,
  fx: SeededLearningFixtures,
  u1Id: number
) {
  const coll = await repos.library.createCollection({
    userId: u1Id,
    name: "Số đếm yêu thích",
    position: 1,
    createdAt: FIXED_T0,
  });
  const libItem = await repos.library.addLibraryItem({
    userId: u1Id,
    entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL,
    entityId: fx.levelId,
    collectionId: coll.id,
    note: "Chơi cuối tuần",
    createdAt: FIXED_T0,
  });
  const [collCounts, libItems] = await Promise.all([
    repos.library.countItemsByCollectionForUser(u1Id),
    repos.library.listLibraryItems({ userId: u1Id, collectionId: coll.id }),
  ]);

  const cg = await repos.customGames.create({
    userId: u1Id,
    templateId: "GT-001",
    title: "Đếm cam của Bơ",
    instruction: "Chạm vào từng quả cam",
    contentPack: { item: "orange", count: 4 },
    difficultyParams: { max_count: 4 },
    skillIds: [fx.skillId],
    status: CUSTOM_GAME_STATUS.READY,
    createdAt: FIXED_T0,
  });
  const cgConflict = await repos.customGames.updateVersioned(cg.id, u1Id, 99, {
    title: "Sai",
    instruction: "Sai",
    contentPack: {},
    difficultyParams: {},
    themeId: "farm",
    ageMin: 3,
    ageMax: 6,
    skillIds: null,
    status: CUSTOM_GAME_STATUS.DRAFT,
  });
  const cgUpdated = await repos.customGames.updateVersioned(cg.id, u1Id, 1, {
    title: "Đếm cam v2",
    instruction: "Chạm để đếm",
    contentPack: { item: "orange", count: 5 },
    difficultyParams: { max_count: 5 },
    themeId: "farm",
    ageMin: 3,
    ageMax: 5,
    skillIds: [fx.skillId],
    status: CUSTOM_GAME_STATUS.READY,
    updatedAt: FIXED_T1,
  });

  const grant = await repos.aiCredits.grantCreditsAtomic({
    userId: u1Id,
    delta: 10,
    reason: AI_CREDIT_REASON.PURCHASE,
    idempotencyKey: "grant-1",
    createdAt: FIXED_T0,
  });
  const grantReplay = await repos.aiCredits.grantCreditsAtomic({
    userId: u1Id,
    delta: 10,
    reason: AI_CREDIT_REASON.PURCHASE,
    idempotencyKey: "grant-1",
    createdAt: FIXED_T0,
  });
  const debitOk = await repos.aiCredits.debitCreditsAtomic({
    userId: u1Id,
    cost: 4,
    feature: "custom_game",
    idempotencyKey: "debit-1",
    now: FIXED_T1,
  });
  const debitTooMuch = await repos.aiCredits.debitCreditsAtomic({
    userId: u1Id,
    cost: 100,
    feature: "custom_game",
    idempotencyKey: "debit-2",
    now: FIXED_T1,
  });
  const refund = await repos.aiCredits.refundCreditsAtomic({
    userId: u1Id,
    cost: 4,
    debitRefId: "debit-1",
    idempotencyKey: "refund-1",
    now: FIXED_T2,
  });
  const [balance, ledgerSum, ledgerPage, usage] = await Promise.all([
    repos.aiCredits.getBalance(u1Id),
    repos.aiCredits.sumLedgerDeltaForUser(u1Id),
    repos.aiCredits.listLedgerByUser(u1Id, { page: 1, limit: 10 }),
    repos.aiCredits.insertUsageLog({
      userId: u1Id,
      feature: "custom_game",
      creditsSpent: 4,
      model: "gemini-2.5-flash",
      promptVersion: "v1",
      inputTokens: 120,
      outputTokens: 340,
      costUsdMicros: 550,
      moderationPassed: true,
      createdAt: FIXED_T1,
    }),
  ]);

  const job = await repos.exports.createJob({
    userId: u1Id,
    kind: EXPORT_JOB_KIND.CURRICULUM_PLAN,
    refId: String(fx.curriculumId),
    createdAt: FIXED_T0,
  });
  await repos.exports.markProcessing(job.id, FIXED_T1);
  const jobDone = await repos.exports.markDone(job.id, {
    filePath: "exports/report-1.pdf",
    pageCount: 4,
    expiresAt: FIXED_EXPIRES_PAST,
    updatedAt: FIXED_T1,
  });
  const [monthlyCount, expiredJobs] = await Promise.all([
    repos.exports.countMonthlyNonFailedByUser(u1Id, FIXED_T0),
    repos.exports.listExpiredWithFiles(FIXED_T2),
  ]);
  const cleared = await repos.exports.clearFilePaths([job.id], FIXED_T2);

  const { uuid: usageUuid, ...usageRest } = usage;

  return {
    cgUuid: cg.uuid,
    jobUuid: job.uuid,
    usageUuid,
    coll,
    libItem,
    collCounts: Array.from(collCounts.entries()),
    libItems,
    cgConflict,
    cgVersion: cgUpdated?.version ?? null,
    cgSkillIds: cgUpdated?.skillIds ?? null,
    grantBalance: grant.balance,
    grantReplayProcessed: grantReplay.alreadyProcessed,
    debitOk: debitOk.ok ? debitOk.newBalance : null,
    debitTooMuch,
    refundBalance: refund.newBalance,
    balance,
    ledgerSum,
    ledgerTotal: ledgerPage.total,
    usage: usageRest,
    jobStatus: jobDone?.status ?? null,
    monthlyCount,
    expiredCount: expiredJobs.length,
    cleared,
  };
}
