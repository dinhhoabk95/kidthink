import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { RM_3_4_MAM_01, type RoadmapSeed } from "@mindkid/content";
import { describe, expect, it } from "vitest";
import { ALL_SEED_LESSONS, SHIPPABLE_SEED_LEVELS } from "#src/catalog";
import { computeContentDemand } from "#src/cli/derive-demand";
import {
  type DemandInput,
  type DemandLesson,
  type DemandLevel,
  deriveContentDemand,
  findBandMismatches,
  PRACTICE_LEVEL_QUOTA,
  serializeContentDemand,
} from "#src/gates/content-demand";
import { CONTENT_DEMAND_PATH } from "#src/gates/content-demand-file";
import { buildSkillTemplateAffinityMatrix } from "#src/gates/skill-template-affinity";

const DIFFICULTY_MAX = { "3-4": 2, "4-5": 3, "5-6": 5 } as const;
const GEO = "C2.GEO.02";

function lesson(
  code: string,
  skill: string,
  overrides: Partial<DemandLesson> = {}
): DemandLesson {
  return {
    code,
    skill_codes: [skill],
    age_min: 3,
    age_max: 4,
    has_offline_activity: true,
    ...overrides,
  };
}

function level(
  code: string,
  skill: string,
  overrides: Partial<DemandLevel> = {}
): DemandLevel {
  return {
    code,
    skill_codes: [skill],
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    ...overrides,
  };
}

function input(overrides: Partial<DemandInput> = {}): DemandInput {
  return {
    roadmaps: [RM_3_4_MAM_01],
    affinities: { [GEO]: ["GT-001"] },
    lessons: [],
    levels: [],
    difficultyMaxByBand: DIFFICULTY_MAX,
    ...overrides,
  };
}

function cellsOf(
  ledger: ReturnType<typeof deriveContentDemand>,
  skill: string
) {
  return ledger.cells.filter((cell) => cell.skill_code === skill);
}

