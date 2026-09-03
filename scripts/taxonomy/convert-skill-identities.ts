import fs from "node:fs";
import path from "node:path";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "../../packages/db/src/seed-master/taxonomy/index.ts";

function formatIdentity(s: ParsedSkill): string {
  const varPrefix = s.code.replace(/\./g, "_");
  const prereqsStr = JSON.stringify(s.prerequisites);
  const thinkingStr = JSON.stringify(s.thinking_processes);
  const losStr = s.learning_objectives
    .map(
      (lo) => `    {
      code: ${JSON.stringify(lo.code)},
      behaviour: ${JSON.stringify(lo.behaviour)},
      observable_criteria: ${JSON.stringify(lo.observable_criteria)},
      position: ${lo.position},
    }`
    )
    .join(",\n");

  return `export const ${varPrefix}_IDENTITY: SkillIdentity = {
  code: "${s.code}",
  strand_code: "${s.strand_code}",
  competency_code: "${s.competency_code}",
  name: ${JSON.stringify(s.name)},
  age_min: ${s.age_min},
  age_max: ${s.age_max},
  difficulty: ${s.difficulty},
  thinking_processes: ${thinkingStr},
  tier: "${s.tier}",
  prerequisites: ${prereqsStr},
  learning_objectives: [
${losStr},
  ],
};`;
}

export function convertAllSkillFiles(
  skillsDir = "packages/db/src/seed-content/skills",
  docsDir = "docs/taxonomy"
): void {
  const skills = parseTaxonomyDocs(docsDir);
  console.log(`Parsed ${skills.length} skills from ${docsDir}.`);

  let updatedCount = 0;
  for (const s of skills) {
    const comp = s.competency_code.toLowerCase();
    const strandPart = s.strand_code.split(".")[1]?.toLowerCase();
    if (!strandPart) {
      throw new Error(`Invalid strand code: ${s.strand_code}`);
    }
    const filename = path.join(skillsDir, comp, strandPart, `${s.code}.ts`);
    if (!fs.existsSync(filename)) {
      throw new Error(`Skill file not found: ${filename}`);
    }

    let content = fs.readFileSync(filename, "utf8");
    const varPrefix = s.code.replace(/\./g, "_");

    // Skip if already converted
    if (content.includes(`${varPrefix}_IDENTITY`)) {
      continue;
    }

    // 1. Update import
    content = content.replace(
      'import type { SkillDataset, SkillSeed } from "@mindkid/shared";',
      'import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";'
    );

    // 2. Insert IDENTITY before DATASET
    const datasetExportStr = `export const ${varPrefix}_DATASET: SkillDataset = {`;
    if (!content.includes(datasetExportStr)) {
      throw new Error(`Cannot find dataset export in ${filename}`);
    }
    const identityCode = formatIdentity(s);
    content = content.replace(
      datasetExportStr,
      `${identityCode}\n\n${datasetExportStr}`
    );

    // 3. Update SEED to include identity
    const seedExportStr = `export const ${varPrefix}_SEED: SkillSeed = {`;
    if (!content.includes(seedExportStr)) {
      throw new Error(`Cannot find seed export in ${filename}`);
    }
    content = content.replace(
      seedExportStr,
      `${seedExportStr}\n  identity: ${varPrefix}_IDENTITY,`
    );

    fs.writeFileSync(filename, content, "utf8");
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} skill files.`);
}

if (process.argv[1]?.endsWith("convert-skill-identities.ts")) {
  convertAllSkillFiles();
}
