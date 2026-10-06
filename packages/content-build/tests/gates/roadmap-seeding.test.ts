import { ALL_ROADMAPS, RM_3_4_MAM_01 } from "@mindkid/content";
import { NEXT_CURRICULUM_SUGGESTION_CODE } from "@mindkid/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runRoadmapBalanceGate } from "#src/cli/check-roadmap-balance";
import { runSeedMasterScan } from "#src/cli/check-seed-master";
import { loadContentDemandLedger } from "#src/gates/content-demand-file";
import { BAND_AGES } from "#src/gates/roadmap-seed-gate";
import {
  formatSeedMasterViolation,
  scanSeedMaster,
} from "#src/gates/seed-master-scan";
import {
  type CurriculumItemPlan,
  curriculumCodeForRoadmap,
  findStaleItemIds,
  planCurriculumItems,
  ROADMAP_CURRICULA_CONFIGS,
  resolveCurriculumItems,
} from "#src/seed-master/roadmap-curricula";

const calls: string[] = [];

vi.mock("@mindkid/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mindkid/db")>()),
  getOwnerDb: vi.fn(() => {
    calls.push("db");
    return {};
  }),
}));
vi.mock("#src/seed-master/taxonomy/index", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#src/seed-master/taxonomy/index")>()),
  seedTaxonomyMasterData: vi.fn(() => {
    calls.push("taxonomy");
    return Promise.resolve({
      competencyCount: 0,
      strandCount: 0,
      skillCount: 0,
      loCount: 0,
      datasetCount: 0,
    });
  }),
}));
vi.mock("#src/seed-master/content-tags", () => ({
  seedContentTags: vi.fn(() => {
    calls.push("tags");
    return Promise.resolve();
  }),
}));
vi.mock("#src/seed-master/action-suggestions", () => ({
  seedSkillActionSuggestions: vi.fn(() => {
    calls.push("actions");
    return Promise.resolve({ seededCount: 0 });
  }),
}));
vi.mock("#src/seed-master/curricula", () => ({
  seedRoadmapCurricula: vi.fn(() => {
    calls.push("roadmaps");
    return Promise.resolve({ curriculaCount: 0, weeksCount: 0 });
  }),
  seedCurriculumItems: vi.fn(() => {
    calls.push("items");
    return Promise.resolve({ itemsCount: 0 });
  }),
}));
vi.mock("#src/cli/seed-content", () => ({
  runSeedContent: vi.fn(() => {
    calls.push("content");
    return Promise.resolve();
  }),
}));

const CURRICULUM_CODE_REGEX = /^CUR-[A-Za-z0-9_-]+$/;

const NO_CONTENT = {
  lesson: new Map<string, number>(),
  game_level: new Map<string, number>(),
};

function plan(overrides: Partial<CurriculumItemPlan> = {}): CurriculumItemPlan {
  return {
    curriculumCode: "CUR-RM-3-4-mam-01",
    weekNo: 1,
    sessionNo: 1,
    position: 1,
    entityType: "lesson",
    contentCode: "LES-A",
    isRequired: true,
    ...overrides,
  };
}

