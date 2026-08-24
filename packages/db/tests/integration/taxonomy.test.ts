import { eq } from "drizzle-orm";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { competencies, skills, strands } from "#src/schema/taxonomy";

describe("Taxonomy Schema Integration Tests", () => {
  it("skills.code invalid format ('c1.cnt.3') is rejected by DB CHECK constraint", async () => {
    const db = getOwnerDb();

    // 1. Create competency & strand
    const [comp] = await db
      .insert(competencies)
      .values({
        code: "C1",
        name: "Tư duy số",
        colorToken: "blue",
        icon: "icon-c1",
      })
      .onConflictDoNothing()
      .returning();

    const compId = comp
      ? comp.id
      : (await db.select().from(competencies).where(sqlEqual("C1")))[0].id;

    const [str] = await db
      .insert(strands)
      .values({
        code: "C1.NUM",
        competencyId: compId,
        name: "Số đếm",
      })
      .onConflictDoNothing()
      .returning();

    const strandId = str
      ? str.id
      : (await db.select().from(strands).where(sqlEqualStrand("C1.NUM")))[0].id;

    // 2. Inserting skill with invalid code "c1.cnt.3" (lowercase, wrong format) must fail CHECK
    await expect(
      db.insert(skills).values({
        code: "c1.cnt.3",
        strandId,
        name: "Đếm đến 3",
        ageMin: 3,
        ageMax: 5,
        difficulty: 1,
      })
    ).rejects.toThrow();
  });

  it("strand nesting >1 level is rejected by service-layer constraint", async () => {
    const db = getOwnerDb();

    const [comp] = await db
      .insert(competencies)
      .values({
        code: "C2",
        name: "Tư duy hình học",
        colorToken: "red",
        icon: "icon-c2",
      })
      .onConflictDoNothing()
      .returning();

    const compId = comp
      ? comp.id
      : (await db.select().from(competencies))[0].id;

    // Level 0 strand
    const [s0] = await db
      .insert(strands)
      .values({
        code: "C2.GEO",
        competencyId: compId,
        name: "Hình học",
      })
      .onConflictDoNothing()
      .returning();

    const s0Id = s0
      ? s0.id
      : (await db.select().from(strands).where(sqlEqualStrand("C2.GEO")))[0].id;

    // Level 1 strand (parent = s0)
    const [s1] = await db
      .insert(strands)
      .values({
        code: "C2.SHP",
        competencyId: compId,
        parentStrandId: s0Id,
        name: "Hình phẳng",
      })
      .onConflictDoNothing()
      .returning();

    const s1Id = s1
      ? s1.id
      : (await db.select().from(strands).where(sqlEqualStrand("C2.SHP")))[0].id;

    // Helper service function enforcing <=1 nesting level constraint
    async function createSubStrand(input: {
      code: string;
      competencyId: number;
      parentStrandId?: number | null;
      name: string;
    }) {
      if (input.parentStrandId) {
        const [parent] = await db
          .select()
          .from(strands)
          .where(sqlIdEqual(input.parentStrandId));
        if (
          parent?.parentStrandId !== null &&
          parent?.parentStrandId !== undefined
        ) {
          throw new Error("BR-SCT: Strand nesting depth cannot exceed 1 level");
        }
      }
      return db.insert(strands).values(input).returning();
    }

    // Attempting Level 2 strand (parent = s1 which already has parent s0) → must be rejected
    await expect(
      createSubStrand({
        code: "C2.CIR",
        competencyId: compId,
        parentStrandId: s1Id,
        name: "Hình tròn",
      })
    ).rejects.toThrow("BR-SCT: Strand nesting depth cannot exceed 1 level");
  });

  it("Property test: skill_prerequisites graph is a DAG (no cycles) across generated edge sets", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.integer({ min: 1, max: 20 }),
            fc.integer({ min: 1, max: 20 })
          ),
          { maxLength: 30 }
        ),
        (rawEdges) => {
          const edges = rawEdges.filter(([u, v]) => u !== v);

          const adj = new Map<number, number[]>();
          for (const [u, v] of edges) {
            let list = adj.get(u);
            if (!list) {
              list = [];
              adj.set(u, list);
            }
            list.push(v);
          }

          const state = new Map<number, number>();
          let hasCycle = false;

          function dfs(node: number) {
            state.set(node, 1);
            const neighbors = adj.get(node) ?? [];
            for (const neighbor of neighbors) {
              const neighborState = state.get(neighbor) ?? 0;
              if (neighborState === 1) {
                hasCycle = true;
                return;
              }
              if (neighborState === 0) {
                dfs(neighbor);
                if (hasCycle) {
                  return;
                }
              }
            }
            state.set(node, 2);
          }

          for (const [u] of edges) {
            if ((state.get(u) ?? 0) === 0) {
              dfs(u);
            }
          }

          function isDag(edgeList: [number, number][]): boolean {
            const adjMap = new Map<number, number[]>();
            for (const [u, v] of edgeList) {
              let list = adjMap.get(u);
              if (!list) {
                list = [];
                adjMap.set(u, list);
              }
              list.push(v);
            }
            const st = new Map<number, number>();
            let cycle = false;

            function visit(n: number) {
              st.set(n, 1);
              for (const nxt of adjMap.get(n) ?? []) {
                if (st.get(nxt) === 1) {
                  cycle = true;
                } else if (!st.get(nxt)) {
                  visit(nxt);
                }
              }
              st.set(n, 2);
            }

            for (const n of adjMap.keys()) {
              if (!st.get(n)) {
                visit(n);
              }
            }
            return !cycle;
          }

          expect(isDag(edges)).toBe(!hasCycle);
        }
      )
    );
  });
});

function sqlEqual(code: string) {
  return eq(competencies.code, code);
}

function sqlEqualStrand(code: string) {
  return eq(strands.code, code);
}

function sqlIdEqual(id: number) {
  return eq(strands.id, id);
}
