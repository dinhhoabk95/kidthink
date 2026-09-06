/**
 * Cổng bậc thang đo nợ mã lỗi và exception — Task #254 (WP254.2).
 *
 * 5 phép đo bậc thang:
 * 1. `createError(` trong `apps/web/server/api/**` (trần đầu 365, chỉ giảm)
 * 2. `createError(` ngoài `api/` trong `apps/web/server/**` (trần đầu 13, chỉ giảm)
 * 3. `appError("NOT_FOUND", "<chuỗi>")` (chỉ giảm → 0 ở WP254.9)
 * 4. Lớp `extends Error` trần trong packages/src + services (chỉ giảm → 0 ở WP254.10)
 * 5. Import `appError`/`AppError` từ `@mindkid/auth` (chỉ giảm → 0 ở WP254.11)
 *
 * Usage:
 *   tsx scripts/check-error-codes.ts          # kiểm tra cổng
 *   tsx scripts/check-error-codes.ts --update # hạ baseline
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "@mindkid/config/paths";
import {
  type Counts,
  compareToBaseline,
  hasRegression,
  readCounts,
  refuseIncrease,
  sortCounts,
  total,
} from "./typecheck/ratchet.ts";

export const BASELINE_PATH = path.join(
  REPO_ROOT,
  "scripts/error-codes-baseline.json"
);

export interface ErrorCodesBaseline {
  create_error_api: Counts;
  create_error_server_non_api: Counts;
  app_error_not_found_string: Counts;
  bare_extends_error: Counts;
  auth_shim_imports: Counts;
}

export type MetricKey = keyof ErrorCodesBaseline;

interface MetricDefinition {
  readonly key: MetricKey;
  readonly name: string;
  readonly target: string;
  readonly collect: () => Counts;
}

const BARE_EXTENDS_ERROR_EXCEPTIONS = new Set<string>([
  "MissingEnvError",
  "AlertingUnreachableError",
]);

const CREATE_ERROR_REGEX = /\bcreateError\s*\(/g;
const APP_ERROR_NOT_FOUND_REGEX =
  /\bappError\s*\(\s*["']NOT_FOUND["']\s*,\s*["'`]/g;
const CLASS_EXTENDS_ERROR_REGEX = /\bclass\s+(\w+)\s+extends\s+Error\b/g;
const AUTH_IMPORT_REGEX = /import\s+[^;]+from\s+["']@mindkid\/auth["']/g;
const AUTH_APP_ERROR_IDENTIFIER_REGEX = /\b(appError|AppError)\b/;

function walkFiles(dir: string, fileList: string[] = []): string[] {
  const fullPath = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    return fileList;
  }
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const relative = path.join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".nuxt" &&
        entry.name !== ".output" &&
        entry.name !== "dist" &&
        entry.name !== ".git"
      ) {
        walkFiles(relative, fileList);
      }
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      fileList.push(relative);
    }
  }
  return fileList;
}

function collectCreateErrorApi(): Counts {
  const files = walkFiles("apps/web/server/api");
  const counts: Counts = {};
  for (const file of files) {
    const fullPath = path.join(REPO_ROOT, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const matches = content.match(CREATE_ERROR_REGEX);
    if (matches && matches.length > 0) {
      counts[file] = matches.length;
    }
  }
  return counts;
}

function collectCreateErrorServerNonApi(): Counts {
  const files = walkFiles("apps/web/server").filter(
    (f) => !f.startsWith("apps/web/server/api/")
  );
  const counts: Counts = {};
  for (const file of files) {
    const fullPath = path.join(REPO_ROOT, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const matches = content.match(CREATE_ERROR_REGEX);
    if (matches && matches.length > 0) {
      counts[file] = matches.length;
    }
  }
  return counts;
}

function collectAppErrorNotFoundString(): Counts {
  const files = [...walkFiles("apps"), ...walkFiles("packages")].filter(
    (f) =>
      !(
        f.includes("/tests/") ||
        f.includes("/specs/") ||
        f.startsWith("packages/errors/")
      )
  );
  const counts: Counts = {};
  for (const file of files) {
    const fullPath = path.join(REPO_ROOT, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const matches = content.match(APP_ERROR_NOT_FOUND_REGEX);
    if (matches && matches.length > 0) {
      counts[file] = matches.length;
    }
  }
  return counts;
}

function collectBareExtendsError(): Counts {
  const files = [
    ...walkFiles("packages").filter(
      (f) => f.includes("/src/") && !f.startsWith("packages/errors/")
    ),
    ...walkFiles("apps/web/server/services"),
  ];
  const counts: Counts = {};
  for (const file of files) {
    const fullPath = path.join(REPO_ROOT, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const matches = content.matchAll(CLASS_EXTENDS_ERROR_REGEX);
    let count = 0;
    for (const match of matches) {
      const className = match[1];
      if (className && !BARE_EXTENDS_ERROR_EXCEPTIONS.has(className)) {
        count++;
      }
    }
    if (count > 0) {
      counts[file] = count;
    }
  }
  return counts;
}

function collectAuthShimImports(): Counts {
  const files = [...walkFiles("apps"), ...walkFiles("packages")].filter(
    (f) =>
      !(
        f.startsWith("packages/auth/") ||
        f.includes("/tests/") ||
        f.includes("/specs/")
      )
  );
  const counts: Counts = {};
  for (const file of files) {
    const fullPath = path.join(REPO_ROOT, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const importMatches = content.matchAll(AUTH_IMPORT_REGEX);
    let count = 0;
    for (const im of importMatches) {
      if (AUTH_APP_ERROR_IDENTIFIER_REGEX.test(im[0])) {
        count++;
      }
    }
    if (count > 0) {
      counts[file] = count;
    }
  }
  return counts;
}

export const METRICS: readonly MetricDefinition[] = [
  {
    key: "create_error_api",
    name: "createError( trong apps/web/server/api/**",
    target: "giảm dần → 0 ở WP254.7",
    collect: collectCreateErrorApi,
  },
  {
    key: "create_error_server_non_api",
    name: "createError( ngoài api/ trong apps/web/server/**",
    target: "giảm dần → 0 ở WP254.8",
    collect: collectCreateErrorServerNonApi,
  },
  {
    key: "app_error_not_found_string",
    name: 'appError("NOT_FOUND", "<chuỗi>")',
    target: "giảm dần → 0 ở WP254.9",
    collect: collectAppErrorNotFoundString,
  },
  {
    key: "bare_extends_error",
    name: "Lớp extends Error trần (packages/src + services)",
    target: "giảm dần → 0 ở WP254.10",
    collect: collectBareExtendsError,
  },
  {
    key: "auth_shim_imports",
    name: "Import appError/AppError từ @mindkid/auth",
    target: "giảm dần → 0 ở WP254.11",
    collect: collectAuthShimImports,
  },
];

export function readErrorCodesBaseline(): ErrorCodesBaseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    return {
      create_error_api: {},
      create_error_server_non_api: {},
      app_error_not_found_string: {},
      bare_extends_error: {},
      auth_shim_imports: {},
    };
  }
  const raw = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Record<
    string,
    Record<string, number>
  >;
  return {
    create_error_api: readCounts(raw.create_error_api),
    create_error_server_non_api: readCounts(raw.create_error_server_non_api),
    app_error_not_found_string: readCounts(raw.app_error_not_found_string),
    bare_extends_error: readCounts(raw.bare_extends_error),
    auth_shim_imports: readCounts(raw.auth_shim_imports),
  };
}

export function writeErrorCodesBaseline(baseline: ErrorCodesBaseline): void {
  const sorted: ErrorCodesBaseline = {
    create_error_api: sortCounts(baseline.create_error_api),
    create_error_server_non_api: sortCounts(
      baseline.create_error_server_non_api
    ),
    app_error_not_found_string: sortCounts(baseline.app_error_not_found_string),
    bare_extends_error: sortCounts(baseline.bare_extends_error),
    auth_shim_imports: sortCounts(baseline.auth_shim_imports),
  };
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(sorted, null, 2)}\n`,
    "utf8"
  );
}

function formatStatusIcon(
  regressed: boolean,
  cur: number,
  base: number
): string {
  if (regressed) {
    return "❌";
  }
  if (cur < base) {
    return "⬇";
  }
  return "✅";
}

function formatDelta(cur: number, base: number): string {
  if (cur === base) {
    return "=";
  }
  if (cur < base) {
    return `${cur - base}`;
  }
  return `+${cur - base}`;
}

interface ScanResult {
  readonly currentBaseline: ErrorCodesBaseline;
  readonly anyRegression: boolean;
  readonly totalCurrent: number;
  readonly totalBase: number;
}

function scanMetrics(baseline: ErrorCodesBaseline): ScanResult {
  const currentBaseline: ErrorCodesBaseline = {
    create_error_api: {},
    create_error_server_non_api: {},
    app_error_not_found_string: {},
    bare_extends_error: {},
    auth_shim_imports: {},
  };

  let anyRegression = false;
  let totalCurrent = 0;
  let totalBase = 0;

  process.stdout.write("▸ Cổng bậc thang mã lỗi (Task #254)\n");

  for (const metric of METRICS) {
    const current = metric.collect();
    currentBaseline[metric.key] = current;

    const base = baseline[metric.key] ?? {};
    const result = compareToBaseline(current, base);
    const regressed = hasRegression(result);

    const curTotal = total(current);
    const baseTotal = total(base);
    totalCurrent += curTotal;
    totalBase += baseTotal;

    const icon = formatStatusIcon(regressed, curTotal, baseTotal);
    const delta = formatDelta(curTotal, baseTotal);

    process.stdout.write(
      `  ${icon} ${metric.name.padEnd(52)} ${String(curTotal).padStart(4)} (baseline ${baseTotal}, ${delta}) [${metric.target}]\n`
    );

    if (regressed) {
      anyRegression = true;
      for (const item of result.added) {
        process.stdout.write(`      + [mới] ${item.file}: ${item.to}\n`);
      }
      for (const item of result.increased) {
        process.stdout.write(
          `      ▲ [tăng] ${item.file}: ${item.from} → ${item.to}\n`
        );
      }
    }
  }

  return { currentBaseline, anyRegression, totalCurrent, totalBase };
}

function handleUpdate(
  currentBaseline: ErrorCodesBaseline,
  baseline: ErrorCodesBaseline,
  allowIncrease: boolean,
  totalCurrent: number
): void {
  const worse: string[] = [];
  for (const metric of METRICS) {
    const next = currentBaseline[metric.key];
    const prev = baseline[metric.key] ?? {};
    for (const item of refuseIncrease(next, prev)) {
      worse.push(`${metric.key} · ${item.file}: ${item.from} → ${item.to}`);
    }
  }

  if (worse.length > 0 && !allowIncrease) {
    process.stderr.write(
      "\n❌ --update bị từ chối: Nợ tăng ở các mục dưới đây (bậc thang chỉ đi xuống):\n" +
        worse.map((line) => `   ${line}\n`).join("") +
        "   Sửa lỗi, hoặc chạy với --allow-increase kèm lý do rõ ràng.\n"
    );
    process.exit(1);
  }

  writeErrorCodesBaseline(currentBaseline);
  process.stdout.write(
    `\n✅ Đã cập nhật scripts/error-codes-baseline.json (Tổng nợ: ${totalCurrent})\n`
  );
}

function main(): void {
  const args = process.argv.slice(2);
  const update = args.includes("--update");
  const allowIncrease = args.includes("--allow-increase");

  const baseline = readErrorCodesBaseline();
  const result = scanMetrics(baseline);

  if (update) {
    handleUpdate(
      result.currentBaseline,
      baseline,
      allowIncrease,
      result.totalCurrent
    );
    return;
  }

  if (result.anyRegression) {
    process.stderr.write(
      "\n❌ Cổng bậc thang mã lỗi đỏ: Có nợ mới phát sinh.\n" +
        "   Mã mới ❌ KHÔNG được dùng createError, class extends Error trần, hoặc import auth shim.\n" +
        "   Dùng lớp domain của @mindkid/errors.\n"
    );
    process.exit(1);
  }

  if (result.totalCurrent < result.totalBase) {
    process.stdout.write(
      `\n⬇ Nợ đã giảm: ${result.totalBase} → ${result.totalCurrent}. Chạy \`pnpm check:error-codes:update\` để chốt mốc mới.\n`
    );
  } else {
    process.stdout.write(
      `\n✅ Cổng xanh: Tổng nợ ${result.totalCurrent}, không có nợ mới.\n`
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
