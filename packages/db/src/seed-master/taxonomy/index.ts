import fs from "node:fs";
import path from "node:path";
import type { ContentLifecycleStatus, ThinkingProcess } from "@mindkid/shared";
import {
  assertDag,
  buildSkillTree,
  COMPETENCIES,
  type SkillRow,
  STRANDS,
} from "@mindkid/taxonomy";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  competencies,
  learningObjectives,
  skillPrerequisites,
  skills,
  strands,
} from "#src/schema/taxonomy";

export interface ParsedSkill {
  code: string;
  strand_code: string;
  competency_code: string;
  name: string;
  age_min: number;
  age_max: number;
  difficulty: number;
  thinking_processes: string[];
  status: "seeded" | "planned" | "drafted";
  prerequisites: string[];
  learning_objectives: {
    code: string;
    behaviour: string;
    observable_criteria: string;
    position: number;
  }[];
}

const COMPETENCY_FILES = [
  "c1-mathematical-thinking.md",
  "c2-spatial-thinking.md",
  "c3-logical-thinking.md",
  "c4-observation-thinking.md",
  "c5-language-thinking.md",
  "c6-executive-function.md",
];

const EXPECTED_SKILL_COUNTS: Record<string, number> = {
  C1: 99,
  C2: 44,
  C3: 30,
  C4: 16,
  C5: 21,
  C6: 20,
};

const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;
const STRAND_HEADER_REGEX = /^##\s+(C[1-6]\.[A-Z]{2,5})\s+—/;
const AGE_RANGE_SPLIT_REGEX = /[–-]/;
const PREREQ_SPLIT_REGEX = /[·,]/;

function parseAgeRange(ageStr: string): { age_min: number; age_max: number } {
  if (ageStr.includes("–") || ageStr.includes("-")) {
    const parts = ageStr
      .split(AGE_RANGE_SPLIT_REGEX)
      .map((p) => Number.parseInt(p.trim(), 10));
    const min = parts[0] || 3;
    const max = parts[1] || min;
    return { age_min: min, age_max: max };
  }
  const age = Number.parseInt(ageStr, 10) || 3;
  return { age_min: age, age_max: age };
}

function parsePrereqs(prereqStr: string): string[] {
  if (prereqStr === "—" || !prereqStr) {
    return [];
  }
  return prereqStr
    .split(PREREQ_SPLIT_REGEX)
    .map((p) => p.trim())
    .filter((p) => p.startsWith("C"));
}

function parseThinkingProcesses(thinkingStr: string): string[] {
  const matches = (thinkingStr.match(/`([^`]+)`/g) ?? []).map((t) =>
    t.replace(/`/g, "")
  );
  return matches.length > 0 ? matches : ["observe"];
}

