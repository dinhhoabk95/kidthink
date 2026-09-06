import fs from "node:fs";
import path from "node:path";

const TS_EXT_REGEX = /\.ts$/;
const DOT_REGEX = /\./g;

export function generateSkillsIndex(
  contentSkillsDir = "packages/content/src/skills"
): string {
  const skillFiles: { code: string; relPath: string; varPrefix: string }[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".ts") &&
        entry.name !== "index.ts"
      ) {
        const code = entry.name.replace(TS_EXT_REGEX, "");
        const relPath = `./${path
          .relative(contentSkillsDir, fullPath)
          .replace(TS_EXT_REGEX, ".js")}`;
        const varPrefix = code.replace(DOT_REGEX, "_");
        skillFiles.push({ code, relPath, varPrefix });
      }
    }
  }

  scanDir(contentSkillsDir);
  skillFiles.sort((a, b) => a.code.localeCompare(b.code));

  if (skillFiles.length === 0) {
    throw new Error(`No skill files found in ${contentSkillsDir} (BR-SDS-07)`);
  }

  const importLines = skillFiles
    .map(
      (s) =>
        `import { ${s.varPrefix}_DATASET, ${s.varPrefix}_IDENTITY, ${s.varPrefix}_SEED } from "${s.relPath}";`
    )
    .join("\n");

  const datasetEntries = skillFiles
    .map((s) => `  "${s.code}": ${s.varPrefix}_DATASET,`)
    .join("\n");

  const seedEntries = skillFiles
    .map((s) => `  "${s.code}": ${s.varPrefix}_SEED,`)
    .join("\n");

  const identityEntries = skillFiles
    .map((s) => `  "${s.code}": ${s.varPrefix}_IDENTITY,`)
    .join("\n");

  return `/**
 * Generated registry of all ${skillFiles.length} skills (Task #208 / BR-SDS-07).
 * Single Source of Truth: Generated from directory structure.
 */

import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
${importLines}

export const SKILL_DATASETS: Record<string, SkillDataset> = {
${datasetEntries}
};

export const SKILL_SEEDS: Record<string, SkillSeed> = {
${seedEntries}
};

export const SKILL_IDENTITIES: Record<string, SkillIdentity> = {
${identityEntries}
};

export const ALL_SKILL_SEEDS: readonly SkillSeed[] = Object.values(SKILL_SEEDS);

export function getSkillDataset(code: string): SkillDataset | undefined {
  return SKILL_DATASETS[code];
}

export function getSkillSeed(code: string): SkillSeed | undefined {
  return SKILL_SEEDS[code];
}

export function getSkillIdentity(code: string): SkillIdentity | undefined {
  return SKILL_IDENTITIES[code];
}

export function verifyAllSkillsRegistered(): { total: number; valid: boolean } {
  const count = Object.keys(SKILL_SEEDS).length;
  if (count === 0) {
    throw new Error("BR-SDS-07 violation: No registered skills found");
  }
  return { total: count, valid: true };
}
`;
}

export function generateBuildersRegistry(
  buildersDir = "packages/content/src/builders"
): string {
  const entries = fs.readdirSync(buildersDir, { withFileTypes: true });
  const builderFiles: {
    template: string;
    importName: string;
    relFile: string;
  }[] = [];

  for (const entry of entries) {
    if (
      entry.isFile() &&
      entry.name.startsWith("gt-") &&
      entry.name.endsWith(".ts")
    ) {
      const baseName = entry.name.replace(TS_EXT_REGEX, "");
      const digits = baseName.replace("gt-", "");
      const template = `GT-${digits}`;
      const importName = `projectGT${digits}`;
      const relFile = `./${baseName}.js`;
      builderFiles.push({ template, importName, relFile });
    }
  }

  builderFiles.sort((a, b) => a.template.localeCompare(b.template));

  const importLines = builderFiles
    .map((b) => `import { ${b.importName} } from "${b.relFile}";`)
    .join("\n");

  const mapEntries = builderFiles
    .map((b) => `  "${b.template}": ${b.importName},`)
    .join("\n");

  return `/**
 * Generated registry of game level template builders (Task #208).
 * Single Source of Truth: Generated from directory structure.
 */

import type { Projection } from "@mindkid/shared";
${importLines}

export const ALL_BUILDERS: Record<string, Projection> = {
${mapEntries}
};

export const BUILDER_TEMPLATE_CODES: readonly string[] = Object.keys(ALL_BUILDERS);

export function getBuilder(templateCode: string): Projection | undefined {
  return ALL_BUILDERS[templateCode];
}
`;
}

if (process.argv[1]?.endsWith("generate-registries.ts")) {
  const skillsPath = "packages/content/src/skills/index.ts";
  const buildersRegistryPath = "packages/content/src/builders/registry.ts";
  const buildersIndexPath = "packages/content/src/builders/index.ts";

  const skillsIndexContent = generateSkillsIndex();
  fs.writeFileSync(skillsPath, skillsIndexContent, "utf8");
  console.log(`[generate-registries] Generated ${skillsPath}`);

  const buildersRegistryContent = generateBuildersRegistry();
  fs.writeFileSync(buildersRegistryPath, buildersRegistryContent, "utf8");
  console.log(`[generate-registries] Generated ${buildersRegistryPath}`);

  const buildersIndexContent = `export * from "./registry.js";
export * from "./build-levels.js";
export * from "./utils.js";
`;
  fs.writeFileSync(buildersIndexPath, buildersIndexContent, "utf8");
  console.log(`[generate-registries] Generated ${buildersIndexPath}`);
}
