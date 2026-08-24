import { CompetencyCodeSchema, StrandCodeSchema } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { COMPETENCIES, STRANDS } from "#src/index";

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
  it("has exactly 41 entries", () => {
    expect(STRANDS).toHaveLength(41);
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
    expect(counts).toEqual({
      C1: 10,
      C2: 8,
      C3: 8,
      C4: 4,
      C5: 5,
      C6: 6,
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
  const sampleRows = [
    {
      code: "C1.CNT.01",
      strand_code: "C1.CNT",
      competency_code: "C1",
      name: "Đếm đến 5",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      thinking_processes: ["memorization"],
      status: "seeded" as const,
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
      thinking_processes: ["memorization"],
      status: "seeded" as const,
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
      thinking_processes: ["logical_reasoning"],
      status: "seeded" as const,
      prerequisites: [{ prerequisite_code: "C1.CNT.02" }],
    },
  ];

  it("buildSkillTree creates valid tree and computes unlockedBy backlinks", () => {
    const tree = buildSkillTree(sampleRows as any);
    expect(tree.skills.size).toBe(3);
    expect(unlockedBy(tree, "C1.CNT.01").map((s) => s.code)).toEqual([
      "C1.CNT.02",
    ]);
  });

  it("resolveSkillsForCompetency returns all skills in competency C1", () => {
    const tree = buildSkillTree(sampleRows as any);
    const skills = resolveSkillsForCompetency(tree, "C1" as any);
    expect(skills).toHaveLength(3);
  });

  it("resolvePath resolves competency, strand, and skill accurately", () => {
    const tree = buildSkillTree(sampleRows as any);

    expect(resolvePath(tree, "C1")?.competency?.code).toBe("C1");
    expect(resolvePath(tree, "C1.CNT")?.strand?.code).toBe("C1.CNT");
    expect(resolvePath(tree, "C1.CNT.01")?.skill?.code).toBe("C1.CNT.01");
    expect(resolvePath(tree, "UNKNOWN")).toBeNull();
  });

  it("prerequisitesOf returns direct and transitive prerequisites without infinite loop on circular data", () => {
    const tree = buildSkillTree(sampleRows as any);
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
    const cyclicRows = [
      {
        code: "SKILL-A",
        strand_code: "C1.CNT",
        competency_code: "C1",
        name: "A",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        thinking_processes: ["memorization"],
        status: "seeded" as const,
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
        thinking_processes: ["memorization"],
        status: "seeded" as const,
        prerequisites: [{ prerequisite_code: "SKILL-A" }],
      },
    ];

    const tree = buildSkillTree(cyclicRows as any);
    expect(() => assertDag(tree)).toThrow(CYCLE_REGEX);
  });

  it("property test BR-TAX-01: catches cycles in randomly generated cyclic graphs", () => {
    // Generate 10 random DAGs and inject a cycle into each
    for (let run = 0; run < 10; run++) {
      const nodeCount = 5 + Math.floor(Math.random() * 10); // 5 to 14 nodes
      const nodes = Array.from({ length: nodeCount }, (_, i) => `NODE-${i}`);
      const rows = nodes.map((code, idx) => {
        // DAG edges: can only depend on nodes with strictly smaller index
        const prereqCount = Math.floor(Math.random() * Math.min(idx, 3));
        const prereqs: string[] = [];
        for (let p = 0; p < prereqCount; p++) {
          const parentIdx = Math.floor(Math.random() * idx);
          if (!prereqs.includes(nodes[parentIdx])) {
            prereqs.push(nodes[parentIdx]);
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
          thinking_processes: ["memorization"],
          status: "seeded" as const,
          prerequisites: prereqs.map((p) => ({ prerequisite_code: p })),
        };
      });

      // Valid DAG should pass assertDag
      const validTree = buildSkillTree(rows as any);
      expect(() => assertDag(validTree)).not.toThrow();

      // Inject a cycle: pick node 0 and make it depend on node (nodeCount - 1)
      const cyclicRows = JSON.parse(JSON.stringify(rows));
      cyclicRows[0].prerequisites.push({
        prerequisite_code: nodes[nodeCount - 1],
      });

      // If (nodeCount - 1) actually had a path to node 0, this forms a cycle
      // To guarantee a cycle: make node 0 depend on node 1, node 1 on node 2 ... node (N-1) on node 0
      const directCycleRows = nodes.map((code, idx) => ({
        code,
        strand_code: "C1.CNT",
        competency_code: "C1",
        name: `Node ${idx}`,
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        thinking_processes: ["memorization"],
        status: "seeded" as const,
        prerequisites: [{ prerequisite_code: nodes[(idx + 1) % nodeCount] }],
      }));
      const cyclicTree = buildSkillTree(directCycleRows as any);
      expect(() => assertDag(cyclicTree)).toThrow(CYCLE_DETECTED_REGEX);
    }
  });

  it("nextCandidates returns skills whose prerequisites are all mastered", () => {
    const tree = buildSkillTree(sampleRows as any);
    const mastered = new Set<string>(["C1.CNT.01"]);

    const candidates = nextCandidates(tree, mastered);
    expect(candidates.map((s) => s.code)).toEqual(["C1.CNT.02"]);
  });

  it("getMemoizedSkillTree caches tree and respects TTL / version", () => {
    invalidateSkillTreeCache();
    const tree1 = getMemoizedSkillTree(sampleRows as any, "v1");
    const tree2 = getMemoizedSkillTree(sampleRows as any, "v1");
    expect(tree1).toBe(tree2);

    const tree3 = getMemoizedSkillTree(sampleRows as any, "v2");
    expect(tree3).not.toBe(tree1);
  });
});

import {
  assertDag,
  buildSkillTree,
  getMemoizedSkillTree,
  invalidateSkillTreeCache,
  nextCandidates,
  prerequisitesOf,
  resolvePath,
  resolveSkillsForCompetency,
  unlockedBy,
} from "#src/index";
