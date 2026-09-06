import fs from "node:fs";
import path from "node:path";
import { SKILL_IDENTITIES } from "@mindkid/content";
import type { SkillIdentity } from "@mindkid/shared";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "../../packages/content-build/src/seed-master/taxonomy/index.ts";

export const COMPETENCY_DOC_FILES = [
  "c1-mathematical-thinking.md",
  "c2-spatial-thinking.md",
  "c3-logical-thinking.md",
  "c4-observation-thinking.md",
  "c5-language-thinking.md",
  "c6-executive-function.md",
];

const STRAND_HEADER_REGEX = /^##\s+(C[1-6]\.[A-Z]{2,5})\s+—/;

function formatTier(tier: string): string {
  if (tier === "pre") {
    return "p";
  }
  if (tier === "basic") {
    return "b";
  }
  if (tier === "core") {
    return "c";
  }
  return "a";
}

export function formatSkillMarkdownRow(s: SkillIdentity): string {
  const ageStr =
    s.age_min === s.age_max ? String(s.age_min) : `${s.age_min}–${s.age_max}`;
  const prereqStr =
    s.prerequisites.length === 0 ? "—" : s.prerequisites.join(" · ");
  const thinkingStr = s.thinking_processes.map((t) => `\`${t}\``).join(" ");
  const tierStr = formatTier(s.tier);
  return `| ${s.code} | ${s.name} | ${ageStr} | ${s.difficulty} | ${prereqStr} | ${thinkingStr} | ${tierStr} |`;
}

function assertSkillMatches(ts: SkillIdentity, md: ParsedSkill): void {
  if (ts.code !== md.code) {
    throw new Error(
      `Code mismatch for ${md.code}: TS="${ts.code}" MD="${md.code}"`
    );
  }
  if (ts.strand_code !== md.strand_code) {
    throw new Error(
      `Strand mismatch for ${md.code}: TS="${ts.strand_code}" MD="${md.strand_code}"`
    );
  }
  if (ts.competency_code !== md.competency_code) {
    throw new Error(
      `Competency mismatch for ${md.code}: TS="${ts.competency_code}" MD="${md.competency_code}"`
    );
  }
  if (ts.name !== md.name) {
    throw new Error(
      `Name mismatch for ${md.code}: TS="${ts.name}" MD="${md.name}"`
    );
  }
  if (ts.age_min !== md.age_min || ts.age_max !== md.age_max) {
    throw new Error(
      `Age mismatch for ${md.code}: TS=${ts.age_min}-${ts.age_max} MD=${md.age_min}-${md.age_max}`
    );
  }
  if (ts.difficulty !== md.difficulty) {
    throw new Error(
      `Difficulty mismatch for ${md.code}: TS=${ts.difficulty} MD=${md.difficulty}`
    );
  }
  if (ts.tier !== md.tier) {
    throw new Error(
      `Tier mismatch for ${md.code}: TS="${ts.tier}" MD="${md.tier}"`
    );
  }
  if (JSON.stringify(ts.prerequisites) !== JSON.stringify(md.prerequisites)) {
    throw new Error(
      `Prerequisites mismatch for ${md.code}: TS=${JSON.stringify(ts.prerequisites)} MD=${JSON.stringify(md.prerequisites)}`
    );
  }
  if (
    JSON.stringify(ts.thinking_processes) !==
    JSON.stringify(md.thinking_processes)
  ) {
    throw new Error(
      `Thinking processes mismatch for ${md.code}: TS=${JSON.stringify(ts.thinking_processes)} MD=${JSON.stringify(md.thinking_processes)}`
    );
  }
}

/**
 * Validates that all 413 TypeScript skill identities match markdown tables field-by-field.
 */
export function verifyIdentitiesVsMarkdown(docsDir = "docs/taxonomy"): {
  total: number;
  matches: number;
} {
  const parsedMarkdownSkills = parseTaxonomyDocs(docsDir);
  const tsSkills = Object.values(SKILL_IDENTITIES);

  if (tsSkills.length !== 413 || parsedMarkdownSkills.length !== 413) {
    throw new Error(
      `Counts mismatch: TS=${tsSkills.length} MD=${parsedMarkdownSkills.length} (expected 413)`
    );
  }

  const tsMap = new Map<string, SkillIdentity>(
    tsSkills.map((s) => [s.code, s])
  );

  for (const md of parsedMarkdownSkills) {
    const ts = tsMap.get(md.code);
    if (!ts) {
      throw new Error(
        `Skill ${md.code} exists in Markdown but not in TypeScript`
      );
    }
    assertSkillMatches(ts, md);
  }

  return { total: 413, matches: 413 };
}

