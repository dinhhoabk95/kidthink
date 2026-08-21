import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { lessons } from "../../src/schema/content.ts";
import {
  evaluateExemplarMatrix,
  type LessonExemplarRecord,
} from "./lesson-exemplar-matrix.ts";

describe("Task #96 — Lesson Exemplar Matrix Library (BR-LEX-07, BR-LEX-08)", () => {
  it("Scenario 1: Evaluates an empty matrix with 18 empty cells", () => {
    const records: LessonExemplarRecord[] = [];
    const res = evaluateExemplarMatrix(records, { isPhase4: false });

    expect(res.totalExemplars).toBe(0);
    expect(res.filledCellsCount).toBe(0);
    expect(res.emptyCells.length).toBe(18);
    expect(res.exceededCells.length).toBe(0);
    expect(res.isValid).toBe(true); // P3 mode is permissive
  });

  it("Scenario 2: Correctly maps published exemplar lessons into matrix cells", () => {
    const records: LessonExemplarRecord[] = [
      {
        id: 1,
        code: "LES-0001",
        title: "Lesson 1",
        competency: "C1",
        ageBand: "3-4",
        isExemplar: true,
        status: "published",
      },
      {
        id: 2,
        code: "LES-0002",
        title: "Lesson 2",
        competency: "C1",
        ageBand: "3-4",
        isExemplar: true,
        status: "published",
      },
      {
        id: 3,
        code: "LES-0003",
        title: "Lesson 3",
        competency: "C2",
        ageBand: "5-6",
        isExemplar: true,
        status: "published",
      },
      {
        id: 4,
        code: "LES-0004",
        title: "Draft Lesson",
        competency: "C3",
        ageBand: "4-5",
        isExemplar: true,
        status: "draft", // Should NOT be counted
      },
    ];

    const res = evaluateExemplarMatrix(records, { isPhase4: false });

    expect(res.totalExemplars).toBe(3);
    expect(res.matrix.C1["3-4"]).toBe(2);
    expect(res.matrix.C2["5-6"]).toBe(1);
    expect(res.matrix.C3["4-5"]).toBe(0);
    expect(res.filledCellsCount).toBe(2);
    expect(res.emptyCells.length).toBe(16);
  });

  it("Scenario 3 & BR-LEX-08: Rejects when a cell exceeds ceiling of 2 exemplars", () => {
    const records: LessonExemplarRecord[] = [
      {
        id: 1,
        code: "LES-0001",
        title: "Lesson 1",
        competency: "C1",
        ageBand: "3-4",
        isExemplar: true,
        status: "published",
      },
      {
        id: 2,
        code: "LES-0002",
        title: "Lesson 2",
        competency: "C1",
        ageBand: "3-4",
        isExemplar: true,
        status: "published",
      },
      {
        id: 3,
        code: "LES-0003",
        title: "Lesson 3",
        competency: "C1",
        ageBand: "3-4",
        isExemplar: true,
        status: "published",
      },
    ];

    const res = evaluateExemplarMatrix(records);

    expect(res.isValid).toBe(false);
    expect(res.exceededCells.length).toBe(1);
    expect(res.exceededCells[0]?.competency).toBe("C1");
    expect(res.exceededCells[0]?.ageBand).toBe("3-4");
    expect(res.exceededCells[0]?.count).toBe(3);
    expect(res.violations[0]).toContain("[BR-LEX-08]");
  });

  it("Scenario 4 & BR-LEX-07: In Phase 4 mode, rejects if any cell is empty", () => {
    const records: LessonExemplarRecord[] = [];
    const res = evaluateExemplarMatrix(records, { isPhase4: true });

    expect(res.isValid).toBe(false);
    expect(res.violations.length).toBe(18);
    expect(res.violations[0]).toContain("[BR-LEX-07]");
  });
});

describe("Ma trận tiết học mẫu trên DB thật (BR-LEX-07, BR-LEX-08)", () => {
  it("mọi ô trong ma trận 6 competency × 3 band đạt sàn và không vượt trần", async () => {
    const db = getOwnerDb();

    const rows = await db
      .select({
        id: lessons.id,
        code: lessons.code,
        title: lessons.title,
        competency: lessons.exemplarCompetency,
        ageBand: lessons.exemplarAgeBand,
        isExemplar: lessons.isExemplar,
        status: lessons.status,
      })
      .from(lessons)
      .where(eq(lessons.isExemplar, true));

    const result = evaluateExemplarMatrix(
      rows.map((row) => ({
        id: Number(row.id),
        code: row.code,
        title: row.title,
        competency: row.competency,
        ageBand: row.ageBand,
        isExemplar: Boolean(row.isExemplar),
        status: row.status,
      })),
      { isPhase4: false }
    );

    expect(result.violations).toEqual([]);
  });
});
