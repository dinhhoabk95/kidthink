import {
  calculateActivityAgeBand,
  validateActivityModel,
  validateLessonModel,
} from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  activities,
  getOwnerDb,
  lessons,
  runEightGates,
  skills,
} from "../../src/index.js";
import { ALL_SEED_ACTIVITIES } from "../../src/seed-content/activities/index.js";
import { ALL_SEED_LESSONS } from "../../src/seed-content/lessons/index.js";
import { executeSeedBatch } from "../../src/seed-content/service.js";
import { seedContentTags } from "../../src/seed-master/content-tags.js";
import { seedTaxonomyMasterData } from "../../src/seed-master/taxonomy/index.js";

describe("P3.1 Lesson & Activity Model & Seeder Tests", () => {
  describe("BR-ACM-01 to BR-ACM-08: Activity Model Rules", () => {
    it("BR-ACM-01: Validates activity code pattern ACT-xxxx", () => {
      const invalidCodeRes = validateActivityModel({
        code: "INVALID-CODE",
        activity_kind: "manipulative",
        title: "Đếm hạt đậu",
        instruction: {
          preparation: "Chuẩn bị cốc",
          steps: [{ instruction: "Đặt cốc", say_to_child: '"Con hãy đếm"' }],
          easier: "Làm ít hơn",
          harder: "Làm nhiều hơn",
        },
        materials: "Cốc nhựa, hạt đậu",
        estimated_minutes: 10,
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      });
      expect(invalidCodeRes.valid).toBe(false);
      expect(invalidCodeRes.errors).toContain(
        "BR-ACM-01: Mã activity phải có định dạng ACT-xxxx (4 chữ số)."
      );
    });

    it("BR-ACM-02: Validates 10 approved activity kinds", () => {
      const invalidKindRes = validateActivityModel({
        code: "ACT-0001",
        activity_kind: "unapproved_kind" as any,
        title: "Đếm hạt đậu",
        instruction: {
          preparation: "Chuẩn bị cốc",
          steps: [{ instruction: "Đặt cốc", say_to_child: '"Con hãy đếm"' }],
          easier: "Làm ít hơn",
          harder: "Làm nhiều hơn",
        },
        materials: "Cốc nhựa, hạt đậu",
        estimated_minutes: 10,
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      });
      expect(invalidKindRes.valid).toBe(false);
      expect(invalidKindRes.errors.some((e) => e.includes("BR-ACM-02"))).toBe(
        true
      );
    });

    it("BR-ACM-03: Requires 4-part instruction and direct spoken quotes in steps", () => {
      const missingPartsRes = validateActivityModel({
        code: "ACT-0001",
        activity_kind: "manipulative",
        title: "Đếm hạt đậu",
        instruction: {
          preparation: "",
          steps: [
            { instruction: "Đặt cốc mà không có lời nói", say_to_child: "" },
          ],
          easier: "",
          harder: "",
        },
        materials: "Cốc nhựa, hạt đậu",
        estimated_minutes: 10,
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      });
      expect(missingPartsRes.valid).toBe(false);
      expect(missingPartsRes.errors.some((e) => e.includes("BR-ACM-03"))).toBe(
        true
      );
    });

    it("BR-ACM-04: Enforces estimated_minutes in [2, 20]", () => {
      const tooShort = validateActivityModel({
        code: "ACT-0001",
        activity_kind: "manipulative",
        title: "Đếm hạt đậu",
        instruction: {
          preparation: "Chuẩn bị cốc",
          steps: [{ instruction: "Đặt cốc", say_to_child: '"Con đếm"' }],
          easier: "Dễ hơn",
          harder: "Khó hơn",
        },
        materials: "Cốc nhựa",
        estimated_minutes: 1,
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      });
      expect(tooShort.valid).toBe(false);
      expect(tooShort.errors.some((e) => e.includes("BR-ACM-04"))).toBe(true);

      const tooLong = validateActivityModel({
        code: "ACT-0001",
        activity_kind: "manipulative",
        title: "Đếm hạt đậu",
        instruction: {
          preparation: "Chuẩn bị cốc",
          steps: [{ instruction: "Đặt cốc", say_to_child: '"Con đếm"' }],
          easier: "Dễ hơn",
          harder: "Khó hơn",
        },
        materials: "Cốc nhựa",
        estimated_minutes: 25,
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      });
      expect(tooLong.valid).toBe(false);
      expect(tooLong.errors.some((e) => e.includes("BR-ACM-04"))).toBe(true);
    });

    it("BR-ACM-05 & D-LC: Calculates age band as skill intersection", () => {
      const ageRes = calculateActivityAgeBand([
        { age_min: 3, age_max: 5 },
        { age_min: 4, age_max: 6 },
      ]);
      expect(ageRes).toEqual({
        target_age_min: 4,
        target_age_max: 5,
        valid: true,
      });

      const disjointRes = calculateActivityAgeBand([
        { age_min: 3, age_max: 4 },
        { age_min: 5, age_max: 6 },
      ]);
      expect(disjointRes.valid).toBe(false);
    });

    it("BR-ACM-07: Blacklists hazardous materials and items < 3cm for age 3-4", () => {
      const sharpHazard = validateActivityModel({
        code: "ACT-0001",
        activity_kind: "manipulative",
        title: "Cắt giấy",
        instruction: {
          preparation: "Dùng dao nhọn và kéo sắc",
          steps: [{ instruction: "Cắt", say_to_child: '"Con làm"' }],
          easier: "Dễ",
          harder: "Khó",
        },
        materials: "dao nhọn, kéo sắc",
        estimated_minutes: 10,
        skills: [{ code: "C1.CNT.01", age_min: 4, age_max: 5 }],
      });
      expect(sharpHazard.valid).toBe(false);
      expect(sharpHazard.errors.some((e) => e.includes("BR-ACM-07"))).toBe(
        true
      );

      const chokeHazardForAge3 = validateActivityModel({
        code: "ACT-0001",
        activity_kind: "manipulative",
        title: "Xâu hạt nhỏ",
        instruction: {
          preparation: "Hạt cườm nhỏ",
          steps: [{ instruction: "Xâu", say_to_child: '"Con xâu"' }],
          easier: "Dễ",
          harder: "Khó",
        },
        materials: "Hạt cườm nhỏ đường kính < 3cm",
        estimated_minutes: 10,
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      });
      expect(chokeHazardForAge3.valid).toBe(false);
      expect(
        chokeHazardForAge3.errors.some((e) => e.includes("BR-ACM-07"))
      ).toBe(true);
    });
  });

  describe("BR-LSM-01 to BR-LSM-09: Lesson Model Rules", () => {
    it("BR-LSM-01: Validates lesson code pattern LES-xxxx", () => {
      const invalidCodeRes = validateLessonModel({
        code: "LESSON-01",
        title: "Bài học đếm",
        guide: {
          outcome: "Bé đếm đúng",
          preparation: ["Cốc"],
          opening: "Cùng chơi",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
        estimated_minutes: 20,
        assessment: "Bé đếm đúng",
        materials: "Cốc",
        activity_kinds: ["manipulative"],
      });
      expect(invalidCodeRes.valid).toBe(false);
      expect(invalidCodeRes.errors).toContain(
        "BR-LSM-01: Mã lesson phải có định dạng LES-xxxx (4 chữ số)."
      );
    });

    it("BR-LSM-02 & BR-LSM-03: Requires 5-part guide and estimated_minutes in [5, 45]", () => {
      const missingGuidePart = validateLessonModel({
        code: "LES-0001",
        title: "Bài học đếm",
        guide: {
          outcome: "Bé đếm đúng",
          preparation: [],
          opening: "",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
        estimated_minutes: 20,
        assessment: "Bé đếm đúng",
        materials: "Cốc",
        activity_kinds: ["manipulative"],
      });
      expect(missingGuidePart.valid).toBe(false);
      expect(missingGuidePart.errors.some((e) => e.includes("BR-LSM-02"))).toBe(
        true
      );

      const invalidDuration = validateLessonModel({
        code: "LES-0001",
        title: "Bài học đếm",
        guide: {
          outcome: "Bé đếm đúng",
          preparation: ["Cốc"],
          opening: "Mở đầu",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
        estimated_minutes: 50,
        assessment: "Bé đếm đúng",
        materials: "Cốc",
        activity_kinds: ["manipulative"],
      });
      expect(invalidDuration.valid).toBe(false);
      expect(invalidDuration.errors.some((e) => e.includes("BR-LSM-03"))).toBe(
        true
      );
    });

    it("BR-LSM-06: Forbids abstract non-observable assessment verbs and requires action verbs", () => {
      const abstractAssessment = validateLessonModel({
        code: "LES-0001",
        title: "Bài học đếm",
        guide: {
          outcome: "Bé đếm đúng",
          preparation: ["Cốc"],
          opening: "Mở đầu",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
        estimated_minutes: 20,
        assessment: "Bé hiểu và nắm được bản chất của số lượng",
        materials: "Cốc",
        activity_kinds: ["manipulative"],
      });
      expect(abstractAssessment.valid).toBe(false);
      expect(
        abstractAssessment.errors.some((e) => e.includes("BR-LSM-06"))
      ).toBe(true);

      const observableAssessment = validateLessonModel({
        code: "LES-0001",
        title: "Bài học đếm",
        guide: {
          outcome: "Bé đếm đúng",
          preparation: ["Cốc"],
          opening: "Mở đầu",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
        estimated_minutes: 20,
        assessment:
          "Bé chỉ đúng và nói được số lượng hạt trong cốc khi được hỏi 3 lần.",
        materials: "Cốc",
        activity_kinds: ["manipulative"],
      });
      expect(observableAssessment.valid).toBe(true);
    });

    it("BR-LSM-08: Requires at least one off-screen activity in lesson", () => {
      const digitalOnly = validateLessonModel({
        code: "LES-0001",
        title: "Bài học đếm",
        guide: {
          outcome: "Bé đếm đúng",
          preparation: ["Cốc"],
          opening: "Mở đầu",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
        estimated_minutes: 20,
        assessment: "Bé chỉ đúng và xếp đúng hạt đậu.",
        materials: "Cốc",
        activity_kinds: ["digital_game"],
      });
      expect(digitalOnly.valid).toBe(false);
      expect(digitalOnly.errors.some((e) => e.includes("BR-LSM-08"))).toBe(
        true
      );
    });
  });

  describe("Seed Content Library Validation: Activities & Lessons", () => {
    it("All seed activities pass 8 gates and validation rules cleanly", () => {
      expect(ALL_SEED_ACTIVITIES.length).toBeGreaterThanOrEqual(60);
      const existingCodes = new Set<string>();
      for (const act of ALL_SEED_ACTIVITIES) {
        const gates = runEightGates(act, existingCodes);
        existingCodes.add(act.header.code);
        const failed = gates.filter((g) => !g.passed);
        expect(failed, `Activity ${act.header.code} failed gates`).toEqual([]);
      }
    });

    it("All seed lessons pass 8 gates and validation rules cleanly", () => {
      expect(ALL_SEED_LESSONS.length).toBeGreaterThanOrEqual(60);
      const existingCodes = new Set<string>();
      for (const les of ALL_SEED_LESSONS) {
        const gates = runEightGates(les, existingCodes);
        existingCodes.add(les.header.code);
        const failed = gates.filter((g) => !g.passed);
        expect(failed, `Lesson ${les.header.code} failed gates`).toEqual([]);
      }
    });

    it("Executes seeder batch cleanly and verifies idempotency in Postgres", async () => {
      const db = getOwnerDb();
      await seedContentTags(db);
      const existingSkill = await db.select().from(skills).limit(1);
      if (existingSkill.length === 0) {
        await seedTaxonomyMasterData(db);
      }
      const batchCode = `TEST-P31-${Date.now()}`;

      // Insert activities and lessons
      const res = await executeSeedBatch(db, {
        batchCode,
        gitSha: "test-sha",
        prUrl: "test-pr",
        seeds: [...ALL_SEED_ACTIVITIES, ...ALL_SEED_LESSONS],
      });

      expect(
        res.rowsInserted + res.rowsSkippedIdempotent
      ).toBeGreaterThanOrEqual(120);

      // Verify records exist in database
      const [act] = await db
        .select()
        .from(activities)
        .where(eq(activities.code, "ACT-0001"));
      expect(act).toBeDefined();
      expect(act.status).toBe("published");
      expect(act.origin).toBe("human");

      const [les] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.code, "LES-0001"));
      expect(les).toBeDefined();
      expect(les.status).toBe("published");
      expect(les.origin).toBe("human");

      // Idempotent re-run
      const totalCount = ALL_SEED_ACTIVITIES.length + ALL_SEED_LESSONS.length;
      const res2 = await executeSeedBatch(db, {
        batchCode: `${batchCode}-RERUN`,
        gitSha: "test-sha",
        prUrl: "test-pr",
        seeds: [...ALL_SEED_ACTIVITIES, ...ALL_SEED_LESSONS],
      });
      expect(res2.rowsSkippedIdempotent).toBe(totalCount);
      expect(res2.rowsInserted).toBe(0);
    }, 30_000);
  });
});
