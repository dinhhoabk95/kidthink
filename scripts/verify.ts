#!/usr/bin/env node
/**
 * scripts/verify.ts — Vòng kiểm thử phạm vi hẹp cho file đang sửa.
 *
 *   pnpm verify                          # file đổi trong git status
 *   pnpm verify packages/game-engine/... # file chỉ định
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

const GIT_STATUS_LINE_REGEX = /^..\s+(.+)$/;
// const TESTABLE_FILE_REGEX = /\.(ts|tsx|vue|js|mjs)$/;

const APP_SUBPATH_MAP: readonly {
  readonly prefix: string;
  readonly project: string;
}[] = [
  { prefix: "apps/web/app/", project: "web:app" },
  { prefix: "apps/web/server/", project: "web:server" },
  { prefix: "apps/web/shared/", project: "web:shared" },
  { prefix: "apps/web/", project: "web:node" },
  { prefix: "apps/admin/app/", project: "admin:app" },
  { prefix: "apps/admin/server/", project: "admin:server" },
  { prefix: "apps/admin/shared/", project: "admin:shared" },
  { prefix: "apps/admin/", project: "admin:node" },
  { prefix: "apps/worker/", project: "worker" },
];

function getChangedFiles(args: string[]): string[] {
  if (args.length > 0) {
    return args
      .map((f) => path.resolve(process.cwd(), f))
      .filter((f) => fs.existsSync(f));
  }

  const gitResult = spawnSync("git", ["status", "--porcelain"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

  if (gitResult.status !== 0) {
    return [];
  }

  const files: string[] = [];
  const lines = gitResult.stdout.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = line.match(GIT_STATUS_LINE_REGEX);
    if (match?.[1]) {
      const filePath = path.join(REPO_ROOT, match[1].trim());
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }
  }

  return files;
}

function resolveProjectForFile(rel: string): string | null {
  for (const item of APP_SUBPATH_MAP) {
    if (rel.startsWith(item.prefix)) {
      return item.project;
    }
  }
  if (rel.startsWith("packages/") || rel.startsWith("scripts/")) {
    return "root";
  }
  return null;
}

function resolveTypecheckProjects(files: string[]): string[] {
  const projects = new Set<string>();

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
    const proj = resolveProjectForFile(rel);
    if (proj) {
      projects.add(proj);
    }
  }

  return Array.from(projects);
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const files = getChangedFiles(args);

  if (files.length === 0) {
    console.log("ℹ Không có file nào thay đổi để verify.");
    process.exit(0);
  }

  const relFiles = files.map((f) => path.relative(REPO_ROOT, f));
  console.log(`▸ Verifying ${files.length} file(s):`);
  for (const f of relFiles.slice(0, 10)) {
    console.log(`  - ${f}`);
  }
  if (relFiles.length > 10) {
    console.log(`  ... và ${relFiles.length - 10} file khác`);
  }

  const startTime = Date.now();

  // 1. Biome check
  console.log("\n▸ Step 1: Biome check");
  const biomeRes = spawnSync("pnpm", ["exec", "biome", "check", ...relFiles], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  if (biomeRes.status !== 0) {
    console.error("✗ Biome check failed.");
    process.exit(1);
  }

  // 2. Typecheck scoped
  const tcProjects = resolveTypecheckProjects(files);
  if (tcProjects.length > 0) {
    console.log(`\n▸ Step 2: Typecheck (${tcProjects.join(", ")})`);
    for (const proj of tcProjects) {
      const tcRes = spawnSync(
        "node",
        ["scripts/typecheck/typecheck-gate.ts", "--only", proj],
        { cwd: REPO_ROOT, stdio: "inherit" }
      );
      if (tcRes.status !== 0) {
        console.error(`✗ Typecheck failed for ${proj}.`);
        process.exit(1);
      }
    }
  }

  // 3. Vitest related (Tạm thời vô hiệu hóa - chuyển sang Manual Test)
  // const testableFiles = relFiles.filter((f) => TESTABLE_FILE_REGEX.test(f));
  // if (testableFiles.length > 0) {
  //   console.log("\n▸ Step 3: Vitest related");
  //   const testRes = spawnSync(
  //     "pnpm",
  //     ["exec", "vitest", "related", ...testableFiles, "--run"],
  //     { cwd: REPO_ROOT, stdio: "inherit" }
  //   );
  //   if (testRes.status !== 0) {
  //     console.error("✗ Vitest related tests failed.");
  //     process.exit(1);
  //   }
  // }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Verify passed in ${duration}s.`);
}

main();
