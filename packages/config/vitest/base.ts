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

/*
 * Hai khoá đã gỡ khỏi khối trên ngày 2026-09-02 vì **vitest 4 không còn đọc chúng**
 * (đối chiếu `InlineConfig` trong `vitest/dist/chunks/reporters.d.*.d.ts`):
 *
 *   minWorkers: 1              → khoá không còn tồn tại
 *   forks: { singleFork: true } → `poolOptions`/`forks`/`threads` bị gỡ ở vitest 4
 *
 * Spread một object `as const` vào `test:` KHÔNG kích hoạt excess property check của
 * TypeScript, nên hai khoá chết này type-check sạch và không cổng nào báo — đúng dạng
 * "xanh giả" mà repo đã trả giá nhiều lần.
 *
 * Hệ quả cần biết khi đọc số đo: thứ thật sự ép chạy tuần tự là `fileParallelism:false`
 * (vitest tự hạ `maxWorkers` về 1 khi nó tắt). `singleFork` — gom mọi file vào MỘT tiến
 * trình — thì **đã không còn hiệu lực từ lúc nâng lên vitest 4**, nên mỗi file test vẫn
 * bị dựng lại module registry. Đo lại 2026-09-02 máy rảnh trên `packages/game-engine`:
 * `Duration 72,75 s (transform 4,99 s, import 25,00 s, tests 12,67 s)` — phần việc THẬT
 * chỉ 12,67 s, còn `import` một mình đã 25 s.
 */

/** Chừa một core cho tiến trình chính của vitest và cho máy. */
const PARALLEL_WORKER_RESERVE = 1;

/**
 * Cấu hình cho workspace **không** mở kết nối PostgreSQL nào.
 *
 * Đo 2026-09-02 trên `packages/game-engine` (65 file, 1.039 test, 0 file chạm DB).
 * Cả bốn lượt đều **máy rảnh, cache ấm**, và đều ra 65 file / 1.039 test xanh:
 *
 * | Cấu hình                             | Wall clock | so với hiện tại |
 * |--------------------------------------|------------|-----------------|
 * | `SEQUENTIAL_DEFAULTS` (đang dùng)     | 74,0 s     | —               |
 * | `forks` + song song                   | 21,9 s     | 3,4×            |
 * | **`threads` + song song + `isolate`** | **16,3 s** | **4,5×**        |
 * | `threads` + song song, `isolate:false`| 9,0 s      | 8,2×            |
 *
 * Hai điều rút ra:
 *
 * 1. `pool:"threads"` thắng `forks` (16,3 s vs 21,9 s) vì phần việc thật chỉ chiếm
 *    một phần nhỏ tổng số — phần còn lại là `import` dựng lại module registry cho
 *    từng file. Thread chia sẻ tiến trình nên dựng rẻ hơn fork.
 *
 * 2. `isolate:false` nhanh hơn nữa (9,0 s) nhưng **CHƯA dùng**, và Cấm — NEVER bật
 *    nó chỉ vì con số. Nó bỏ ranh giới module giữa các file test: file nào lỡ đổi
 *    state ở tầng module sẽ rò sang file sau, và một lượt xanh KHÔNG chứng minh
 *    được điều ngược lại — lỗi kiểu này phụ thuộc thứ tự chạy. Muốn bật thì phải
 *    có phép đo riêng cho chuyện rò state, không phải phép đo thời gian.
 *
 * ❗ Số cũ ghi ở bản trước (91,7 → 23,3 s, và "isolate:false CHẬM HƠN, 43,9 s") đo
 * khi máy đang chạy song song việc khác nên **sai**; `isolate:false` thật ra nhanh
 * hơn. Cấm — NEVER đo lại các con số này khi còn tiến trình nặng khác trên máy.
 */
export const PARALLEL_DEFAULTS = {
  fileParallelism: true,
  maxWorkers: Math.max(1, cpus().length - PARALLEL_WORKER_RESERVE),
  maxConcurrency: 5,
  pool: "threads" as const,
  // `isolate` là khoá **cấp cao nhất** ở vitest 4; `poolOptions.threads.isolate`
  // của vitest 3 bị gỡ và chỉ in một dòng DEPRECATED rồi bỏ qua.
  isolate: true,
  // Test trong CÙNG một file vẫn chạy nối đuôi. Song song ở đây là song song
  // **giữa các file**, đúng thứ `fileParallelism` bật. Cho phép `concurrent`
  // trong file là đổi hợp đồng của từng bài test, không phải đổi cách chạy.
  sequence: { concurrent: false },
} as const;

const BASE_TIMEOUT_MS = 30_000;

/**
 * Một `globalSetup` cho mọi workspace: dựng database test nếu chưa có, chạy
 * migration, rồi TRUNCATE.
 *
 * Đặt ở đây thay vì trong từng `vitest.config.ts` vì workspace nào quên khai
 * sẽ chạy trên database dev — đúng cách 1.117 dòng fixture lọt vào catalog
 * công khai. File sống trong `packages/db` vì nó cần biết danh sách bảng và
 * thư mục migration.
 */