function generateDefaultLOs(code: string, name: string) {
  return [
    {
      code: `LO-${code}-01`,
      behaviour: `Nhận biết và thực hành ${name} ở mức cơ bản`,
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: `LO-${code}-02`,
      behaviour: `Vận dụng ${name} trong môi trường tương tác`,
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: `LO-${code}-03`,
      behaviour: `Giải quyết vấn đề nâng cao liên quan tới ${name}`,
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ];
}

function parseSkillTableRow(
  line: string,
  currentStrandCode: string,
  currentCompCode: string
): ParsedSkill | null {
  if (!(line.startsWith("|") && line.includes("C")) || line.includes("Code")) {
    return null;
  }

  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  if (cells.length < 6) {
    return null;
  }

  const code = cells[0];
  if (!SKILL_CODE_REGEX.test(code)) {
    return null;
  }

  const name = cells[1];
  const { age_min, age_max } = parseAgeRange(cells[2]);
  const difficulty = Number.parseInt(cells[3], 10) || 1;
  const prerequisites = parsePrereqs(cells[4]);
  const thinking_processes = parseThinkingProcesses(cells[5]);
  const statusStr = cells[6] ?? "";

  const status: "seeded" | "planned" | "drafted" =
    statusStr.includes("chờ") || statusStr.includes("draft")
      ? "planned"
      : "seeded";

  return {
    code,
    strand_code: currentStrandCode || code.slice(0, code.lastIndexOf(".")),
    competency_code: currentCompCode || code.split(".")[0],
    name,
    age_min,
    age_max,
    difficulty,
    thinking_processes,
    status,
    prerequisites,
    learning_objectives: generateDefaultLOs(code, name),
  };
}

function resolveTaxonomyDocsDir(docsDir: string): string {
  const resolvedDir = path.isAbsolute(docsDir)
    ? docsDir
    : path.resolve(process.cwd(), docsDir);

  if (fs.existsSync(path.join(resolvedDir, COMPETENCY_FILES[0]))) {
    return resolvedDir;
  }

  let curr = process.cwd();
  for (let i = 0; i < 4; i++) {
    const candidate = path.resolve(curr, "docs/taxonomy");
    if (fs.existsSync(path.join(candidate, COMPETENCY_FILES[0]))) {
      return candidate;
    }
    const parent = path.dirname(curr);
    if (parent === curr) {
      break;
    }
    curr = parent;
  }
  return resolvedDir;
}

/**
 * Parses markdown files in `docs/taxonomy/` to extract all skills & LOs.
 */
export function parseTaxonomyDocs(docsDir: string): ParsedSkill[] {
  const parsedSkills: ParsedSkill[] = [];
  const resolvedDir = resolveTaxonomyDocsDir(docsDir);

  for (const filename of COMPETENCY_FILES) {
    const filePath = path.join(resolvedDir, filename);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let currentStrandCode = "";
    let currentCompCode = "";

    for (const rawLine of lines) {
      const line = rawLine.trim();

      const strandMatch = line.match(STRAND_HEADER_REGEX);
      if (strandMatch) {
        currentStrandCode = strandMatch[1];
        currentCompCode = currentStrandCode.split(".")[0];
        continue;
      }

      const parsedSkill = parseSkillTableRow(
        line,
        currentStrandCode,
        currentCompCode
      );
      if (parsedSkill) {
        parsedSkills.push(parsedSkill);
      }
    }
  }

  return parsedSkills;
}

function validateCounts(skillsToSeed: ParsedSkill[]): void {
  const compCounts: Record<string, number> = {};
  for (const s of skillsToSeed) {
    compCounts[s.competency_code] = (compCounts[s.competency_code] ?? 0) + 1;
  }

  for (const [compCode, expectedCount] of Object.entries(
    EXPECTED_SKILL_COUNTS
  )) {
    const actualCount = compCounts[compCode] ?? 0;
    if (actualCount !== expectedCount) {
      throw new Error(
        `BR-TAX-09 violation: Competency ${compCode} expected ${expectedCount} skills, found ${actualCount}`
      );
    }
  }
}

function validateSkillBounds(
  skillsToSeed: ParsedSkill[],
  skillMap: Map<string, ParsedSkill>
): void {
  for (const s of skillsToSeed) {
    if (s.age_min < 3 || s.age_max > 6 || s.age_min > s.age_max) {
      throw new Error(
        `BR-TAX-04 violation: Invalid age range for skill ${s.code}`
      );
    }
    if (s.difficulty < 1 || s.difficulty > 5) {
      throw new Error(
        `BR-TAX-04 violation: Invalid difficulty for skill ${s.code}`
      );
    }
    if (s.thinking_processes.length === 0) {
      throw new Error(
        `BR-TAX-04 violation: Skill ${s.code} missing thinking process`
      );
    }

    for (const pCode of s.prerequisites) {
      const pSkill = skillMap.get(pCode);
      if (
        s.status === "seeded" &&
        pSkill &&
        pSkill.status === "seeded" &&
        pSkill.difficulty > s.difficulty
      ) {
        throw new Error(
          `BR-TAX-05 violation: Prerequisite ${pCode} (diff ${pSkill.difficulty}) > skill ${s.code} (diff ${s.difficulty})`
        );
      }
    }
  }
}

/**
 * Validates pre-flight taxonomy invariants before inserting into DB.
 */
export function validateTaxonomyInvariants(skillsToSeed: ParsedSkill[]): void {
  validateCounts(skillsToSeed);

  const skillMap = new Map<string, ParsedSkill>();
  for (const s of skillsToSeed) {
    skillMap.set(s.code, s);
    if (s.status === "seeded" && s.learning_objectives.length < 3) {
      throw new Error(
        `BR-TAX-02 violation: Skill ${s.code} status='seeded' has ${s.learning_objectives.length} LOs (< 3)`
      );
    }
  }

  validateSkillBounds(skillsToSeed, skillMap);

  const skillRows: SkillRow[] = skillsToSeed.map((s) => ({
    code: s.code,
    strand_code: s.strand_code,
    competency_code: s.competency_code,
    name: s.name,
    age_min: s.age_min,
    age_max: s.age_max,
    difficulty: s.difficulty,
    thinking_processes: s.thinking_processes as unknown as ThinkingProcess[],
    status: s.status as ContentLifecycleStatus,
    prerequisites: s.prerequisites.map((pCode) => ({
      prerequisite_code: pCode,
    })),
    learning_objectives: s.learning_objectives.map((lo) => ({
      code: lo.code,
      behaviour: lo.behaviour,
      observable_criteria: lo.observable_criteria,
      position: lo.position,
    })),
  }));

  const tree = buildSkillTree(skillRows);
  assertDag(tree);
}

async function seedCompetenciesStep(
  db: NodePgDatabase<Record<string, unknown>>
): Promise<Map<string, number>> {
  const values = COMPETENCIES.map((comp) => ({
    code: comp.code,
    name: comp.name || "",
    description: comp.description || null,
    colorToken: `color-${comp.code.toLowerCase()}`,
    icon: `icon-${comp.code.toLowerCase()}`,
    position: Number.parseInt(comp.code.replace("C", ""), 10),
  }));

  if (values.length > 0) {
    await db
      .insert(competencies)
      .values(values)
      .onConflictDoUpdate({
        target: competencies.code,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
        },
      });
  }

  const dbComps = await db.select().from(competencies);
  const compIdMap = new Map<string, number>();
  for (const c of dbComps) {
    compIdMap.set(c.code, c.id);
  }
  return compIdMap;
}

