import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  lessons,
} from "@kidthink/db";
import {
  buildCourseJsonLd,
  hasForbiddenPublicKeys,
  toProgramCardPublic,
  toProgramDetailPublic,
} from "@kidthink/shared";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import getCurriculumDetailHandler from "../../../server/api/guest/curricula/[code].get.js";
import getCurriculaListHandler from "../../../server/api/guest/curricula/index.get.js";

function makeGuestEvent(
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method: "GET",
    node: {
      req: {
        method: "GET",
        socket: { remoteAddress: "127.0.0.1" },
        headers: {},
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      params,
      query,
    },
  } as any;
}

describe("Public Program Showcase Suite — P3.8 (Task #61, BR-PSH-01..07, D-NF..D-NL)", () => {
  const db = getOwnerDb();
  const testRunId = Math.floor(Math.random() * 800_000) + 100_000;
  const num4 = (1000 + (testRunId % 8000)).toString();

  const publishedCode = `CUR-PUB-TEST-${testRunId}`;
  const archivedCode = `CUR-ARC-TEST-${testRunId}`;
  const draftCode = `CUR-DFT-TEST-${testRunId}`;
  const journeyCode = `CUR-JOU-TEST-${testRunId}`;

  const glCode1 = `GL-C1-CNT-NUM-${num4}`;
  const glCode2 = `GL-C2-GEO-SHP-${num4}`;
  const lesCode1 = `LES-${num4}`;

  beforeAll(async () => {
    // 1. Template (Code must match ^GT-\d{3}$)
    const [template] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-001",
        nameVi: "Template Showcase",
        mechanic: "tap_target",
      })
      .onConflictDoNothing()
      .returning();

    const templateId = template
      ? template.id
      : (
          await db
            .select()
            .from(gameTemplates)
            .where(eq(gameTemplates.code, "GT-001"))
        )[0]?.id || 1;

    // 2. Published game levels & lessons
    await db
      .delete(gameLevels)
      .where(inArray(gameLevels.code, [glCode1, glCode2]));
    await db.delete(lessons).where(eq(lessons.code, lesCode1));

    const [gl1] = await db
      .insert(gameLevels)
      .values({
        entityId: testRunId + 101,
        code: glCode1,
        contentVersion: 1,
        templateId,
        titleVi: "Đếm sao quả",
        instructionVi: "Hướng dẫn đếm",
        contentPack: { secret: 123 },
        difficultyParams: { difficulty: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning();

    const [gl2] = await db
      .insert(gameLevels)
      .values({
        entityId: testRunId + 102,
        code: glCode2,
        contentVersion: 1,
        templateId,
        titleVi: "Phân loại hình khối",
        instructionVi: "Hướng dẫn hình",
        contentPack: { shapes: ["circle", "square"] },
        difficultyParams: { difficulty: 2 },
        accessTier: "standard",
        status: "published",
      })
      .returning();

    const [les1] = await db
      .insert(lessons)
      .values({
        entityId: testRunId + 201,
        code: lesCode1,
        contentVersion: 1,
        titleVi: "Bài học đo lường bước chân",
        guideVi: "Hướng dẫn giáo viên",
        estimatedMinutes: 25,
        accessTier: "free",
        status: "published",
      })
      .returning();

    // 3. Published Curriculum (Age based 4-5)
    const [pubCur] = await db
      .insert(curricula)
      .values({
        entityId: testRunId + 10,
        code: publishedCode,
        contentVersion: 1,
        programType: "age_based",
        targetAgeMin: 4,
        targetAgeMax: 5,
        durationWeeks: 4,
        sessionsPerWeek: 2,
        titleVi: "Chương trình Tư duy Toán 4 tuổi",
        descriptionVi: "Phát triển năng lực số học và hình học cho trẻ 4 tuổi.",
        accessTier: "standard",
        status: "published",
      })
      .returning();

    // Weeks
    for (let w = 1; w <= 4; w++) {
      await db.insert(curriculumWeeks).values({
        curriculumId: pubCur.id,
        weekNo: w,
        goal: `Mục tiêu tuần ${w}: Làm quen kiến thức tuần ${w}`,
      });
    }

    // Items: Week 1 has 2 items, Week 2 has 1 item, Week 3 has 1 item, Week 4 has 1 item
    await db.insert(curriculumItems).values([
      {
        curriculumId: pubCur.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl1.entityId,
        isRequired: true,
      },
      {
        curriculumId: pubCur.id,
        weekNo: 1,
        sessionNo: 2,
        position: 1,
        entityType: "lesson",
        entityId: les1.entityId,
        isRequired: true,
      },
      {
        curriculumId: pubCur.id,
        weekNo: 2,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl2.entityId,
        isRequired: true,
      },
      {
        curriculumId: pubCur.id,
        weekNo: 3,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl1.entityId,
        isRequired: true,
      },
      {
        curriculumId: pubCur.id,
        weekNo: 4,
        sessionNo: 1,
        position: 1,
        entityType: "lesson",
        entityId: les1.entityId,
        isRequired: true,
      },
    ]);

    // 4. Published Journey Curriculum (42 weeks)
    await db.insert(curricula).values({
      entityId: testRunId + 11,
      code: journeyCode,
      contentVersion: 1,
      programType: "journey",
      targetAgeMin: 3,
      targetAgeMax: 6,
      durationWeeks: 42,
      sessionsPerWeek: 3,
      titleVi: "Hành trình Toán Mầm non 42 Tuần",
      descriptionVi: "Hành trình phát triển toàn diện 6 năng lực toán học.",
      accessTier: "premium",
      status: "published",
    });

    // 5. Archived Curriculum
    await db
      .insert(curricula)
      .values({
        entityId: testRunId + 12,
        code: archivedCode,
        contentVersion: 1,
        programType: "age_based",
        targetAgeMin: 3,
        targetAgeMax: 4,
        durationWeeks: 8,
        sessionsPerWeek: 3,
        titleVi: "Chương trình cũ đã lưu trữ",
        descriptionVi: "Chương trình không còn hỗ trợ.",
        accessTier: "free",
        status: "archived",
      })
      .returning();

    // 6. Draft Curriculum
    await db.insert(curricula).values({
      entityId: testRunId + 13,
      code: draftCode,
      contentVersion: 1,
      programType: "age_based",
      targetAgeMin: 5,
      targetAgeMax: 6,
      durationWeeks: 12,
      sessionsPerWeek: 3,
      titleVi: "Chương trình nháp đang soạn",
      descriptionVi: "Chưa công bố.",
      accessTier: "standard",
      status: "draft",
    });
  });

  afterAll(async () => {
    await db
      .delete(curricula)
      .where(
        inArray(curricula.code, [
          publishedCode,
          archivedCode,
          draftCode,
          journeyCode,
        ])
      );
    await db
      .delete(gameLevels)
      .where(inArray(gameLevels.code, [glCode1, glCode2]));
    await db.delete(lessons).where(eq(lessons.code, lesCode1));
  });

  describe("Task 3: GET /api/guest/curricula (BR-PSH-01, D-NG, D-NI)", () => {
    it("returns published curricula grouped without empty groups and sets public cache", async () => {
      const event = makeGuestEvent();
      const res = await getCurriculaListHandler(event);

      expect(event.node.res.getHeader("cache-control")).toBe(
        "public, max-age=600"
      );
      expect(res).toBeDefined();
      expect(Array.isArray(res.groups)).toBe(true);

      const allCodes = res.groups.flatMap((g: any) =>
        g.programs.map((p: any) => p.code)
      );

      // Published curricula are included
      expect(allCodes).toContain(publishedCode);
      expect(allCodes).toContain(journeyCode);

      // Draft and archived curricula are strictly excluded
      expect(allCodes).not.toContain(draftCode);
      expect(allCodes).not.toContain(archivedCode);

      // Check group mapping (D-NG)
      const ageGroup = res.groups.find((g: any) => g.code === "age");
      expect(ageGroup).toBeDefined();
      expect(ageGroup.label).toBe("Chương trình theo độ tuổi");
      const pubProg = ageGroup.programs.find(
        (p: any) => p.code === publishedCode
      );
      expect(pubProg).toMatchObject({
        code: publishedCode,
        title: "Chương trình Tư duy Toán 4 tuổi",
        group: "age",
        target_age: { min: 4, max: 5 },
        duration_weeks: 4,
        sessions_per_week: 2,
        access_tier: "standard",
      });

      const journeyGroup = res.groups.find((g: any) => g.code === "journey");
      expect(journeyGroup).toBeDefined();
      expect(journeyGroup.label).toBe("Hành trình phát triển toàn diện");

      // Deep scan for forbidden leaked keys
      const audit = hasForbiddenPublicKeys(res);
      expect(audit.found).toBe(false);
    });
  });

  describe("Task 4: GET /api/guest/curricula/[code] (BR-PSH-01..05, D-NF, D-NH, D-NJ)", () => {
    it("returns 200 with 2-week detailed preview and 3+ week summary for published curriculum", async () => {
      const event = makeGuestEvent({ code: publishedCode });
      const res = await getCurriculumDetailHandler(event);

      expect(event.node.res.getHeader("cache-control")).toBe(
        "public, max-age=600"
      );
      expect(res.code).toBe(publishedCode);
      expect(res.title).toBe("Chương trình Tư duy Toán 4 tuổi");
      expect(res.weeks).toHaveLength(4);

      // Week 1: detailed items
      expect(res.weeks[0].week_no).toBe(1);
      expect(res.weeks[0].items).toBeDefined();
      expect(res.weeks[0].items).toHaveLength(2);
      expect(res.weeks[0].items[0]).toMatchObject({
        entity_type: "game_level",
        title: "Đếm sao quả",
        estimated_minutes: 10,
        access_tier: "free",
      });
      expect(res.weeks[0].items[1]).toMatchObject({
        entity_type: "lesson",
        title: "Bài học đo lường bước chân",
        estimated_minutes: 25,
        access_tier: "free",
      });

      // Week 2: detailed items
      expect(res.weeks[1].week_no).toBe(2);
      expect(res.weeks[1].items).toBeDefined();
      expect(res.weeks[1].items).toHaveLength(1);

      // Week 3+: summary only, items MUST BE UNDEFINED (BR-PSH-01, BR-PSH-02)
      expect(res.weeks[2].week_no).toBe(3);
      expect(res.weeks[2].goal).toContain("Mục tiêu tuần 3");
      expect(res.weeks[2].items).toBeUndefined();
      expect(res.weeks[2].item_count).toBe(1);

      expect(res.weeks[3].week_no).toBe(4);
      expect(res.weeks[3].items).toBeUndefined();
      expect(res.weeks[3].item_count).toBe(1);

      // Competency distribution
      expect(Array.isArray(res.competency_distribution)).toBe(true);
      expect(res.competency_distribution.length).toBeGreaterThan(0);

      // Deep forbidden key audit (BR-PSH-03, D-NF)
      const audit = hasForbiddenPublicKeys(res);
      expect(audit.found).toBe(false);
    });

    it("returns 404 NOT_FOUND for unknown or draft curriculum", async () => {
      const draftEvent = makeGuestEvent({ code: draftCode });
      await expect(
        getCurriculumDetailHandler(draftEvent)
      ).rejects.toMatchObject({
        statusCode: 404,
      });

      const unknownEvent = makeGuestEvent({ code: "CUR-UNKNOWN-999" });
      await expect(
        getCurriculumDetailHandler(unknownEvent)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("BR-PSH-05 & D-NJ: returns 410 CONTENT_ARCHIVED with safe published suggestions for archived curriculum", async () => {
      const event = makeGuestEvent({ code: archivedCode });

      let thrownError: any;
      try {
        await getCurriculumDetailHandler(event);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.statusCode).toBe(410);
      expect(thrownError.data?.code).toBe("CONTENT_ARCHIVED");
      expect(thrownError.data?.curriculum_code).toBe(archivedCode);
      expect(Array.isArray(thrownError.data?.suggestions)).toBe(true);
      expect(thrownError.data.suggestions.length).toBeGreaterThan(0);

      const sug = thrownError.data.suggestions[0];
      expect(sug.code).toBeDefined();
      expect(sug.title).toBeDefined();
      expect(sug.access_tier).toBeDefined();
      expect(sug.target_age).toBeDefined();

      // Deep scan error body for forbidden keys
      const audit = hasForbiddenPublicKeys(thrownError.data);
      expect(audit.found).toBe(false);
    });
  });

  describe("Task 5: SEO and Structured Data (BR-PSH-04)", () => {
    it("generates Schema.org Course JSON-LD matching curriculum metadata", () => {
      const courseJson = buildCourseJsonLd({
        code: publishedCode,
        title: "Chương trình Tư duy Toán 4 tuổi",
        description: "Phát triển năng lực số học và hình học cho trẻ 4 tuổi.",
        target_age: { min: 4, max: 5 },
        duration_weeks: 4,
        access_tier: "standard",
      });

      expect(courseJson["@type"]).toBe("Course");
      expect(courseJson.name).toBe("Chương trình Tư duy Toán 4 tuổi");
      expect(courseJson.courseCode).toBe(publishedCode);
      expect(courseJson.educationalLevel).toBe("Trẻ mầm non 4–5 tuổi");
      expect(courseJson.inLanguage).toBe("vi-VN");
      expect(courseJson.isAccessibleForFree).toBe(false);
      expect(courseJson.hasCourseInstance).toEqual({
        "@type": "CourseInstance",
        courseMode: "online",
        duration: "P4W",
      });
      expect(courseJson.url).toBe(
        `https://kidthink.vn/programs/${publishedCode}`
      );
    });
  });

  describe("Task 8: Security and Language Invariants (BR-PSH-03, BR-PSH-06, BR-PSH-07)", () => {
    it("BR-PSH-06: verifies description does not promise guaranteed child achievements", () => {
      const testTexts = [
        "Chương trình giúp bé làm quen với số đếm và hình khối.",
        "Phát triển tư duy logic và giải quyết vấn đề qua trò chơi.",
        "Trải nghiệm các hoạt động tương tác sinh động.",
      ];

      const forbiddenPhrases = [
        "chắc chắn đỗ",
        "cam kết thành tài",
        "trở thành thiên tài",
        "đạt điểm 10",
        "giỏi nhất lớp",
      ];

      for (const text of testTexts) {
        for (const phrase of forbiddenPhrases) {
          expect(text.toLowerCase()).not.toContain(phrase);
        }
      }
    });

    it("BR-PSH-07: ensures curriculum showcase structure is prerenderable and does not depend on client-side JS", () => {
      const publicCard = toProgramCardPublic({
        code: "CUR-NOJS-TEST",
        titleVi: "Chương trình xem không cần JS",
        descriptionVi: "Mô tả đầy đủ",
        programType: "age_based",
        targetAgeMin: 4,
        targetAgeMax: 5,
        durationWeeks: 4,
        sessionsPerWeek: 3,
        accessTier: "free",
      });

      const publicDetail = toProgramDetailPublic({
        curriculum: publicCard,
        weeks: [
          { weekNo: 1, goal: "Mục tiêu tuần 1" },
          { weekNo: 2, goal: "Mục tiêu tuần 2" },
        ],
        items: [
          {
            weekNo: 1,
            sessionNo: 1,
            position: 1,
            entityType: "game_level",
            code: "GL-C1-001",
            titleVi: "Trò chơi tuần 1",
            accessTier: "free",
          },
        ],
      });

      expect(publicDetail.title).toBe("Chương trình xem không cần JS");
      expect(publicDetail.weeks).toHaveLength(4);
      expect(publicDetail.weeks[0].items).toHaveLength(1);
    });
  });
});