function buildSkillsByStrand(): Map<string, SkillIdentity[]> {
  const skillsByStrand = new Map<string, SkillIdentity[]>();
  for (const s of Object.values(SKILL_IDENTITIES)) {
    const list = skillsByStrand.get(s.strand_code) ?? [];
    list.push(s);
    skillsByStrand.set(s.strand_code, list);
  }
  return skillsByStrand;
}

function processTableBlock(
  lines: string[],
  startIndex: number,
  strandSkills: SkillIdentity[],
  newLines: string[]
): number {
  newLines.push(lines[startIndex] ?? "");
  let i = startIndex + 1;
  if (i < lines.length) {
    newLines.push(lines[i] ?? "");
  }
  for (const s of strandSkills) {
    newLines.push(formatSkillMarkdownRow(s));
  }
  while (
    i + 1 < lines.length &&
    (lines[i + 1] ?? "").startsWith("| C") &&
    (lines[i + 1] ?? "").includes(".")
  ) {
    i++;
  }
  return i;
}

/**
 * Regenerates the markdown tables in docs/taxonomy/*.md from TypeScript skill identities.
 * Keeps all prose, headers, and explanations outside the skill tables intact.
 */
export function generateTaxonomyDoc(
  filename: string,
  docsDir = "docs/taxonomy"
): string {
  const filePath = path.isAbsolute(filename)
    ? filename
    : path.join(docsDir, filename);
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const skillsByStrand = buildSkillsByStrand();
  const newLines: string[] = [];

  let currentStrand: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const strandMatch = line.match(STRAND_HEADER_REGEX);
    if (strandMatch) {
      currentStrand = strandMatch[1] ?? null;
      newLines.push(line);
      continue;
    }

    if (currentStrand && line.startsWith("| Code | Skill |")) {
      const strandSkills = skillsByStrand.get(currentStrand) ?? [];
      i = processTableBlock(lines, i, strandSkills, newLines);
      continue;
    }

    newLines.push(line);
  }

  return newLines.join("\n");
}

/**
 * Syncs or checks all 6 taxonomy markdown documents against TypeScript definitions.
 */
export function syncTaxonomyDocs(options: {
  write?: boolean;
  check?: boolean;
  docsDir?: string;
}): { success: boolean; modifiedFiles: string[] } {
  const docsDir = options.docsDir ?? "docs/taxonomy";
  const isWrite = Boolean(options.write);
  const modifiedFiles: string[] = [];

  if (!isWrite) {
    verifyIdentitiesVsMarkdown(docsDir);
  }

  for (const filename of COMPETENCY_DOC_FILES) {
    const filePath = path.join(docsDir, filename);
    const orig = fs.readFileSync(filePath, "utf8");
    const generated = generateTaxonomyDoc(filename, docsDir);

    if (orig !== generated) {
      if (isWrite) {
        fs.writeFileSync(filePath, generated, "utf8");
        modifiedFiles.push(filename);
      } else {
        throw new Error(
          `Drift detected in ${filename}! Run 'pnpm gen:taxonomy-docs' to sync.`
        );
      }
    }
  }

  if (isWrite) {
    verifyIdentitiesVsMarkdown(docsDir);
  }

  return { success: true, modifiedFiles };
}

// CLI execution
if (process.argv[1]?.endsWith("sync-taxonomy-docs.ts")) {
  const isWrite = process.argv.includes("--write");
  const isCheck = process.argv.includes("--check") || !isWrite;

  try {
    const res = syncTaxonomyDocs({ write: isWrite, check: isCheck });
    if (isWrite) {
      console.log(
        `[taxonomy-docs] Synced. Modified files: ${res.modifiedFiles.length}`
      );
    } else {
      console.log(
        "[taxonomy-docs] Check passed! 413/413 skills byte-identical with TypeScript."
      );
    }
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[taxonomy-docs] Error: ${message}`);
    process.exit(1);
  }
}
