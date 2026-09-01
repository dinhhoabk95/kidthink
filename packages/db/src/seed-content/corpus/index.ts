import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ContentSeed } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMP_DIR_REGEX = /^c[1-6]$/i;

export function loadAllGeneratedCorpusLevels(): ContentSeed<
  unknown,
  unknown
>[] {
  const corpusDir = __dirname;
  if (!fs.existsSync(corpusDir)) {
    return [];
  }

  const levels: ContentSeed<unknown, unknown>[] = [];
  const entries = fs.readdirSync(corpusDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && COMP_DIR_REGEX.test(entry.name)) {
      const compDir = path.join(corpusDir, entry.name);
      const files = fs
        .readdirSync(compDir)
        .filter((f) => f.endsWith(".json"))
        .sort();

      for (const file of files) {
        const filePath = path.join(compDir, file);
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(content) as ContentSeed<unknown, unknown>[];
          levels.push(...parsed);
        } catch {
          // Bỏ qua nếu file trống hoặc đang ghi
        }
      }
    }
  }

  return levels;
}

export const ALL_GENERATED_LEVELS: ContentSeed<unknown, unknown>[] =
  loadAllGeneratedCorpusLevels();
