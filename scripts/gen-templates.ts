#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { generateAllTemplateArtifacts } from "./gen-templates-lib.js";

const rootDir = process.cwd();
const gameEngineDir = resolve(rootDir, "packages", "game-engine");

const files = generateAllTemplateArtifacts(gameEngineDir);

for (const [filePath, content] of files.entries()) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  console.log(`Generated: ${filePath}`);
}

console.log(
  `✅ [gen:templates] Generated ${files.size} template engine artifacts.`
);
