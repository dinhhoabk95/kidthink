/**
 * Dịch vụ taxonomy — cây 5 tầng.
 *
 * Source of truth: `docs/taxonomy/index.md` + per-competency files.
 * Layer 1 — code-owned master data. Admin reads only.
 */

import type {
  CompetencyCode,
  CompetencyTier,
  ContentLifecycleStatus,
  ContentWhat,
  LearningObjectiveTier,
  SkillCode,
  SkillTier,
  StrandCode,
  StrandTier,
  ThinkingProcess,
} from "@mindkid/shared";
import {
  COMPETENCIES as INTERNAL_COMPETENCIES,
  STRANDS as INTERNAL_STRANDS,
} from "./types.js";

export type * from "./types.js";
export { COMPETENCIES, STRANDS } from "./types.js";

export interface SkillPrerequisiteRef {
  prerequisite_code: string;
  strength?: number;
}

export interface LearningObjectiveInput {
  code: string;
  behaviour: string;
  observable_criteria: string;
  position?: number;
}

export interface SkillRow {
  code: string;
  strand_code: string;
  competency_code: string;
  name: string;
  age_min: number;
  age_max: number;
  difficulty: number;
  thinking_processes: ThinkingProcess[];
  what_axis?: ContentWhat[];
  status: ContentLifecycleStatus;
  prerequisites?: SkillPrerequisiteRef[];
  learning_objectives?: LearningObjectiveInput[];
}

export interface SkillTreeNode {
  skill: SkillTier;
  competency_code: CompetencyCode;
  strand_code: StrandCode;
  prerequisites: string[];
  unlockedBy: string[];
  learning_objectives: LearningObjectiveTier[];
}

export interface SkillTree {
  competencies: Map<CompetencyCode, CompetencyTier>;
  strands: Map<StrandCode, StrandTier>;
  skills: Map<string, SkillTreeNode>;
  version?: string;
}

// ─── Pure Tree Traversal & Operations ──────────────────────────────────

/**
 * Builds an in-memory SkillTree from raw skill rows.
 */
export function buildSkillTree(rows: SkillRow[], version?: string): SkillTree {
  const competenciesMap = new Map<CompetencyCode, CompetencyTier>();
  for (const comp of INTERNAL_COMPETENCIES) {
    competenciesMap.set(comp.code, comp);
  }

  const strandsMap = new Map<StrandCode, StrandTier>();
  for (const str of INTERNAL_STRANDS) {
    strandsMap.set(str.code, str);
  }

  const skillsMap = new Map<string, SkillTreeNode>();

  // Pass 1: Add all skill nodes
  for (const row of rows) {
    const prereqCodes = (row.prerequisites ?? []).map(
      (p) => p.prerequisite_code
    );
    const loTiers: LearningObjectiveTier[] = (
      row.learning_objectives ?? []
    ).map((lo, idx) => ({
      code: lo.code,
      skill_code: row.code as SkillCode,
      description: lo.behaviour,
      position: lo.position ?? idx + 1,
    }));

    const skillTier: SkillTier = {
      code: row.code as SkillCode,
      strand_code: row.strand_code as StrandCode,
      name: row.name,
      age_min: row.age_min as 3 | 4 | 5 | 6,
      age_max: row.age_max as 3 | 4 | 5 | 6,
      difficulty: row.difficulty as 1 | 2 | 3 | 4 | 5,
      thinking: row.thinking_processes,
      prerequisites: prereqCodes as SkillCode[],
    };

    skillsMap.set(row.code, {
      skill: skillTier,
      competency_code: row.competency_code as CompetencyCode,
      strand_code: row.strand_code as StrandCode,
      prerequisites: prereqCodes,
      unlockedBy: [],
      learning_objectives: loTiers,
    });
  }

  // Pass 2: Calculate unlockedBy backlinks
  for (const [code, node] of skillsMap.entries()) {
    for (const pCode of node.prerequisites) {
      const pNode = skillsMap.get(pCode);
      if (pNode && !pNode.unlockedBy.includes(code)) {
        pNode.unlockedBy.push(code);
      }
    }
  }

  return {
    competencies: competenciesMap,
    strands: strandsMap,
    skills: skillsMap,
    version,
  };
}

/**
 * Returns all skills belonging to a competency.
 */
export function resolveSkillsForCompetency(
  tree: SkillTree,
  code: CompetencyCode
): SkillTier[] {
  const result: SkillTier[] = [];
  for (const node of tree.skills.values()) {
    if (node.competency_code === code) {
      result.push(node.skill);
    }
  }
  return result;
}

/**
 * Resolves path for a code (competency, strand, or skill).
 */