describe("chương trình sinh từ lộ trình", () => {
  it("mỗi lộ trình thành một chương trình khớp khuôn CUR-* của cột code", () => {
    expect(ROADMAP_CURRICULA_CONFIGS).toHaveLength(ALL_ROADMAPS.length);
    expect(ALL_ROADMAPS).toHaveLength(3);
    for (const roadmap of ALL_ROADMAPS) {
      const config = ROADMAP_CURRICULA_CONFIGS.find(
        (c) => c.code === curriculumCodeForRoadmap(roadmap.code)
      );
      const [ageMin, ageMax] = BAND_AGES[roadmap.band];
      expect(config?.code).toMatch(CURRICULUM_CODE_REGEX);
      expect(config?.durationWeeks).toBe(roadmap.duration_weeks);
      expect(config?.sessionsPerWeek).toBe(roadmap.sessions_per_week);
      expect(config?.targetAgeMin).toBe(ageMin);
      expect(config?.targetAgeMax).toBe(ageMax);
      expect(config?.weekGoals).toEqual(roadmap.weeks.map((w) => w.goal));
    }
    expect(curriculumCodeForRoadmap(RM_3_4_MAM_01.code)).toBe(
      "CUR-RM-3-4-mam-01"
    );
  });

  it("ba band có ba chuỗi kỹ năng khác nhau, không dùng chung một kịch bản", () => {
    const sequences = ALL_ROADMAPS.map((roadmap) =>
      roadmap.weeks
        .flatMap((w) => w.sessions.map((s) => s.skill_code))
        .join(",")
    );
    expect(new Set(sequences).size).toBe(ALL_ROADMAPS.length);
  });

  it("không còn chương trình cũ CUR-BE3..J42", () => {
    const codes = ROADMAP_CURRICULA_CONFIGS.map((c) => c.code);
    for (const legacy of [
      "CUR-BE3",
      "CUR-BE4",
      "CUR-BE5",
      "CUR-BE6",
      "CUR-J42",
    ]) {
      expect(codes).not.toContain(legacy);
    }
  });

  it("mã gợi ý chương trình kế tiếp của API là một chương trình có thật", () => {
    const codes = ROADMAP_CURRICULA_CONFIGS.map((c) => c.code);
    expect(codes).toContain(NEXT_CURRICULUM_SUGGESTION_CODE);
  });
});

describe("curriculum_items sinh thẳng từ sổ cầu", () => {
  const ledger = loadContentDemandLedger();
  const items = planCurriculumItems(ledger);

  it("mỗi item truy ngược được về một ô của sổ cầu", () => {
    const filledCount = ledger.cells.reduce(
      (sum, cell) => sum + cell.filled_by.length,
      0
    );
    expect(items).toHaveLength(filledCount);
    const filled = new Set(ledger.cells.flatMap((cell) => cell.filled_by));
    for (const item of items) {
      expect(filled.has(item.contentCode)).toBe(true);
    }
  });

  it("mỗi chương trình chỉ nhận item từ ô của lộ trình mình", () => {
    for (const roadmap of ALL_ROADMAPS) {
      const code = curriculumCodeForRoadmap(roadmap.code);
      const expected = ledger.cells
        .filter((cell) => cell.roadmap_code === roadmap.code)
        .reduce((sum, cell) => sum + cell.filled_by.length, 0);
      expect(items.filter((item) => item.curriculumCode === code)).toHaveLength(
        expected
      );
    }
  });

  it("level thực hành thành game_level, bài học thành lesson, vị trí đếm từ 1", () => {
    for (const cell of ledger.cells) {
      const own = items.filter(
        (item) =>
          item.curriculumCode === curriculumCodeForRoadmap(cell.roadmap_code) &&
          item.weekNo === cell.week_no &&
          item.sessionNo === cell.session_no
      );
      expect(own.map((item) => item.position)).toEqual(
        cell.filled_by.map((_, index) => index + 1)
      );
      for (const item of own) {
        expect(item.entityType).toBe(
          cell.role === "practice" ? "game_level" : "lesson"
        );
      }
    }
  });

  it("ca âm: ô còn nợ không sinh item", () => {
    const debt = ledger.cells.filter((cell) => cell.filled_by.length === 0);
    expect(debt.length).toBeGreaterThan(0);
    for (const cell of debt) {
      expect(
        items.some(
          (item) =>
            item.curriculumCode ===
              curriculumCodeForRoadmap(cell.roadmap_code) &&
            item.weekNo === cell.week_no &&
            item.sessionNo === cell.session_no
        )
      ).toBe(false);
    }
  });

  it("ca âm: level không có ô sổ cầu không lọt vào curriculum_items", () => {
    const orphan = "GL-ORPHAN-NOT-IN-LEDGER";
    const resolved = resolveCurriculumItems(items, {
      lesson: new Map(
        items
          .filter((item) => item.entityType === "lesson")
          .map((item, index) => [item.contentCode, index + 1])
      ),
      game_level: new Map([
        ...items
          .filter((item) => item.entityType === "game_level")
          .map((item, index): [string, number] => [
            item.contentCode,
            index + 1,
          ]),
        [orphan, 999_999],
      ]),
    });
    expect(resolved.some((item) => item.contentCode === orphan)).toBe(false);
    expect(resolved).toHaveLength(items.length);
  });

  it("ca âm: mã nội dung chưa gieo thì ném lỗi nêu tên, không bỏ qua", () => {
    expect(() =>
      resolveCurriculumItems([plan({ contentCode: "LES-MISSING" })], NO_CONTENT)
    ).toThrow("lesson:LES-MISSING");
  });

  it("item thừa so với sổ cầu bị nhận ra để xoá, item còn dùng thì giữ", () => {
    const wanted = [plan({ position: 1 }), plan({ position: 2 })];
    const stale = findStaleItemIds(
      [
        { id: 1, weekNo: 1, sessionNo: 1, position: 1 },
        { id: 2, weekNo: 1, sessionNo: 1, position: 2 },
        { id: 3, weekNo: 1, sessionNo: 1, position: 3 },
        { id: 4, weekNo: 2, sessionNo: 1, position: 1 },
      ],
      wanted
    );
    expect(stale).toEqual([3, 4]);
  });
});

