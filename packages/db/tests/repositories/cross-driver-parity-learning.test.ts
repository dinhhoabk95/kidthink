import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ACCESS_TIER,
  CONTENT_ENTITY_TYPE,
  CURRICULUM_PROGRESS_STATUS,
  DB,
  ENROLLMENT_STATUS,
  EXPORT_JOB_STATUS,
  PACKAGE_STATUS,
  PERSONAL_CURRICULUM_STATUS,
  PROGRAM_TYPE,
  SKILL_TIER,
  TAG_STATUS,
} from "#src/index";
import { truncateAllTestTables } from "#tests/global-setup";
import {
  FIXED_T0,
  FIXED_T1,
  FIXED_T2,
  runBoth,
  seedChildPair,
  seedLearningFixtures,
  seedUserPair,
  UUID_V4_REGEX,
} from "#tests/repositories/parity-helpers";
import {
  runLibraryCreditsExportsScenario,
  runPlayTelemetryRollupScenario,
} from "#tests/repositories/parity-learning-scenarios";

describe("Cross-Driver Repository Parity — Learning & Add-Ons (SQLite Local vs Cloudflare D1)", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_T2);
    await truncateAllTestTables();
    DB.configureSqlite({ dataDir: ":memory:" });
  });

  afterEach(async () => {
    vi.useRealTimers();
    DB.resetDefaultConnection();
    DB.clearD1Bindings();
    await DB.getSqliteDriver().disconnect();
  });

  afterAll(async () => {
    await truncateAllTestTables();
  });

  it("PackagesRepository performs idempotent JSON upserts identically across SQLite and D1", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ repos }) => {
      await repos.packages.upsertCatalog({
        code: "standard",
        name: "Gói Tiêu chuẩn v1",
        audience: "Gia đình",
        isPublic: true,
        isFeatured: false,
        status: PACKAGE_STATUS.ACTIVE,
        offers: [{ code: "std_90d", price_vnd: 390_000 }],
        quotas: { max_children: 2 },
        updatedAt: FIXED_T0,
      });

      const updatedStd = await repos.packages.upsertCatalog({
        code: "standard",
        name: "Gói Tiêu chuẩn",
        audience: "Gia đình Việt",
        description: "Đầy đủ 6 miền năng lực",
        isPublic: true,
        isFeatured: true,
        status: PACKAGE_STATUS.ACTIVE,
        offers: [{ code: "std_365d", price_vnd: 990_000 }],
        quotas: { max_children: 3, pdf_exports: 12 },
        updatedAt: FIXED_T1,
      });

      await repos.packages.upsertCatalog({
        code: "internal_pilot",
        name: "Gói Thử nghiệm",
        audience: "Nội bộ",
        isPublic: false,
        status: PACKAGE_STATUS.ACTIVE,
        offers: [],
        updatedAt: FIXED_T1,
      });

      const publicPackages = await repos.packages.listPublic();

      return { updatedStd, publicPackages };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.publicPackages).toHaveLength(1);
    expect(fromSqlite.publicPackages[0]?.isFeatured).toBe(true);
  });

  it("TaxonomyRepository, GameLevelsRepository, & TaggingRepository return identical nested relations, facets, and mappings", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ name, repos }) => {
      const fx = await seedLearningFixtures(name);

      await repos.tagging.replaceEntityTags(
        CONTENT_ENTITY_TYPE.GAME_LEVEL,
        fx.levelId,
        [fx.tagId]
      );
      await repos.tagging.replaceEntitySkills(
        CONTENT_ENTITY_TYPE.GAME_LEVEL,
        fx.levelId,
        [
          { skillId: fx.skillId, weight: 1 },
          { skillId: fx.prereqSkillId, weight: 0.35 },
        ]
      );

      const [
        comps,
        compByCode,
        strandsList,
        skillsList,
        hierarchy,
        los,
        loCounts,
        upstream,
        downstream,
        datasets,
      ] = await Promise.all([
        repos.taxonomy.listCompetencies(),
        repos.taxonomy.findCompetencyByCode("C1"),
        repos.taxonomy.listStrands(fx.competencyId),
        repos.taxonomy.listSkills({
          strandId: fx.strandId,
          tier: SKILL_TIER.CORE,
        }),
        repos.taxonomy.findSkillHierarchyByCode("C1.CNT.02"),
        repos.taxonomy.listLearningObjectivesBySkillId(fx.skillId),
        repos.taxonomy.countLearningObjectivesBySkill(),
        repos.taxonomy.listUpstreamPrerequisites(fx.skillId),
        repos.taxonomy.listDownstreamUnlocks(fx.prereqSkillId),
        repos.taxonomy.listSkillDatasetsBySkillId(fx.skillId),
      ]);

      const [
        levelByCode,
        publishedLevels,
        searchRes,
        facetRows,
        facetStrands,
        rounds,
        teachMatches,
        themeCounts,
      ] = await Promise.all([
        repos.gameLevels.findByCode("GL-C1-001"),
        repos.gameLevels.listPublished({ themeId: "farm" }),
        repos.gameLevels.search({
          q: "gl-c1",
          competency: "C1",
          strand: "CNT",
          skillCode: "C1.CNT.02",
        }),
        repos.gameLevels.listFacetRows({ accessTier: ACCESS_TIER.FREE }),
        repos.gameLevels.countFacetStrands({ accessTier: ACCESS_TIER.FREE }),
        repos.gameLevels.listRoundsByLevelId(fx.levelId),
        repos.gameLevels.listByTeachTemplates(["GT-001"], [fx.skillId]),
        repos.gameLevels.countByTheme(),
      ]);

      const [
        tags,
        skillMaps,
        levelIdsForSkill,
        codesByLevelId,
        codesByLevelCode,
        levelsForSkill,
        distinctLevelCounts,
      ] = await Promise.all([
        repos.tagging.listTags({ status: TAG_STATUS.ACTIVE }),
        repos.tagging.listSkillMaps(CONTENT_ENTITY_TYPE.GAME_LEVEL, fx.levelId),
        repos.tagging.listLevelIdsBySkillIds([fx.skillId]),
        repos.tagging.mapSkillCodesByLevelIds([fx.levelId]),
        repos.tagging.mapSkillCodesByLevelCodes(["GL-C1-001"]),
        repos.tagging.listLevelsForSkill(fx.skillId),
        repos.tagging.countDistinctGameLevelsBySkill(),
      ]);

      return {
        comps,
        compByCode,
        strandsList,
        skillsList,
        hierarchy,
        los,
        loCounts: Array.from(loCounts.entries()),
        upstream,
        downstream,
        datasets,
        levelByCode,
        publishedLevels,
        searchRes,
        facetRows,
        facetStrands,
        rounds,
        teachMatches,
        themeCounts: Array.from(themeCounts.entries()),
        tags,
        skillMaps,
        levelIdsForSkill,
        codesByLevelId: Array.from(codesByLevelId.entries()),
        codesByLevelCode: Array.from(codesByLevelCode.entries()),
        levelsForSkill,
        distinctLevelCounts: Array.from(distinctLevelCounts.entries()),
      };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.los).toHaveLength(3);
    expect(fromSqlite.hierarchy?.strand.competency.code).toBe("C1");
    expect(fromSqlite.upstream[0]?.strength).toBe("0.90");
    expect(fromSqlite.upstream[0]?.prerequisite.code).toBe("C1.CNT.01");
    expect(fromSqlite.searchRes.items).toHaveLength(1);
    expect(fromSqlite.rounds).toHaveLength(1);
    expect(fromSqlite.codesByLevelCode).toStrictEqual([
      ["GL-C1-001", ["C1.CNT.02", "C1.CNT.01"]],
    ]);
  });

  it("CurriculaRepository & PersonalCurriculaRepository match across enrollment, progress, and optimistic versioning", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ name, repos }) => {
      const fx = await seedLearningFixtures(name);
      const { u1 } = await seedUserPair(repos);
      const { c1 } = await seedChildPair(repos, u1.id);

      const [published, managerPage, weeks, items, itemCounts] =
        await Promise.all([
          repos.curricula.listPublished({
            programType: PROGRAM_TYPE.AGE_BASED,
          }),
          repos.curricula.listPaginatedForManager({
            isKoguma: true,
            kogumaTrack: "core_12w",
            kogumaStage: 1,
          }),
          repos.curricula.listWeeks(fx.curriculumId),
          repos.curricula.listItems(fx.curriculumId, 1),
          repos.curricula.countItemsByCurricula([fx.curriculumId]),
        ]);

      const enroll = await repos.curricula.enrollChild(
        c1.id,
        fx.curriculumId,
        FIXED_T0
      );
      const [activeEnroll, activeCountMap, progress] = await Promise.all([
        repos.curricula.findEnrollmentForChild(c1.id),
        repos.curricula.countActiveEnrollmentsByCurricula([fx.curriculumId]),
        repos.curricula.upsertItemProgress({
          enrollmentId: enroll.id,
          childId: c1.id,
          curriculumItemId: fx.curriculumItemId,
          status: CURRICULUM_PROGRESS_STATUS.COMPLETED,
          completedAt: FIXED_T1,
          updatedAt: FIXED_T1,
        }),
      ]);
      const [completed, withdrawn] = await Promise.all([
        repos.curricula.listCompletedProgress(enroll.id),
        repos.curricula.withdrawEnrollment(enroll.id, FIXED_T2),
      ]);

      const pCreated = await repos.personalCurricula.createWithItems({
        userId: u1.id,
        title: "Lộ trình riêng cho Bơ",
        ageMin: 3,
        ageMax: 4,
        durationWeeks: 4,
        sessionsPerWeek: 2,
        status: PERSONAL_CURRICULUM_STATUS.READY,
        createdAt: FIXED_T0,
        items: [
          {
            weekNo: 1,
            sessionNo: 1,
            position: 1,
            entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL,
            entityId: fx.levelId,
          },
        ],
      });
      expect(pCreated.uuid).toMatch(UUID_V4_REGEX);

      const [pCount, pSummaries, pFound, pItems] = await Promise.all([
        repos.personalCurricula.countByUser(u1.id),
        repos.personalCurricula.listByUserWithItems(u1.id),
        repos.personalCurricula.findByUuidForUser(pCreated.uuid, u1.id),
        repos.personalCurricula.listItems(pCreated.id),
      ]);
      const staleUpdate = await repos.personalCurricula.updateVersioned(
        pCreated.id,
        u1.id,
        999,
        { title: "Sai version" }
      );
      const pUpdated = await repos.personalCurricula.updateVersioned(
        pCreated.id,
        u1.id,
        1,
        { title: "Lộ trình riêng v2", updatedAt: FIXED_T1 }
      );
      const pEnroll = await repos.personalCurricula.enrollChild(
        c1.id,
        pCreated.id,
        FIXED_T1
      );
      const [pActiveEnroll, pProg] = await Promise.all([
        repos.personalCurricula.findActiveEnrollmentForChild(c1.id),
        repos.personalCurricula.upsertItemProgress({
          enrollmentId: pEnroll.id,
          childId: c1.id,
          personalCurriculumItemId: pItems[0]?.id ?? 0,
          completedAt: FIXED_T2,
        }),
      ]);
      const pCompletedIds = await repos.personalCurricula.listCompletedItemIds(
        pEnroll.id
      );

      return {
        published,
        managerTotal: managerPage.total,
        weeks,
        items,
        itemCounts: Array.from(itemCounts.entries()),
        enroll,
        activeEnroll,
        activeCountEntries: Array.from(activeCountMap.entries()),
        progress,
        completed,
        withdrawn,
        pVersion: pUpdated?.version ?? null,
        pCount,
        pFirstItemCount: pSummaries[0]?.items.length ?? 0,
        pFoundTitle: pFound?.title ?? null,
        staleUpdate,
        pEnrollStatus: pEnroll.status,
        pActiveTitle: pActiveEnroll?.personalCurriculum.title ?? null,
        pProgStatus: pProg.status,
        pCompletedIds,
      };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.managerTotal).toBe(1);
    expect(fromSqlite.withdrawn?.status).toBe(ENROLLMENT_STATUS.WITHDRAWN);
    expect(fromSqlite.staleUpdate).toBeNull();
    expect(fromSqlite.pVersion).toBe(2);
    expect(fromSqlite.pCompletedIds).toHaveLength(1);
    expect(fromSqlite.pActiveTitle).toBe("Lộ trình riêng v2");
  });

  it("PlaySessions, Mastery, Badges, Telemetry, & AnalyticsRollup Repositories match identically", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ name, repos }) => {
      const fx = await seedLearningFixtures(name);
      const { u1 } = await seedUserPair(repos);
      const { c1 } = await seedChildPair(repos, u1.id);
      return await runPlayTelemetryRollupScenario(repos, fx, c1.id);
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.mastery2.pLearn).toBe("0.7250");
    expect(fromSqlite.awarded).toBe(2);
    expect(fromSqlite.telSeqs).toStrictEqual([2, 1]);
    expect(fromSqlite.introSegs[0]?.payload).toStrictEqual({
      segment: "voice-1",
    });
    expect(fromSqlite.extraGranted.extraTimeGrantedMinutes).toBe(15);
    expect(fromSqlite.playsByLevelEntries).toStrictEqual([["GL-C1-001", 2]]);
  });

  it("Library, CustomGames, AiCredits, & Exports Repositories match identically", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ name, repos }) => {
      const fx = await seedLearningFixtures(name);
      const { u1 } = await seedUserPair(repos);
      const res = await runLibraryCreditsExportsScenario(repos, fx, u1.id);
      expect(res.cgUuid).toMatch(UUID_V4_REGEX);
      expect(res.jobUuid).toMatch(UUID_V4_REGEX);
      expect(res.usageUuid).toMatch(UUID_V4_REGEX);
      const {
        cgUuid: _omitCg,
        jobUuid: _omitJob,
        usageUuid: _omitUsage,
        ...rest
      } = res;
      return rest;
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.cgConflict).toBeNull();
    expect(fromSqlite.cgVersion).toBe(2);
    expect(fromSqlite.grantReplayProcessed).toBe(true);
    expect(fromSqlite.debitOk).toBe(6);
    expect(fromSqlite.debitTooMuch).toStrictEqual({
      ok: false,
      currentBalance: 6,
    });
    expect(fromSqlite.refundBalance).toBe(10);
    expect(fromSqlite.ledgerSum).toBe(10);
    expect(fromSqlite.jobStatus).toBe(EXPORT_JOB_STATUS.DONE);
    expect(fromSqlite.cleared).toBe(1);
  });
});
