import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "@mindkid/config/paths";
import {
  buildSpecIndex,
  evaluateGenCheck,
  type GenCheckResult,
  generateGameSessionFromSpec,
  generateRoutesFromSpec,
  generateSchemaFromSpec,
  generateTestsFromSpec,
  generateZodFromSpec,
  parseSpecMarkdown,
} from "@mindkid/shared";

const BACKSLASH_REGEX = /\\/g;

function walkFiles(
  dir: string,
  predicate: (filePath: string) => boolean
): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== "dist" &&
        entry.name !== ".nuxt" &&
        entry.name !== ".output"
      ) {
        results.push(...walkFiles(fullPath, predicate));
      }
    } else if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

export function collectRepoSpecs(rootDir = REPO_ROOT) {
  const specsDir = path.join(rootDir, "docs/specs");
  const specFiles = walkFiles(specsDir, (f) => f.endsWith(".md"));
  const rootSpec = path.join(rootDir, "docs/SPEC.md");
  if (fs.existsSync(rootSpec)) {
    specFiles.push(rootSpec);
  }

  return specFiles.map((fullPath) => ({
    specPath: path.relative(rootDir, fullPath).replace(BACKSLASH_REGEX, "/"),
    markdown: fs.readFileSync(fullPath, "utf8"),
  }));
}

export function runRepoGenCheck(rootDir = REPO_ROOT): GenCheckResult {
  const specEntries = collectRepoSpecs(rootDir);
  const index = buildSpecIndex(specEntries, new Date().toISOString());

  const codeFiles = walkFiles(
    rootDir,
    (f) =>
      f.endsWith(".ts") &&
      !f.endsWith("quality-rules.test.ts") &&
      !f.endsWith("ai-codegen-pipeline.test.ts") &&
      !f.endsWith("codegen-pipeline.ts") &&
      !f.endsWith("cli.ts")
  );

  const generatedFiles: { filePath: string; content: string }[] = [];
  for (const fullPath of codeFiles) {
    const content = fs.readFileSync(fullPath, "utf8");
    if (content.trimStart().startsWith("// AUTO-GENERATED")) {
      generatedFiles.push({
        filePath: path
          .relative(rootDir, fullPath)
          .replace(BACKSLASH_REGEX, "/"),
        content,
      });
    }
  }

  return evaluateGenCheck({
    specs: index.specs,
    generatedFiles,
  });
}

function resolveTargetSpec(specArg: string | undefined) {
  if (!specArg) {
    throw new Error("Missing --spec=<path-or-slug> argument.");
  }
  const entries = collectRepoSpecs(REPO_ROOT);
  const found = entries.find(
    (e) =>
      e.specPath === specArg ||
      e.specPath.endsWith(`/${specArg}.md`) ||
      e.specPath.endsWith(specArg)
  );
  if (!found) {
    throw new Error(`Spec not found for '${specArg}'.`);
  }
  return parseSpecMarkdown(found.specPath, found.markdown);
}

const GENERATORS: Record<
  string,
  (
    spec: ReturnType<typeof parseSpecMarkdown>,
    options: { allowTask14Exception: boolean }
  ) => string
> = {
  tests: (spec) => generateTestsFromSpec(spec),
  zod: (spec, options) => generateZodFromSpec(spec, options),
  routes: (spec, options) => generateRoutesFromSpec(spec, options),
  schema: (spec, options) => generateSchemaFromSpec(spec, options),
  session: (spec, options) => generateGameSessionFromSpec(spec, options),
};

function main(): void {
  const command = process.argv[2] ?? "check";
  const specFlag = process.argv
    .slice(3)
    .find((arg) => arg.startsWith("--spec="))
    ?.slice("--spec=".length);
  const allowTask14 = process.argv.includes("--allow-task-14");

  if (command === "spec-index") {
    const entries = collectRepoSpecs(REPO_ROOT);
    const index = buildSpecIndex(entries, new Date().toISOString());
    const outPath = path.join(REPO_ROOT, "scripts/codegen/spec-index.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
    process.stdout.write(
      `✅ Indexed ${index.specs.length} specs -> scripts/codegen/spec-index.json\n`
    );
    return;
  }

  if (command === "check") {
    const result = runRepoGenCheck(REPO_ROOT);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) {
      process.exit(1);
    }
    return;
  }

  const generator = GENERATORS[command];
  if (!generator) {
    throw new Error(`Unknown codegen command: ${command}`);
  }

  const parsedSpec = resolveTargetSpec(specFlag);
  process.stdout.write(
    generator(parsedSpec, { allowTask14Exception: allowTask14 })
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
