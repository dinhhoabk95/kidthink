import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

const TS_EXT_REGEX = /\.ts$/;
const LEVELS_REGEX = /levels:\s*\[[\s\S]*?\],?\s*};?\s*$/m;

const REGEX_CODE = /code:\s*"([^"]+)"/;
const REGEX_TEMPLATE = /template:\s*"([^"]+)"/;
const REGEX_BAND = /band:\s*"([^"]+)"/;
const REGEX_DIFF = /difficulty:\s*(\d+)/;
const REGEX_THEME = /theme:\s*"([^"]+)"/;
const REGEX_ROUNDS = /rounds:\s*(\d+)/;
const REGEX_MONT = /montessori_ref:\s*"([^"]+)"/;
const REGEX_LEGACY = /legacy_v1_ref:\s*"([^"]+)"/;
const REGEX_OBJECT = /\{([\s\S]*?)\}/g;

const skillsDir = path.resolve("packages/content/src/skills");

// 1. Map skill codes to file paths
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
console.log(`[restore-corpus] Found ${skillFilePathMap.size} skill files.`);

// 2. Parse existing static plans from each skill file (retaining only those with a valid code)
function parseExistingPlans(content: string): LevelPlanEntry[] {
  const levelsMatch = content.match(LEVELS_REGEX);
  if (!levelsMatch) {
    return [];
  }
  const body = levelsMatch[0];
  const plans: LevelPlanEntry[] = [];
  for (const match of body.matchAll(REGEX_OBJECT)) {
    const block = match[1];
    if (!block) {
      continue;
    }
    const codeM = block.match(REGEX_CODE);
    if (!codeM?.[1]) {
      continue; // Skip placeholders without code
    }
    const templateM = block.match(REGEX_TEMPLATE);
    const bandM = block.match(REGEX_BAND);
    const diffM = block.match(REGEX_DIFF);
    const themeM = block.match(REGEX_THEME);
    const roundsM = block.match(REGEX_ROUNDS);
    const montM = block.match(REGEX_MONT);
    const legM = block.match(REGEX_LEGACY);

    const code = codeM[1];
    const template = templateM?.[1] ?? "GT-001";
    const band = bandM?.[1] ?? "3-4";
    const difficulty = diffM?.[1] ? Number.parseInt(diffM[1], 10) : 1;
    const theme = themeM?.[1] ?? "farm";
    const rounds = roundsM?.[1] ? Number.parseInt(roundsM[1], 10) : 3;

    plans.push({
      code,
      template,
      band,
      difficulty,
      theme,
      rounds,
      montessori_ref: montM?.[1],
      legacy_v1_ref: legM?.[1],
    });
  }
  return plans;
}

const plansBySkill = new Map<string, LevelPlanEntry[]>();
let initialStaticPlanCount = 0;

for (const [code, filePath] of skillFilePathMap.entries()) {
  const content = fs.readFileSync(filePath, "utf8");
  const existingPlans = parseExistingPlans(content);
  plansBySkill.set(code, existingPlans);
  initialStaticPlanCount += existingPlans.length;
}

console.log(
  `[restore-corpus] Parsed ${initialStaticPlanCount} existing static level plans across skill files.`
);

// 3. Read 5,013 corpus levels from git commit 6183d378^
const corpusFiles = execSync(
  "git ls-tree -r --name-only 6183d378^ packages/content-build/src/corpus"
)
  .toString()
  .trim()
  .split("\n");

console.log(
  `[restore-corpus] Found ${corpusFiles.length} corpus JSON files in git tree.`
);

let totalCorpusLoaded = 0;
let corpusAppended = 0;

for (const relPath of corpusFiles) {
  if (!relPath.endsWith(".json")) {
    continue;
  }
  const raw = execSync(`git show 6183d378^:${relPath}`).toString();
  const list = JSON.parse(raw);

  for (const lvl of list) {
    totalCorpusLoaded++;
    const sk = lvl.header.skill_codes?.[0];
    if (!(sk && plansBySkill.has(sk))) {
      console.warn(
        `[restore-corpus] Unmapped skill code: ${sk} for level ${lvl.header.code}`
      );
      continue;
    }

    const plans = plansBySkill.get(sk);
    if (!plans) {
      continue;
    }
    // Check for duplicate code
    if (plans.some((p) => p.code === lvl.header.code)) {
      continue;
    }

    const band = `${lvl.header.age_min ?? 3}-${lvl.header.age_max ?? 4}`;
    const plan: LevelPlanEntry = {
      code: lvl.header.code,
      template: lvl.header.template_code,
      band,
      difficulty: lvl.header.difficulty,
      theme: lvl.header.theme_tag || "farm",
      rounds: lvl.rounds?.length || 3,
    };
    if (lvl.header.montessori_ref) {
      plan.montessori_ref = lvl.header.montessori_ref;
    }
    if (lvl.header.legacy_v1_ref) {
      plan.legacy_v1_ref = lvl.header.legacy_v1_ref;
    }

    plans.push(plan);
    corpusAppended++;
  }
}

console.log(
  `[restore-corpus] Loaded ${totalCorpusLoaded} corpus levels, appended ${corpusAppended} new plans.`
);

// 4. Update all skill files
let updatedFilesCount = 0;
let totalFinalPlans = 0;

for (const [skillCode, plans] of plansBySkill.entries()) {
  const filePath = skillFilePathMap.get(skillCode);
  if (!filePath) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  if (!LEVELS_REGEX.test(content)) {
    console.warn(
      `[restore-corpus] Could not find levels array in ${skillCode} (${filePath})`
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
  totalFinalPlans += plans.length;
}

console.log(
  `[restore-corpus] Successfully updated ${updatedFilesCount} skill files with ${totalFinalPlans} total level plans.`
);