async function seedStrandsStep(
  db: NodePgDatabase<Record<string, unknown>>,
  compIdMap: Map<string, number>
): Promise<Map<string, number>> {
  const values = STRANDS.map((str, idx) => {
    const compId = compIdMap.get(str.competency_code);
    if (!compId) {
      return null;
    }
    return {
      code: str.code,
      competencyId: compId,
      name: str.name || "",
      description: str.description || null,
      position: idx + 1,
    };
  }).filter((s): s is NonNullable<typeof s> => s !== null);

  if (values.length > 0) {
    await db
      .insert(strands)
      .values(values)
      .onConflictDoUpdate({
        target: strands.code,
        set: {
          competencyId: sql`excluded.competency_id`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
        },
      });
  }

  const dbStrands = await db.select().from(strands);
  const strandIdMap = new Map<string, number>();
  for (const s of dbStrands) {
    strandIdMap.set(s.code, s.id);
  }
  return strandIdMap;
}

async function seedSkillsStep(
  db: NodePgDatabase<Record<string, unknown>>,
  seededSkills: ParsedSkill[],
  strandIdMap: Map<string, number>
): Promise<Map<string, number>> {
  const values = seededSkills
    .map((sk, idx) => {
      const strandId = strandIdMap.get(sk.strand_code);
      if (!strandId) {
        return null;
      }
      return {
        code: sk.code,
        strandId,
        name: sk.name || "",
        ageMin: sk.age_min,
        ageMax: sk.age_max,
        difficulty: sk.difficulty,
        thinkingProcesses: sk.thinking_processes,
        status: "seeded" as const,
        position: idx + 1,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (values.length > 0) {
    await db
      .insert(skills)
      .values(values)
      .onConflictDoUpdate({
        target: skills.code,
        set: {
          strandId: sql`excluded.strand_id`,
          name: sql`excluded.name`,
          ageMin: sql`excluded.age_min`,
          ageMax: sql`excluded.age_max`,
          difficulty: sql`excluded.difficulty`,
          thinkingProcesses: sql`excluded.thinking_processes`,
          status: sql`excluded.status`,
          position: sql`excluded.position`,
        },
      });
  }

  const dbSkills = await db.select().from(skills);
  const skillIdMap = new Map<string, number>();
  for (const s of dbSkills) {
    skillIdMap.set(s.code, s.id);
  }
  return skillIdMap;
}

async function seedPrerequisitesStep(
  db: NodePgDatabase<Record<string, unknown>>,
  seededSkills: ParsedSkill[],
  skillIdMap: Map<string, number>
): Promise<void> {
  const values: {
    skillId: number;
    prerequisiteId: number;
    strength: string;
  }[] = [];
  for (const sk of seededSkills) {
    const skillId = skillIdMap.get(sk.code);
    if (!skillId) {
      continue;
    }

    for (const pCode of sk.prerequisites) {
      const prereqId = skillIdMap.get(pCode);
      if (prereqId) {
        values.push({
          skillId,
          prerequisiteId: prereqId,
          strength: "1.00",
        });
      }
    }
  }

  if (values.length > 0) {
    await db.insert(skillPrerequisites).values(values).onConflictDoNothing();
  }
}

async function seedLearningObjectivesStep(
  db: NodePgDatabase<Record<string, unknown>>,
  seededSkills: ParsedSkill[],
  skillIdMap: Map<string, number>
): Promise<number> {
  const values: {
    code: string;
    skillId: number;
    behaviour: string;
    observableCriteria: string;
    position: number;
  }[] = [];

  for (const sk of seededSkills) {
    const skillId = skillIdMap.get(sk.code);
    if (!skillId) {
      continue;
    }

    for (const lo of sk.learning_objectives) {
      values.push({
        code: lo.code,
        skillId,
        behaviour: lo.behaviour,
        observableCriteria: lo.observable_criteria,
        position: lo.position,
      });
    }
  }

  if (values.length > 0) {
    await db
      .insert(learningObjectives)
      .values(values)
      .onConflictDoUpdate({
        target: learningObjectives.code,
        set: {
          skillId: sql`excluded.skill_id`,
          behaviour: sql`excluded.behaviour`,
          observableCriteria: sql`excluded.observable_criteria`,
          position: sql`excluded.position`,
        },
      });
  }

  return values.length;
}

/**
 * Seeds Master Taxonomy data (competencies, strands, skills, prerequisites, LOs).
 * Pre-flight validation & assertDag run BEFORE any INSERTs (D-EG).
 * Idempotent according to `code`.
 */
export async function seedTaxonomyMasterData(
  db: NodePgDatabase<Record<string, unknown>>,
  docsDir?: string
): Promise<{
  competencyCount: number;
  strandCount: number;
  skillCount: number;
  loCount: number;
}> {
  const defaultDocsDir = fs.existsSync(
    path.resolve(process.cwd(), "docs/taxonomy")
  )
    ? path.resolve(process.cwd(), "docs/taxonomy")
    : path.resolve(process.cwd(), "../../docs/taxonomy");
  const rootDocsDir = docsDir ?? defaultDocsDir;
  const allParsedSkills = parseTaxonomyDocs(rootDocsDir);

  validateTaxonomyInvariants(allParsedSkills);

  const seededSkills = allParsedSkills.filter((s) => s.status === "seeded");

  const compIdMap = await seedCompetenciesStep(db);
  const strandIdMap = await seedStrandsStep(db, compIdMap);
  const skillIdMap = await seedSkillsStep(db, seededSkills, strandIdMap);
  await seedPrerequisitesStep(db, seededSkills, skillIdMap);
  const loCount = await seedLearningObjectivesStep(
    db,
    seededSkills,
    skillIdMap
  );

  return {
    competencyCount: compIdMap.size,
    strandCount: strandIdMap.size,
    skillCount: skillIdMap.size,
    loCount,
  };
}