describe("sổ cầu — suy từ lộ trình", () => {
  it("số ô bằng số tiết của lộ trình", () => {
    const ledger = deriveContentDemand(input());
    const sessions = RM_3_4_MAM_01.weeks.reduce(
      (sum, week) => sum + week.sessions.length,
      0
    );
    expect(ledger.cells).toHaveLength(sessions);
    expect(ledger.summary[0]?.cells).toBe(sessions);
  });

  it("ca âm: sinh lại hai lần trùng từng byte", () => {
    const data = input({
      lessons: [lesson("L-1", GEO)],
      levels: [level("V-1", GEO)],
    });
    const first = serializeContentDemand(deriveContentDemand(data));
    const second = serializeContentDemand(deriveContentDemand(data));
    expect(second).toBe(first);
  });

  it("kết quả không phụ thuộc thứ tự kho đầu vào", () => {
    const lessons = [lesson("L-2", GEO), lesson("L-1", GEO)];
    const levels = [level("V-3", GEO), level("V-1", GEO), level("V-2", GEO)];
    const forward = deriveContentDemand(input({ lessons, levels }));
    const reversed = deriveContentDemand(
      input({ lessons: [...lessons].reverse(), levels: [...levels].reverse() })
    );
    expect(serializeContentDemand(reversed)).toBe(
      serializeContentDemand(forward)
    );
  });

  it("ca âm: sửa một tuần trong lộ trình thì sổ cầu đổi", () => {
    const [first, second, ...rest] = RM_3_4_MAM_01.weeks;
    if (!(first && second)) {
      throw new Error("Lộ trình thiếu tuần");
    }
    const edited: RoadmapSeed = {
      ...RM_3_4_MAM_01,
      weeks: [
        first,
        {
          ...second,
          sessions: second.sessions.map((session) =>
            session.session_no === 2
              ? { ...session, skill_code: "C6.ATT.01" }
              : session
          ),
        },
        ...rest,
      ],
    };
    const before = serializeContentDemand(deriveContentDemand(input()));
    const after = serializeContentDemand(
      deriveContentDemand(input({ roadmaps: [edited] }))
    );
    expect(after).not.toBe(before);
  });

  it("ca âm: nội dung của kỹ năng khác không lấp ô", () => {
    const ledger = deriveContentDemand(
      input({
        lessons: [lesson("L-OTHER", "C6.ATT.01")],
        levels: [level("V-OTHER", "C6.ATT.01")],
      })
    );
    for (const cell of cellsOf(ledger, GEO)) {
      expect(cell.filled_by).toEqual([]);
    }
  });

  it("ca âm: bài học band 5-6 không lấp ô band 3-4", () => {
    const ledger = deriveContentDemand(
      input({
        lessons: [lesson("L-BIG", GEO, { age_min: 5, age_max: 6 })],
        levels: [level("V-BIG", GEO, { age_min: 5, age_max: 6 })],
      })
    );
    expect(ledger.summary[0]?.filled_cells).toBe(0);
  });

  it("ca âm: level vượt trần độ khó của band không lấp ô thực hành", () => {
    const ledger = deriveContentDemand(
      input({ levels: [level("V-HARD", GEO, { difficulty: 3 })] })
    );
    for (const cell of cellsOf(ledger, GEO)) {
      expect(cell.filled_by).toEqual([]);
    }
  });

  it("một nội dung chỉ lấp một ô trong lộ trình", () => {
    const ledger = deriveContentDemand(
      input({
        lessons: [lesson("L-ONLY", GEO)],
        levels: [level("V-A", GEO), level("V-B", GEO)],
      })
    );
    const all = ledger.cells.flatMap((cell) => [...cell.filled_by]);
    expect(new Set(all).size).toBe(all.length);
  });

  it("ô thực hành lấy đủ định mức, dễ trước", () => {
    const ledger = deriveContentDemand(
      input({
        levels: [
          level("V-3", GEO, { difficulty: 2 }),
          level("V-1", GEO, { difficulty: 1 }),
          level("V-2", GEO, { difficulty: 1 }),
          level("V-4", GEO, { difficulty: 2 }),
        ],
      })
    );
    const practice = cellsOf(ledger, GEO).find(
      (cell) => cell.role === "practice"
    );
    expect(practice?.level_quota).toBe(PRACTICE_LEVEL_QUOTA);
    expect(practice?.filled_by).toEqual(["V-1", "V-2", "V-3"]);
  });

  it("ô ngoài màn hình chỉ nhận bài có hoạt động ngoài màn hình", () => {
    const ledger = deriveContentDemand(
      input({
        lessons: [lesson("L-SCREEN", GEO, { has_offline_activity: false })],
      })
    );
    const offscreen = cellsOf(ledger, GEO).filter(
      (cell) => cell.role === "offscreen"
    );
    expect(offscreen.length).toBeGreaterThan(0);
    for (const cell of offscreen) {
      expect(cell.filled_by).toEqual([]);
    }
  });

  it("ca âm: lộ trình khai topics[] thì dừng thay vì nuốt im lặng", () => {
    const [first, ...rest] = RM_3_4_MAM_01.weeks;
    const [firstSession, ...otherSessions] = first?.sessions ?? [];
    if (!(first && firstSession)) {
      throw new Error("Lộ trình rỗng");
    }
    const withTopics: RoadmapSeed = {
      ...RM_3_4_MAM_01,
      weeks: [
        {
          ...first,
          sessions: [{ ...firstSession, topics: ["TP-X"] }, ...otherSessions],
        },
        ...rest,
      ],
    };
    expect(() =>
      deriveContentDemand(input({ roadmaps: [withTopics] }))
    ).toThrow("topics[]");
  });
});

