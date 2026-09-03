import fs from "node:fs";
import { cpus } from "node:os";
import path from "node:path";
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";
import { testDatabaseUrls } from "./test-database.ts";

/**
 * Config vitest dùng chung cho mọi workspace (cấu hình chung sống ở đúng một
 * package, không copy vào từng app).
 *
 * Trước file này, 15 file `vitest.config.ts` tự viết lại cùng một bảng alias
 * `@mindkid/*` bằng đường dẫn tương đối khác nhau — thêm một package là phải sửa
 * N chỗ, và chỗ nào quên thì test ở đó resolve vào `dist/` không tồn tại.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");

/** Một dòng alias khớp chính xác specifier — vite nhận RegExp ở `find`. */
interface ExactAlias {
  readonly find: RegExp;
  readonly replacement: string;
}

const SLASH = /\//g;
const NUXT_IMPORTS_SPECIFIER = /^#imports$/;

/**
 * `@mindkid/db` khớp, `@mindkid/db/schema` không.
 *
 * Alias dạng **chuỗi** của vite thay theo tiền tố, nên `"@mindkid/config"` biến
 * `@mindkid/config/paths` thành `.../src/index.ts/paths`. Subpath phải đi qua
 * `exports` của package, vì vậy chỉ specifier trần được alias.
 */
function exactSpecifier(name: string): RegExp {
  return new RegExp(`^${name.replace(SLASH, "\\/")}$`);
}

/**
 * Quét `packages/*` thay vì khai tay: package mới có `src/index.ts` là được phủ
 * ngay, không phải nhớ thêm một dòng alias (cùng lý do root `tsconfig.json`
 * dùng glob `packages/*`).
 */
function scanWorkspaceEntries(): [string, string][] {
  const packagesDir = path.join(REPO_ROOT, "packages");
  const entries: [string, string][] = [];

  for (const dirent of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const entry = path.join(packagesDir, dirent.name, "src", "index.ts");
    if (fs.existsSync(entry)) {
      entries.push([`@mindkid/${dirent.name}`, entry]);
    }
  }

  return entries;
}

/**
 * `#imports` là auto-import ảo của Nuxt — ngoài runtime Nuxt nó không tồn tại,
 * nên test trỏ vào mock dùng chung của apps/web.
 */
const NUXT_IMPORTS_MOCK = path.join(
  REPO_ROOT,
  "apps",
  "web",
  "tests",
  "mock-imports.ts"
);

export function workspaceAliases(): ExactAlias[] {
  return [
    ...scanWorkspaceEntries().map(([name, entry]) => ({
      find: exactSpecifier(name),
      replacement: entry,
    })),
    { find: NUXT_IMPORTS_SPECIFIER, replacement: NUXT_IMPORTS_MOCK },
  ];
}

export interface PrefixAlias {
  readonly find: string;
  readonly replacement: string;
}

/**
 * Alias tiền tố dạng chuỗi dành riêng cho Nuxt apps (apps/web, apps/admin) dưới vitest.
 *
 * Dùng chuỗi trần thay vì RegExp vì các route file có thể chứa ký tự ngoặc vuông
 * như `[uuid]`, nếu là RegExp sẽ bị hiểu nhầm là character class.
 */
export function nuxtAppAliases(appRoot: string): PrefixAlias[] {
  return [
    { find: "~", replacement: path.join(appRoot, "app") },
    { find: "@", replacement: path.join(appRoot, "app") },
    { find: "~~", replacement: appRoot },
    { find: "@@", replacement: appRoot },
    { find: "#server", replacement: path.join(appRoot, "server") },
    { find: "#shared", replacement: path.join(appRoot, "shared") },
  ];
}

/**
 * Chạy tuần tự là mặc định có chủ đích, không phải tối ưu bỏ sót: test tích hợp
 * dùng PostgreSQL + Valkey thật (BR-TST-02) nên hai file chạy song song sẽ tranh
 * cùng một hàng dữ liệu. Package nào thuần pure function được phép ghi đè.
 */
export const SEQUENTIAL_DEFAULTS = {
  fileParallelism: false,
  maxWorkers: 1,
  maxConcurrency: 1,
  pool: "forks" as const,
  sequence: { concurrent: false },
} as const;

const PARALLEL_WORKER_RESERVE = 1;

export const PARALLEL_DEFAULTS = {
  fileParallelism: true,
  maxWorkers: Math.max(1, cpus().length - PARALLEL_WORKER_RESERVE),
  maxConcurrency: 5,
  pool: "threads" as const,
  isolate: true,
  sequence: { concurrent: false },
} as const;

const BASE_TIMEOUT_MS = 30_000;

/**
 * Một `globalSetup` cho mọi workspace: dựng database test nếu chưa có, chạy
 * migration, rồi TRUNCATE.
 */
const DATABASE_GLOBAL_SETUP = path.join(
  REPO_ROOT,
  "packages",
  "db",
  "tests",
  "global-setup.ts"
);

export const WORKSPACE_TEST_INCLUDE: readonly string[] = [
  "src/**/*.{test,spec}.{ts,tsx}",
  "tests/**/*.{test,spec}.{ts,tsx}",
];

export const WORKSPACE_TEST_EXCLUDE: readonly string[] = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.nuxt/**",
  "**/.output/**",
  "**/fixtures/**",
];

const NO_DATABASE_URL =
  "postgresql://mindkid_no_db:mindkid_no_db@127.0.0.1:5433/mindkid_khong_co_database_cho_test_thuan";

export interface WorkspaceTestOptions {
  readonly database?: boolean;
}

/** Điểm vào duy nhất cho `vitest.config.ts` của workspace. */
export function defineWorkspaceTest(
  overrides: ViteUserConfig = {},
  options: WorkspaceTestOptions = {}
): ViteUserConfig {
  const usesDatabase = options.database ?? true;
  const { owner, app } = testDatabaseUrls();
  const base = defineConfig({
    resolve: { alias: workspaceAliases() },
    test: {
      environment: "node",
      include: [...WORKSPACE_TEST_INCLUDE],
      exclude: [...WORKSPACE_TEST_EXCLUDE],
      testTimeout: BASE_TIMEOUT_MS,
      env: usesDatabase
        ? { DATABASE_URL: owner, DATABASE_URL_APP: app }
        : { DATABASE_URL: NO_DATABASE_URL, DATABASE_URL_APP: NO_DATABASE_URL },
      ...(usesDatabase ? { globalSetup: [DATABASE_GLOBAL_SETUP] } : {}),
      ...(usesDatabase ? SEQUENTIAL_DEFAULTS : PARALLEL_DEFAULTS),
    },
  });

  return mergeConfig(base, overrides);
}
