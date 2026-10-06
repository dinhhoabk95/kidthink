import {
  RM_3_4_MAM_01,
  RM_4_5_CHI_01,
  RM_5_6_LA_01,
  type RoadmapSeed,
} from "@mindkid/content";
import { describe, expect, it } from "vitest";
import { evaluateRoadmapSeeds } from "#src/gates/roadmap-seed-gate";
import {
  buildRoadmapSkillMap,
  evaluateAuthoredRoadmaps,
} from "#src/gates/roadmap-seed-runner";

const DIFFICULTY_MAX = { "3-4": 2, "4-5": 3, "5-6": 5 } as const;
const SKILLS = buildRoadmapSkillMap();

function measure(roadmap: RoadmapSeed) {
  const [row] = evaluateRoadmapSeeds({
    roadmaps: [roadmap],
    skills: SKILLS,
    difficultyMaxByBand: DIFFICULTY_MAX,
  });
  if (!row) {
    throw new Error("Không có hàng đo");
  }
  return row;
}

function messages(roadmap: RoadmapSeed): string[] {
  return measure(roadmap).violations.map((v) => v.message);
}

function replaceSkill(
  roadmap: RoadmapSeed,
  from: string,
  to: string
): RoadmapSeed {
  return {
    ...roadmap,
    weeks: roadmap.weeks.map((week) => ({
      ...week,
      target_skills: week.target_skills.map((code) =>
        code === from ? to : code
      ),
      sessions: week.sessions.map((s) =>
        s.skill_code === from ? { ...s, skill_code: to } : s
      ),
    })),
  };
}

describe("cổng lộ trình soạn", () => {
  it("RM-3-4-mam-01 xanh", () => {
    const row = measure(RM_3_4_MAM_01);
    expect(row.violations).toEqual([]);
    expect(row.passed).toBe(true);
    expect(row.competencies_covered).toBe(6);
    expect(row.max_share).toBeLessThanOrEqual(0.4);
    expect(row.late_new_skills).toBe(0);
  });

  it.each([
    ["RM-4-5-chi-01", RM_4_5_CHI_01],
    ["RM-5-6-la-01", RM_5_6_LA_01],
  ])("%s xanh, phủ 6/6 competency", (_code, roadmap) => {
    const row = measure(roadmap);
    expect(row.violations).toEqual([]);
    expect(row.competencies_covered).toBe(6);
    expect(row.max_share).toBeLessThanOrEqual(0.4);
    expect(row.late_new_skills).toBe(0);
  });

  it("runner đo mọi lộ trình đã khai và chúng đều xanh", () => {
    const rows = evaluateAuthoredRoadmaps();
    expect(rows.map((row) => row.program_code)).toEqual([
      "RM-3-4-mam-01",
      "RM-4-5-chi-01",
      "RM-5-6-la-01",
    ]);
    expect(rows.filter((row) => !row.passed)).toEqual([]);
  });

  it("BR-LRM-11: prerequisite dưới band được miễn khỏi lộ trình", () => {
    const prerequisite = SKILLS.get("C3.SRT.01");
    expect(prerequisite?.age_max).toBeLessThan(4);
    expect(SKILLS.get("C3.SRT.02")?.prerequisites).toContain("C3.SRT.01");
    const row = measure(RM_4_5_CHI_01);
    expect(row.violations.some((v) => v.rule_id === "BR-CRM-01")).toBe(false);
  });

  it("ca âm: prerequisite nằm trong band mà thiếu thì đỏ BR-CRM-01", () => {
    const prerequisite = SKILLS.get("C3.RULE.01");
    expect(prerequisite?.age_max).toBeGreaterThanOrEqual(4);
    const row = measure(replaceSkill(RM_4_5_CHI_01, "C6.INH.01", "C3.RULE.02"));
    expect(
      row.violations.some(
        (v) => v.rule_id === "BR-CRM-01" && v.message.includes("C3.RULE.01")
      )
    ).toBe(true);
    expect(row.passed).toBe(false);
  });

  it("ca âm: chỉ còn một competency thì đỏ BR-CRM-08", () => {
    const onlyCounting: RoadmapSeed = {
      ...RM_3_4_MAM_01,
      weeks: RM_3_4_MAM_01.weeks.map((week) => ({
        ...week,
        target_skills: ["C1.CNT.01"],
        sessions: week.sessions.map((s) => ({
          ...s,
          role:
            s.session_no === 1 && week.week_no === 1 ? "introduce" : "review",
          skill_code: "C1.CNT.01",
        })),
      })),
    };
    const row = measure(onlyCounting);
    expect(row.passed).toBe(false);
    expect(row.competencies_covered).toBe(1);
    expect(row.violations.some((v) => v.rule_id === "BR-CRM-08")).toBe(true);
  });

  it("ca âm: mã kỹ năng ngoài taxonomy đỏ và in đúng mã sai", () => {
    const row = measure(replaceSkill(RM_3_4_MAM_01, "C4.VIS.02", "C9.ZZZ.99"));
    expect(row.passed).toBe(false);
    expect(
      row.violations.some(
        (v) => v.rule_id === "BR-LRM-02" && v.message.includes("C9.ZZZ.99")
      )
    ).toBe(true);
  });

  it("ca âm: target_skills lệch với kỹ năng các tiết", () => {
    const [first, ...rest] = RM_3_4_MAM_01.weeks;
    if (!first) {
      throw new Error("Lộ trình rỗng");
    }
    const broken: RoadmapSeed = {
      ...RM_3_4_MAM_01,
      weeks: [{ ...first, target_skills: ["C1.CNT.01"] }, ...rest],
    };
    expect(messages(broken).some((m) => m.includes("target_skills"))).toBe(
      true
    );
  });

  it("ca âm: practice trước tiết introduce đỏ BR-LRM-05", () => {
    const [first, ...rest] = RM_3_4_MAM_01.weeks;
    const [firstSession, ...otherSessions] = first?.sessions ?? [];
    if (!(first && firstSession)) {
      throw new Error("Lộ trình rỗng");
    }
    const broken: RoadmapSeed = {
      ...RM_3_4_MAM_01,
      weeks: [
        {
          ...first,
          sessions: [{ ...firstSession, role: "practice" }, ...otherSessions],
        },
        ...rest,
      ],
    };
    expect(
      messages(broken).some(
        (m) => m.startsWith("BR-LRM-05") && m.includes("trước khi có tiết")
      )
    ).toBe(true);
  });

  it("ca âm: mã lộ trình sai dạng đỏ BR-LRM-10", () => {
    const broken: RoadmapSeed = { ...RM_3_4_MAM_01, code: "roadmap-xyz" };
    expect(
      measure(broken).violations.some((v) => v.rule_id === "BR-LRM-10")
    ).toBe(true);
  });

  it("ca âm: kỹ năng vượt trần độ khó của band đỏ BR-PAR-01", () => {
    const row = measure(replaceSkill(RM_3_4_MAM_01, "C4.VIS.02", "C6.ATT.01"));
    expect(row.violations.every((v) => v.rule_id !== "BR-LRM-02")).toBe(true);
    const strict = evaluateRoadmapSeeds({
      roadmaps: [RM_3_4_MAM_01],
      skills: SKILLS,
      difficultyMaxByBand: { ...DIFFICULTY_MAX, "3-4": 0 },
    });
    expect(strict[0]?.violations.some((v) => v.rule_id === "BR-PAR-01")).toBe(
      true
    );
  });
});