describe("sổ cầu — trên corpus thật", () => {
  const ledger = computeContentDemand();
  const lessonsByCode = new Map(
    ALL_SEED_LESSONS.map((entry) => [entry.header.code, entry.header])
  );
  const levelsByCode = new Map(
    SHIPPABLE_SEED_LEVELS.map((entry) => [entry.header.code, entry.header])
  );

  it("template_codes của mỗi ô đúng bằng ma trận tương hợp của kỹ năng", () => {
    const affinities = buildSkillTemplateAffinityMatrix().affinities;
    for (const cell of ledger.cells) {
      expect(cell.template_codes).toEqual(affinities[cell.skill_code] ?? []);
    }
  });

  it("mọi ô thực hành có ít nhất một khuôn", () => {
    for (const cell of ledger.cells.filter((c) => c.role === "practice")) {
      expect(cell.template_codes.length).toBeGreaterThan(0);
    }
  });

  it("mọi mã lấp ô có thật, đúng kỹ năng và phủ band của ô", () => {
    for (const cell of ledger.cells) {
      for (const code of cell.filled_by) {
        const header =
          cell.role === "practice"
            ? levelsByCode.get(code)
            : lessonsByCode.get(code);
        expect(header, `${code} không có trong kho`).toBeDefined();
        expect(header?.skill_codes).toContain(cell.skill_code);
      }
    }
  });

  it("không ô nào dùng lại nội dung đã lấp ô khác", () => {
    const byRoadmap = new Map<string, string[]>();
    for (const cell of ledger.cells) {
      const list = byRoadmap.get(cell.roadmap_code) ?? [];
      list.push(...cell.filled_by);
      byRoadmap.set(cell.roadmap_code, list);
    }
    for (const [, codes] of byRoadmap) {
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it("content-demand.json đã commit khớp lộ trình và kho hiện tại", () => {
    const committed = fs.readFileSync(repoPath(CONTENT_DEMAND_PATH), "utf8");
    expect(JSON.stringify(JSON.parse(committed))).toBe(JSON.stringify(ledger));
  });
});

describe("sổ cầu — band của nội dung lấp ô (BR-LRM-04)", () => {
  const ledger = computeContentDemand();
  const lessons: DemandLesson[] = ALL_SEED_LESSONS.map((entry) => ({
    code: entry.header.code,
    skill_codes: entry.header.skill_codes,
    age_min: entry.header.target_age_min,
    age_max: entry.header.target_age_max,
    has_offline_activity: true,
  }));
  const levels: DemandLevel[] = SHIPPABLE_SEED_LEVELS.map((entry) => ({
    code: entry.header.code,
    skill_codes: entry.header.skill_codes,
    age_min: entry.header.age_min,
    age_max: entry.header.age_max,
    difficulty: entry.header.difficulty,
  }));

  it("sổ cầu thật không có nội dung lệch band", () => {
    expect(findBandMismatches(ledger, lessons, levels)).toEqual([]);
  });

  it("mỗi lộ trình band có dãy nội dung khác nhau", () => {
    const byRoadmap = new Map<string, string>();
    for (const cell of ledger.cells) {
      const prior = byRoadmap.get(cell.roadmap_code) ?? "";
      byRoadmap.set(cell.roadmap_code, `${prior}|${cell.filled_by.join(",")}`);
    }
    expect(byRoadmap.size).toBe(6);
    expect(new Set(byRoadmap.values()).size).toBe(6);
  });

  it("ca âm: bài band 5-6 đặt vào lộ trình 3-4 thì đỏ và in mã bài", () => {
    const lateLesson = lessons.find(
      (entry) => entry.age_min >= 5 && entry.age_max >= 6
    );
    expect(lateLesson).toBeDefined();
    const [first, ...rest] = ledger.cells;
    if (!(first && lateLesson)) {
      throw new Error("Sổ cầu rỗng hoặc thiếu bài band 5-6");
    }
    expect(first.band).toBe("3-4");
    const broken = {
      ...ledger,
      cells: [{ ...first, filled_by: [lateLesson.code] }, ...rest],
    };
    const mismatches = findBandMismatches(broken, lessons, levels);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]?.content_code).toBe(lateLesson.code);
    expect(mismatches[0]?.reason).toBe("band_not_covered");
  });

  it("ca âm: mã không có trong kho thì đỏ", () => {
    const [first, ...rest] = ledger.cells;
    if (!first) {
      throw new Error("Sổ cầu rỗng");
    }
    const broken = {
      ...ledger,
      cells: [{ ...first, filled_by: ["LES-NOT-IN-STORE"] }, ...rest],
    };
    expect(findBandMismatches(broken, lessons, levels)[0]?.reason).toBe(
      "unknown_content"
    );
  });
});