describe("cổng quét seed-master (BR-LRM-02)", () => {
  const OLD_SEEDER = `
    export function selectCurriculumSlot(params) {
      const slotIdx = weekNo * sessionsPerWeek + sessionNo;
      return lessonsList[slotIdx % lessonsList.length];
    }
    async function insertCurriculumItemForSession(db, params) {
      const rows = await db.select({ id: lessons.id }).from(lessons).orderBy(asc(lessons.id)).limit(100);
      return rows;
    }
  `;

  it("xanh trên cây seed-master hiện tại", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    expect(runSeedMasterScan()).toBe(0);
    log.mockRestore();
  });

  it("ca âm: đưa lại phép gán cũ thì đỏ và nêu tên hàm", () => {
    const violations = scanSeedMaster([
      { path: "seed-master/curricula.ts", source: OLD_SEEDER },
    ]);
    const modulo = violations.find((v) => v.kind === "modulo");
    const limit = violations.find((v) => v.kind === "limit-or-order");
    expect(modulo?.functionName).toBe("selectCurriculumSlot");
    expect(limit?.functionName).toBe("insertCurriculumItemForSession");
    const first = modulo ?? violations[0];
    expect(first).toBeDefined();
    expect(first ? formatSeedMasterViolation(first) : "").toContain(
      "selectCurriculumSlot"
    );
  });

  it("dấu % trong chuỗi và chú thích không bị tính", () => {
    const source = `
      // 100% đúng
      const label = "tỉ lệ 50%";
      /* a % b */
      export function ok() { return label; }
    `;
    expect(scanSeedMaster([{ path: "x.ts", source }])).toEqual([]);
  });

  it("truy vấn bảng khác có LIMIT không bị chặn nhầm", () => {
    const source = `
      export async function find(db) {
        return db.select({ id: curricula.id }).from(curricula).limit(1);
      }
    `;
    expect(scanSeedMaster([{ path: "x.ts", source }])).toEqual([]);
  });
});

describe("seed-all", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("gieo lộ trình trước level, item sau level", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { seedAllContent } = await import("#src/cli/seed-all");
    await seedAllContent({ masterOnly: false });
    log.mockRestore();
    const roadmaps = calls.indexOf("roadmaps");
    const content = calls.indexOf("content");
    const items = calls.indexOf("items");
    expect(roadmaps).toBeGreaterThan(-1);
    expect(roadmaps).toBeLessThan(content);
    expect(content).toBeLessThan(items);
  });

  it("chạy master-only thì gieo lộ trình, không gieo level cũng không gieo item", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { seedAllContent } = await import("#src/cli/seed-all");
    await seedAllContent({ masterOnly: true });
    log.mockRestore();
    expect(calls).toContain("roadmaps");
    expect(calls).not.toContain("content");
    expect(calls).not.toContain("items");
  });

  it("cổng lộ trình xanh trên lộ trình soạn thật", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    expect(runRoadmapBalanceGate()).toBe(0);
    log.mockRestore();
  });
});
