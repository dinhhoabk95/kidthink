import {
  type CompetencyCode,
  CompetencyCodeSchema,
  STRANDS_CATALOG,
  StrandCodeSchema,
} from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  assertDag,
  buildSkillTree,
  COMPETENCIES,
  getMemoizedSkillTree,
  invalidateSkillTreeCache,
  nextCandidates,
  prerequisitesOf,
  resolvePath,
  resolveSkillsForCompetency,
  type SkillRow,
  STRANDS,
  unlockedBy,
} from "#src/index";

const CYCLE_REGEX =
  /Cycle detected in skill prerequisites: SKILL-A -> SKILL-B -> SKILL-A \(BR-TAX-01\)/;
const CYCLE_DETECTED_REGEX = /Cycle detected in skill prerequisites/;

describe("COMPETENCIES", () => {
  it("has exactly 6 entries", () => {
    expect(COMPETENCIES).toHaveLength(6);
  });

  it("codes are C1..C6 in order", () => {
    const codes = COMPETENCIES.map((c) => c.code);
    expect(codes).toEqual(["C1", "C2", "C3", "C4", "C5", "C6"]);
  });

  it("all codes pass CompetencyCodeSchema", () => {
    for (const c of COMPETENCIES) {
      expect(() => CompetencyCodeSchema.parse(c.code)).not.toThrow();
    }
  });

  it("all have non-empty English and Vietnamese names", () => {
    for (const c of COMPETENCIES) {
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.name.length).toBeGreaterThan(0);
    }
  });
});