const DATABASE_GLOBAL_SETUP = path.join(
  REPO_ROOT,
  "packages",
  "db",
  "tests",
  "global-setup.ts"
);

/**
 * Mọi test của repo sống dưới `src/` hoặc `tests/` của một workspace — không có
 * ngoại lệ nào khác (đo 2026-08-28 trên 339 file).
 *
 * Khai ở đây thay vì trong từng `vitest.config.ts` vì bỏ sót một nhánh là test
 * **im lặng không chạy**: `packages/shared/src/program-showcase.test.ts` từng
 * nằm ngoài mọi `include` và không cổng nào báo. Cổng giữ bất biến này đã bị
 * gỡ 2026-08-29 — file test nằm ngoài `include` giờ lại im lặng như cũ.
 */
export const WORKSPACE_TEST_INCLUDE: readonly string[] = [
  "src/**/*.{test,spec}.{ts,tsx}",
  "tests/**/*.{test,spec}.{ts,tsx}",
];

/**
 * `tests/**​/fixtures/` là **mẫu văn bản** cho cổng quét, không phải test:
 * ca âm cố ý sai kiểu, cố ý sai vị trí, cố ý import thứ package không có.
 * Cùng lý do `tsconfig.json` gốc loại chúng khỏi typecheck.
 */
export const WORKSPACE_TEST_EXCLUDE: readonly string[] = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.nuxt/**",
  "**/.output/**",
  "**/fixtures/**",
];

/**
 * Database KHÔNG tồn tại, trên loopback.
 *
 * Workspace khai `database: false` vẫn được nhận hai biến này thay vì bị bỏ
 * trống. Bỏ trống là nguy hiểm hơn hẳn: `requireEnv` nạp `.env` ở gốc repo, nên
 * một test tưởng là thuần mà lỡ mở kết nối sẽ ghi thẳng vào **database dev** —
 * đúng sự cố đã đo 2026-08-30 (1.117 dòng fixture lọt vào catalog công khai,
 * xem `test-database.ts`). Trỏ vào một tên không tồn tại thì lần mở kết nối đó
 * **đỏ ngay và nói rõ**, thay vì âm thầm thành công ở nhầm chỗ.
 *
 * Host là loopback để `assertDisposableDatabaseUrl` (BR-TST-05) vẫn đúng nếu có
 * đường mã nào chạm tới.
 */
const NO_DATABASE_URL =
  "postgresql://mindkid_no_db:mindkid_no_db@127.0.0.1:5433/mindkid_khong_co_database_cho_test_thuan";

export interface WorkspaceTestOptions {
  /**
   * `false` khi **không file test nào** của workspace mở kết nối PostgreSQL.
   *
   * Mặc định `true` — quên khai thì workspace vẫn chạy tuần tự và vẫn có
   * `globalSetup`. Đó là chiều fail-safe: chậm mà đúng, chứ Cấm — NEVER để một
   * workspace chạm DB lặng lẽ rơi vào nhóm song song.
   *
   * Kiểm bằng đo, không bằng trí nhớ:
   * `grep -rl '@mindkid/db\|from "postgres"\|getOwnerDb\|drizzle-orm' <workspace>`
   * ra rỗng thì mới được khai `false`. Cổng
   * `packages/config/tests/vitest-projects.test.ts` giữ bất biến này.
   */
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
      // Database RIÊNG cho test, dựng và dọn bởi `globalSetup` bên dưới.
      // `requireEnv` nạp `.env` nhưng Cấm — NEVER ghi đè biến đã có giá trị,
      // nên hai dòng này thắng file `.env` của máy dev.
      env: usesDatabase
        ? { DATABASE_URL: owner, DATABASE_URL_APP: app }
        : { DATABASE_URL: NO_DATABASE_URL, DATABASE_URL_APP: NO_DATABASE_URL },
      // `globalSetup` chạy migration + TRUNCATE 81 bảng ở MỖI lần gọi vitest.
      // A/B trên CÙNG `packages/taxonomy` (1 file), 3 lượt, máy rảnh:
      //   có globalSetup  4,12 / 4,65 / 4,91 s
      //   không globalSetup 2,85 / 3,14 / 3,26 s
      // → **~1,5 s** thuế cố định mỗi lần gọi vitest. Nhỏ so với phần song song,
      // nhưng workspace không chạm DB thì đó là trả cho việc không dùng — và nó
      // cũng là thứ gây `deadlock detected` khi hai `vitest run` cùng chạm
      // `mindkid_test` (đã đo 2026-09-02).
      ...(usesDatabase ? { globalSetup: [DATABASE_GLOBAL_SETUP] } : {}),
      ...(usesDatabase ? SEQUENTIAL_DEFAULTS : PARALLEL_DEFAULTS),
    },
  });

  return mergeConfig(base, overrides);
}