export function resolvePath(
  tree: SkillTree,
  code: string
): {
  competency?: CompetencyTier;
  strand?: StrandTier;
  skill?: SkillTier;
} | null {
  if (tree.competencies.has(code as CompetencyCode)) {
    return { competency: tree.competencies.get(code as CompetencyCode) };
  }
  if (tree.strands.has(code as StrandCode)) {
    const strand = tree.strands.get(code as StrandCode);
    if (strand) {
      const competency = tree.competencies.get(strand.competency_code);
      return { competency, strand };
    }
  }
  if (tree.skills.has(code)) {
    const node = tree.skills.get(code);
    if (node) {
      const strand = tree.strands.get(node.strand_code);
      const competency = tree.competencies.get(node.competency_code);
      return { competency, strand, skill: node.skill };
    }
  }
  return null;
}

/**
 * Resolves prerequisites of a skill (direct or transitive).
 * Prevents infinite loop on cyclic dirty data.
 */
export function prerequisitesOf(
  tree: SkillTree,
  code: string,
  opts?: { transitive?: boolean }
): SkillTier[] {
  const node = tree.skills.get(code);
  if (!node) {
    return [];
  }

  if (!opts?.transitive) {
    return node.prerequisites
      .map((pCode) => tree.skills.get(pCode)?.skill)
      .filter((s): s is SkillTier => s !== undefined);
  }

  const result: SkillTier[] = [];
  const visited = new Set<string>();
  const stack = [...node.prerequisites];

  while (stack.length > 0) {
    const pCode = stack.pop();
    if (!pCode || visited.has(pCode)) {
      continue;
    }
    visited.add(pCode);

    const pNode = tree.skills.get(pCode);
    if (pNode) {
      result.push(pNode.skill);
      for (const parentPrereq of pNode.prerequisites) {
        if (!visited.has(parentPrereq)) {
          stack.push(parentPrereq);
        }
      }
    }
  }

  return result;
}

/**
 * Returns skills unlocked by the given skill code.
 */
export function unlockedBy(tree: SkillTree, code: string): SkillTier[] {
  const node = tree.skills.get(code);
  if (!node) {
    return [];
  }

  return node.unlockedBy
    .map((uCode) => tree.skills.get(uCode)?.skill)
    .filter((s): s is SkillTier => s !== undefined);
}

/**
 * Validates that skill_prerequisites form a Directed Acyclic Graph (DAG).
 * BR-TAX-01: Throws Error with the exact cycle path if a cycle is detected.
 */
export function assertDag(tree: SkillTree): void {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(code: string): void {
    visited.add(code);
    recursionStack.add(code);
    currentPath.push(code);

    const node = tree.skills.get(code);
    if (node) {
      for (const pCode of node.prerequisites) {
        if (!visited.has(pCode)) {
          dfs(pCode);
        } else if (recursionStack.has(pCode)) {
          // Cycle found! Extract cycle path from pCode to current
          const cycleStartIndex = currentPath.indexOf(pCode);
          const cyclePath = [...currentPath.slice(cycleStartIndex), pCode].join(
            " -> "
          );
          throw new Error(
            `Cycle detected in skill prerequisites: ${cyclePath} (BR-TAX-01)`
          );
        }
      }
    }

    currentPath.pop();
    recursionStack.delete(code);
  }

  for (const code of tree.skills.keys()) {
    if (!visited.has(code)) {
      dfs(code);
    }
  }
}

/**
 * Returns next candidate skills whose prerequisites are all mastered.
 */
export function nextCandidates(
  tree: SkillTree,
  mastered: Set<string>
): SkillTier[] {
  const candidates: SkillTier[] = [];

  for (const [code, node] of tree.skills.entries()) {
    if (mastered.has(code)) {
      continue;
    }

    // Check if all prerequisites are mastered
    const allPrereqsMet = node.prerequisites.every((pCode) =>
      mastered.has(pCode)
    );

    if (allPrereqsMet) {
      candidates.push(node.skill);
    }
  }

  return candidates;
}

// ─── 5-Minute In-Memory TTL Cache ──────────────────────────────────────

let cachedTree: SkillTree | null = null;
let cachedVersion: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getMemoizedSkillTree(
  rows: SkillRow[],
  version?: string
): SkillTree {
  const now = Date.now();
  const isVersionMatch = version ? cachedVersion === version : true;
  const isFresh = now - cacheTimestamp < CACHE_TTL_MS;

  if (cachedTree && isVersionMatch && isFresh) {
    return cachedTree;
  }

  const newTree = buildSkillTree(rows, version);
  assertDag(newTree);

  cachedTree = newTree;
  cachedVersion = version ?? null;
  cacheTimestamp = now;

  return newTree;
}

export function invalidateSkillTreeCache(): void {
  cachedTree = null;
  cachedVersion = null;
  cacheTimestamp = 0;
}
