import fs from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".."
);

export interface ProjectRoot {
  readonly name: string;
  readonly prefix: string;
}

export const PROJECT_ROOTS: readonly ProjectRoot[] = [
  { name: "@mindkid/web", prefix: "apps/web" },
  { name: "@mindkid/admin", prefix: "apps/admin" },
  { name: "@mindkid/worker", prefix: "apps/worker" },
  { name: "@mindkid/adaptive", prefix: "packages/adaptive" },
  { name: "@mindkid/auth", prefix: "packages/auth" },
  { name: "@mindkid/cache", prefix: "packages/cache" },
  { name: "@mindkid/config", prefix: "packages/config" },
  { name: "@mindkid/db", prefix: "packages/db" },
  { name: "@mindkid/emoji", prefix: "packages/emoji" },
  { name: "@mindkid/game-engine", prefix: "packages/game-engine" },
  { name: "@mindkid/moderation", prefix: "packages/moderation" },
  { name: "@mindkid/notification", prefix: "packages/notification" },
  { name: "@mindkid/queue", prefix: "packages/queue" },
  { name: "@mindkid/shared", prefix: "packages/shared" },
  { name: "@mindkid/storage", prefix: "packages/storage" },
  { name: "@mindkid/taxonomy", prefix: "packages/taxonomy" },
  { name: "@mindkid/ui", prefix: "packages/ui" },
  { name: "scripts", prefix: "scripts" },
];

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  ".nuxt",
  ".output",
  "fixtures",
  ".git",
  ".cache",
]);

const TEST_FILE_REGEX = /\.(test|spec)\.(ts|tsx)$/;

export function scanTestFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          walk(path.join(current, entry.name));
        }
      } else if (TEST_FILE_REGEX.test(entry.name)) {
        results.push(path.join(current, entry.name));
      }
    }
  }

  // Quét apps, packages, scripts
  for (const sub of ["apps", "packages", "scripts"]) {
    const full = path.join(dir, sub);
    if (fs.existsSync(full)) {
      walk(full);
    }
  }

  return results;
}

export function resolveProjectForTestFile(relPath: string): string | null {
  const normalized = relPath.replace(/\\/g, "/");
  for (const project of PROJECT_ROOTS) {
    if (normalized.startsWith(`${project.prefix}/`)) {
      return project.name;
    }
  }
  return null;
}
