import fs from "node:fs";
import path from "node:path";
import { STATIC_SEED_LEVELS } from "../../packages/content-build/src/catalog.js";

const TS_EXT_REGEX = /\.ts$/;
const LEVELS_REGEX = /levels:\s*\[[\s\S]*?\],?\s*};?\s*$/m;

interface LevelPlanEntry {
  code: string;
  template: string;
  band: string;
  difficulty: number;
  theme: string;
  rounds: number;
  montessori_ref?: string;
  legacy_v1_ref?: string;
}

const skillsDir = path.resolve("packages/content/src/skills");

// 1. Map each skill code to its file path
const skillFilePathMap = new Map<string, string>();
function scanSkillFiles(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanSkillFiles(full);
    } else if (e.isFile() && e.name.endsWith(".ts") && e.name !== "index.ts") {
      const code = e.name.replace(TS_EXT_REGEX, "");
      skillFilePathMap.set(code, full);
    }
  }
}
scanSkillFiles(skillsDir);

console.log(`[convert-static] Found ${skillFilePathMap.size} skill files.`);

// 2. Group static levels by skill code
const levelsBySkill = new Map<string, LevelPlanEntry[]>();
const unmappedLevels: string[] = [];

for (const lvl of STATIC_SEED_LEVELS) {
  const sk = lvl.header.skill_codes?.[0];
  if (!(sk && skillFilePathMap.has(sk))) {
    unmappedLevels.push(lvl.header.code);
    continue;
  }
  const age_min = lvl.header.age_min ?? 3;
  const age_max = lvl.header.age_max ?? 4;
  const band = `${age_min}-${age_max}`;
  const entry: LevelPlanEntry = {
    code: lvl.header.code,
    template: lvl.header.template_code,
    band,
    difficulty: lvl.header.difficulty,
    theme: lvl.header.theme_tag || "farm",
    rounds: lvl.rounds?.length || 3,
  };
  if (lvl.header.montessori_ref) {
    entry.montessori_ref = lvl.header.montessori_ref;
  }
  if (lvl.header.legacy_v1_ref) {
    entry.legacy_v1_ref = lvl.header.legacy_v1_ref;
  }

  const existingList = levelsBySkill.get(sk);
  if (existingList) {
    existingList.push(entry);
  } else {
    levelsBySkill.set(sk, [entry]);
  }
}

if (unmappedLevels.length > 0) {
  console.error(
    `[convert-static] FATAL: ${unmappedLevels.length} unmapped levels:`,
    unmappedLevels
  );
  process.exit(1);
}

console.log(
  `[convert-static] Grouped ${STATIC_SEED_LEVELS.length} static levels across ${levelsBySkill.size} skills.`
);

// 3. Update skill files
let updatedFilesCount = 0;

for (const [skillCode, plans] of levelsBySkill.entries()) {
  const filePath = skillFilePathMap.get(skillCode);
  if (!filePath) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  if (!LEVELS_REGEX.test(content)) {
    console.warn(
      `[convert-static] Could not find levels array in ${skillCode} (${filePath})`
    );
    continue;
  }

  const lines: string[] = ["levels: ["];
  for (const p of plans) {
    lines.push("    {");
    lines.push(`      code: "${p.code}",`);
    lines.push(`      template: "${p.template}",`);
    lines.push(`      band: "${p.band}",`);
    lines.push(`      difficulty: ${p.difficulty},`);
    lines.push(`      theme: "${p.theme}",`);
    lines.push(`      rounds: ${p.rounds},`);
    if (p.montessori_ref) {
      lines.push(`      montessori_ref: "${p.montessori_ref}",`);
    }
    if (p.legacy_v1_ref) {
      lines.push(`      legacy_v1_ref: "${p.legacy_v1_ref}",`);
    }
    lines.push("    },");
  }
  lines.push("  ],");
  lines.push("};\n");

  const replacement = lines.join("\n");
  const newContent = content.replace(LEVELS_REGEX, replacement);
  fs.writeFileSync(filePath, newContent, "utf8");
  updatedFilesCount++;
}

console.log(
  `[convert-static] Successfully updated ${updatedFilesCount} skill files.`
);
