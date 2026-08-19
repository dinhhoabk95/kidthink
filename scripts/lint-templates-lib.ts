import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { LAYOUT_IDS } from "../packages/game-engine/src/layout/registry.js";
import {
  discoverTemplates,
  generateAllTemplateArtifacts,
} from "./gen-templates-lib.js";

export interface TemplateLintViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: string;
  readonly message: string;
}

const GT_CODE_REGEX = /^GT-\d{3}$/;
const LAYOUTS_REGEX = /layouts:\s*\[([^\]]+)\]/;
const PROMPT_REGEX = /prompt:\s*["']/g;

function lintTemplateFixtures(
  entry: string,
  fixturesFile: string
): TemplateLintViolation[] {
  const violations: TemplateLintViolation[] = [];
  if (!existsSync(fixturesFile)) {
    violations.push({
      templateCode: entry,
      file: fixturesFile,
      rule: "BR-TAK-09",
      message: `Missing mandatory fixtures.ts in ${entry} (must have >= 3 sample levels)`,
    });
    return violations;
  }

  const content = readFileSync(fixturesFile, "utf8");
  const matches = content.match(PROMPT_REGEX);
  const count = matches ? matches.length : 0;
  if (count < 3) {
    violations.push({
      templateCode: entry,
      file: fixturesFile,
      rule: "BR-TAK-09",
      message: `Template ${entry} has ${count} sample levels in fixtures.ts, requires >= 3`,
    });
  }
  return violations;
}

function lintSingleTemplateDir(
  templatesDir: string,
  entry: string
): TemplateLintViolation[] {
  const violations: TemplateLintViolation[] = [];
  const dirPath = join(templatesDir, entry);
  if (!statSync(dirPath).isDirectory()) {
    return violations;
  }

  if (!GT_CODE_REGEX.test(entry)) {
    violations.push({
      templateCode: entry,
      rule: "BR-TAK-07",
      message: `Template folder "${entry}" does not conform to format ^GT-\\d{3}$`,
    });
    return violations;
  }

  const templateFile = join(dirPath, "template.ts");
  const sessionFile = join(dirPath, "session.ts");
  const fixturesFile = join(dirPath, "fixtures.ts");

  if (!existsSync(templateFile)) {
    violations.push({
      templateCode: entry,
      file: templateFile,
      rule: "BR-TAK-01",
      message: `Missing mandatory file template.ts in ${entry}`,
    });
  }

  if (!existsSync(sessionFile)) {
    violations.push({
      templateCode: entry,
      file: sessionFile,
      rule: "BR-TAK-01",
      message: `Missing mandatory file session.ts in ${entry}`,
    });
  }

  violations.push(...lintTemplateFixtures(entry, fixturesFile));
  return violations;
}

export function lintTemplateDirectories(
  templatesDir: string
): TemplateLintViolation[] {
  const violations: TemplateLintViolation[] = [];
  if (!existsSync(templatesDir)) {
    violations.push({
      rule: "BR-TAK-01",
      message: `Templates directory does not exist: ${templatesDir}`,
    });
    return violations;
  }

  const entries = readdirSync(templatesDir);
  for (const entry of entries) {
    violations.push(...lintSingleTemplateDir(templatesDir, entry));
  }

  return violations;
}

export function lintGeneratedArtifacts(
  gameEngineDir: string
): TemplateLintViolation[] {
  const violations: TemplateLintViolation[] = [];
  const expectedFiles = generateAllTemplateArtifacts(gameEngineDir);

  for (const [filePath, expectedContent] of expectedFiles.entries()) {
    if (!existsSync(filePath)) {
      violations.push({
        file: filePath,
        rule: "BR-TAK-03",
        message: `Generated artifact missing: ${filePath}. Run \`pnpm gen:templates\`.`,
      });
      continue;
    }

    const actualContent = readFileSync(filePath, "utf8");
    if (actualContent.trim() !== expectedContent.trim()) {
      violations.push({
        file: filePath,
        rule: "BR-TAK-03",
        message: `Generated artifact is out-of-sync or modified manually (BR-TAK-03): ${filePath}. Run \`pnpm gen:templates\`.`,
      });
    }
  }

  return violations;
}

export function lintTemplateLayouts(
  templatesDir: string
): TemplateLintViolation[] {
  const violations: TemplateLintViolation[] = [];
  const templates = discoverTemplates(templatesDir);
  const validLayouts: Set<string> = new Set(LAYOUT_IDS);

  for (const t of templates) {
    const templateContent = readFileSync(t.templateFile, "utf8");
    const layoutsMatch = templateContent.match(LAYOUTS_REGEX);
    if (!layoutsMatch?.[1]) {
      continue;
    }

    const layoutStrings = layoutsMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    for (const layout of layoutStrings) {
      if (!validLayouts.has(layout)) {
        violations.push({
          templateCode: t.code,
          file: t.templateFile,
          rule: "BR-TAK-12",
          message: `Template ${t.code} declares invalid layout "${layout}" not registered in LAYOUT_IDS`,
        });
      }
    }
  }

  return violations;
}

export function scanAllTemplateGates(
  gameEngineDir: string
): TemplateLintViolation[] {
  const templatesDir = join(gameEngineDir, "src", "templates");
  const violations: TemplateLintViolation[] = [];

  violations.push(...lintTemplateDirectories(templatesDir));
  violations.push(...lintGeneratedArtifacts(gameEngineDir));
  violations.push(...lintTemplateLayouts(templatesDir));

  return violations;
}