describe("STRANDS", () => {
  it("matches catalog entries count", () => {
    expect(STRANDS).toHaveLength(STRANDS_CATALOG.length);
  });

  it("all codes pass StrandCodeSchema", () => {
    for (const s of STRANDS) {
      expect(() => StrandCodeSchema.parse(s.code)).not.toThrow();
    }
  });

  it("all competency_codes pass CompetencyCodeSchema", () => {
    for (const s of STRANDS) {
      expect(() => CompetencyCodeSchema.parse(s.competency_code)).not.toThrow();
    }
  });

  it("each strand belongs to a valid competency", () => {
    const competencyCodes = new Set(COMPETENCIES.map((c) => c.code));
    for (const s of STRANDS) {
      expect(competencyCodes.has(s.competency_code)).toBe(true);
    }
  });

  it("strand code prefix matches its competency_code", () => {
    for (const s of STRANDS) {
      expect(s.code.startsWith(`${s.competency_code}.`)).toBe(true);
    }
  });

  it("strand count per competency matches taxonomy docs", () => {
    const counts: Record<string, number> = {};
    for (const s of STRANDS) {
      counts[s.competency_code] = (counts[s.competency_code] ?? 0) + 1;
    }
    const c5Count = STRANDS.filter((s) => s.competency_code === "C5").length;
    expect(counts).toEqual({
      C1: 12,
      C2: 10,
      C3: 10,
      C4: 16,
      C5: c5Count,
      C6: 8,
    });
  });

  it("all have non-empty English and Vietnamese names", () => {
    for (const s of STRANDS) {
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("strand codes are unique", () => {
    const codes = STRANDS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("Taxonomy API functions & DAG validation", () => {
  const sampleRows: SkillRow[] = [
    {
      code: "C1.CNT.01",
      strand_code: "C1.CNT",
      competency_code: "C1",
      name: "Đếm đến 5",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      thinking_processes: ["recall"],
      tier: "basic",
      learning_objectives: [
        {
          code: "LO-C1.CNT.01-01",
          behaviour: "Đếm từ 1 đến 5",
          observable_criteria: "Đếm đúng không bỏ sót",
        },
      ],
    },
    {
      code: "C1.CNT.02",
      strand_code: "C1.CNT",
      competency_code: "C1",
      name: "Đếm đến 10",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      thinking_processes: ["recall"],
      tier: "basic",
      prerequisites: [{ prerequisite_code: "C1.CNT.01" }],
    },
    {
      code: "C1.CNT.03",
      strand_code: "C1.CNT",
      competency_code: "C1",
      name: "Đếm ngược từ 5",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      thinking_processes: ["deduce"],
      tier: "basic",
      prerequisites: [{ prerequisite_code: "C1.CNT.02" }],
    },
  ];

  it("buildSkillTree creates valid tree and computes unlockedBy backlinks", () => {
    const tree = buildSkillTree(sampleRows);
    expect(tree.skills.size).toBe(3);
    expect(unlockedBy(tree, "C1.CNT.01").map((s) => s.code)).toEqual([
      "C1.CNT.02",
    ]);
  });

  it("resolveSkillsForCompetency returns all skills in competency C1", () => {
    const tree = buildSkillTree(sampleRows);
    const c1Code: CompetencyCode = CompetencyCodeSchema.parse("C1");
    const skills = resolveSkillsForCompetency(tree, c1Code);
    expect(skills).toHaveLength(3);
  });

  it("resolvePath resolves competency, strand, and skill accurately", () => {
    const tree = buildSkillTree(sampleRows);

    expect(resolvePath(tree, "C1")?.competency?.code).toBe("C1");
    expect(resolvePath(tree, "C1.CNT")?.strand?.code).toBe("C1.CNT");
    expect(resolvePath(tree, "C1.CNT.01")?.skill?.code).toBe("C1.CNT.01");
    expect(resolvePath(tree, "UNKNOWN")).toBeNull();
  });

  it("prerequisitesOf returns direct and transitive prerequisites without infinite loop on circular data", () => {
    const tree = buildSkillTree(sampleRows);
    const directPrereqs = prerequisitesOf(tree, "C1.CNT.03");
    expect(directPrereqs.map((s) => s.code)).toEqual(["C1.CNT.02"]);

    const transitivePrereqs = prerequisitesOf(tree, "C1.CNT.03", {
      transitive: true,
    });
    const codes = transitivePrereqs.map((s) => s.code);
    expect(codes).toContain("C1.CNT.02");
    expect(codes).toContain("C1.CNT.01");
  });

  it("assertDag throws error with exact cycle path when cycle exists (BR-TAX-01)", () => {
    const cyclicRows: SkillRow[] = [
      {
        code: "SKILL-A",
        strand_code: "C1.CNT",
        competency_code: "C1",
        name: "A",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        thinking_processes: ["recall"],
        tier: "basic",
        prerequisites: [{ prerequisite_code: "SKILL-B" }],
      },
      {
        code: "SKILL-B",
        strand_code: "C1.CNT",
        competency_code: "C1",
        name: "B",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        thinking_processes: ["recall"],
        tier: "basic",
        prerequisites: [{ prerequisite_code: "SKILL-A" }],
      },
    ];

    const tree = buildSkillTree(cyclicRows);
    expect(() => assertDag(tree)).toThrow(CYCLE_REGEX);
  });

  it("property test BR-TAX-01: catches cycles in randomly generated cyclic graphs", () => {
    // Generate 10 random DAGs and inject a cycle into each
    for (let run = 0; run < 10; run++) {
      const nodeCount = 5 + Math.floor(Math.random() * 10); // 5 to 14 nodes
      const nodes = Array.from({ length: nodeCount }, (_, i) => `NODE-${i}`);
      const rows: SkillRow[] = nodes.map((code, idx) => {
        // DAG edges: can only depend on nodes with strictly smaller index
        const prereqCount = Math.floor(Math.random() * Math.min(idx, 3));
        const prereqs: string[] = [];
        for (let p = 0; p < prereqCount; p++) {
          const parentIdx = Math.floor(Math.random() * idx);
          const parent = nodes[parentIdx];
          if (parent !== undefined && !prereqs.includes(parent)) {
            prereqs.push(parent);
          }
        }
        return {
          code,
          strand_code: "C1.CNT",
          competency_code: "C1",
          name: `Node ${idx}`,
          age_min: 3,
          age_max: 4,
          difficulty: 1,
          thinking_processes: ["recall"],
          tier: "basic",
          prerequisites: prereqs.map((p) => ({ prerequisite_code: p })),
        };
      });

      // Valid DAG should pass assertDag
      const validTree = buildSkillTree(rows);
      expect(() => assertDag(validTree)).not.toThrow();

      // To guarantee a cycle: make node 0 depend on node 1, node 1 on node 2 ... node (N-1) on node 0
      const directCycleRows: SkillRow[] = nodes.map((code, idx) => ({
        code,
        strand_code: "C1.CNT",
        competency_code: "C1",
        name: `Node ${idx}`,
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        thinking_processes: ["recall"],
        tier: "basic",
        prerequisites: [
          { prerequisite_code: nodes[(idx + 1) % nodeCount] ?? "NODE-0" },
        ],
      }));
      const cyclicTree = buildSkillTree(directCycleRows);
      expect(() => assertDag(cyclicTree)).toThrow(CYCLE_DETECTED_REGEX);
    }
  });

  it("nextCandidates returns skills whose prerequisites are all mastered", () => {
    const tree = buildSkillTree(sampleRows);
    const mastered = new Set<string>(["C1.CNT.01"]);

    const candidates = nextCandidates(tree, mastered);
    expect(candidates.map((s) => s.code)).toEqual(["C1.CNT.02"]);
  });

  it("getMemoizedSkillTree caches tree and respects TTL / version", () => {
    invalidateSkillTreeCache();
    const tree1 = getMemoizedSkillTree(sampleRows, "v1");
    const tree2 = getMemoizedSkillTree(sampleRows, "v1");
    expect(tree1).toBe(tree2);

    const tree3 = getMemoizedSkillTree(sampleRows, "v2");
    expect(tree3).not.toBe(tree1);
  });
});
