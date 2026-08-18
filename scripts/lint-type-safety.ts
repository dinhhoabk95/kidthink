/**
 * Cổng TYPE-SAFETY `BR-TYP-02` — ép kiểu là nợ chỉ được giảm.
 *
 * Không cấm tuyệt đối: repo đang có ~825 chỗ trong code production, cấm ngay là
 * cổng đỏ vĩnh viễn và người ta sẽ tắt nó. Cổng này đếm theo từng file rồi so
 * với `scripts/type-safety-baseline.json`:
 *   - file tăng số  → fail
 *   - file mới có ép kiểu → fail
 *   - file giảm số  → xanh, nhắc chạy `--update`
 *
 * `as const` KHÔNG bị tính (`BR-TYP-05`): nó làm kiểu hẹp lại, không nói dối.
 *
 * Chạy `node scripts/lint-type-safety.ts` hoặc `--update` để hạ baseline.
 */
import fs from "node:fs";
import path from "node:path";
import {
  isTestPath,
  stripCommentsAndStrings,
  walkSource,
} from "./lint-lib/source-scan.ts";

const ROOTS = ["apps", "packages", "scripts"];
const BASELINE_PATH = path.join(
  import.meta.dirname,
  "type-safety-baseline.json"
);

/**
 * `as T` với T bắt đầu bằng chữ, `{`, `(` hoặc `<`. Loại `as const`.
 * Ép kiểu kiểu `<T>x` cố ý không bắt: trong .ts nó lẫn với generic, và
 * `noExplicitAny` cùng `vue-tsc` đã phủ phần lớn ca đó.
 */
const CAST_PATTERN = /\bas\s+(?!const\b)[A-Za-z_{(<]/g;

/**
 * `any` tường minh. Biome `noExplicitAny` đã chặn ở code production, nhưng
 * ultracite **tắt rule đó cho đường dẫn test** — đo được bằng file thử: cùng
 * đoạn `function f(x: any)` bị bắt ở `server/` và im lặng ở `tests/`.
 * Vì vậy `any` trong test cần bậc thang riêng (`BR-TYP-08`).
 */
const EXPLICIT_ANY_PATTERN = /(?::|<|\bas)\s*any\b/g;

export function countCasts(source: string): number {
  const matches = stripCommentsAndStrings(source).match(CAST_PATTERN);
  return matches ? matches.length : 0;
}

export function countExplicitAny(source: string): number {
  const matches = stripCommentsAndStrings(source).match(EXPLICIT_ANY_PATTERN);
  return matches ? matches.length : 0;
}

export interface Baseline {
  readonly casts: Record<string, number>;
  readonly testAny: Record<string, number>;
}

export function scanRepo(roots: string[] = ROOTS): Baseline {
  const casts: Record<string, number> = {};
  const testAny: Record<string, number> = {};
  for (const root of roots) {
    for (const file of walkSource(root)) {
      const key = file.split(path.sep).join("/");
      const source = fs.readFileSync(file, "utf8");
      if (isTestPath(file)) {
        const n = countExplicitAny(source);
        if (n > 0) {
          testAny[key] = n;
        }
        continue;
      }
      const n = countCasts(source);
      if (n > 0) {
        casts[key] = n;
      }
    }
  }
  return { casts, testAny };
}

export interface RatchetResult {
  readonly increased: readonly { file: string; from: number; to: number }[];
  readonly added: readonly { file: string; to: number }[];
  readonly decreased: readonly { file: string; from: number; to: number }[];
  readonly removed: readonly string[];
}

export function compareToBaseline(
  current: Record<string, number>,
  baseline: Record<string, number>
): RatchetResult {
  const increased: { file: string; from: number; to: number }[] = [];
  const added: { file: string; to: number }[] = [];
  const decreased: { file: string; from: number; to: number }[] = [];
  const removed: string[] = [];

  for (const [file, to] of Object.entries(current)) {
    const from = baseline[file];
    if (from === undefined) {
      added.push({ file, to });
    } else if (to > from) {
      increased.push({ file, from, to });
    } else if (to < from) {
      decreased.push({ file, from, to });
    }
  }
  for (const file of Object.keys(baseline)) {
    if (current[file] === undefined) {
      removed.push(file);
    }
  }
  return { increased, added, decreased, removed };
}

function readCounts(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const counts: Record<string, number> = {};
  for (const [file, n] of Object.entries(value)) {
    if (typeof n === "number") {
      counts[file] = n;
    }
  }
  return counts;
}

function readBaseline(): Baseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    return { casts: {}, testAny: {} };
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    return { casts: {}, testAny: {} };
  }
  return {
    casts: readCounts(Reflect.get(parsed, "casts")),
    testAny: readCounts(Reflect.get(parsed, "testAny")),
  };
}

function sortCounts(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
  );
}

function writeBaseline(baseline: Baseline): void {
  const payload = {
    casts: sortCounts(baseline.casts),
    testAny: sortCounts(baseline.testAny),
  };
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function total(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

function reportRegression(
  label: string,
  rule: string,
  result: RatchetResult
): void {
  process.stdout.write(
    `❌ lint:type-safety — ${result.increased.length + result.added.length} file thêm ${label} (${rule}):\n\n`
  );
  for (const { file, from, to } of result.increased) {
    process.stdout.write(`  ${file}  ${from} → ${to}\n`);
  }
  for (const { file, to } of result.added) {
    process.stdout.write(`  ${file}  file mới, ${to} chỗ\n`);
  }
}

function hasRegression(result: RatchetResult): boolean {
  return result.increased.length > 0 || result.added.length > 0;
}

function main(): void {
  const wantsUpdate = process.argv.includes("--update");
  const current = scanRepo();
  const baseline = readBaseline();
  const isFirstRun =
    Object.keys(baseline.casts).length === 0 &&
    Object.keys(baseline.testAny).length === 0;

  if (isFirstRun) {
    if (wantsUpdate) {
      writeBaseline(current);
      process.stdout.write(
        `✅ lint:type-safety — ghi baseline đầu tiên: ${total(current.casts)} ép kiểu, ${total(current.testAny)} any trong test\n`
      );
      return;
    }
    process.stdout.write(
      "❌ lint:type-safety — chưa có baseline. Chạy `pnpm lint:type-safety --update` một lần để ghi.\n"
    );
    process.exitCode = 1;
    return;
  }

  const castResult = compareToBaseline(current.casts, baseline.casts);
  const anyResult = compareToBaseline(current.testAny, baseline.testAny);

  if (hasRegression(castResult) || hasRegression(anyResult)) {
    if (hasRegression(castResult)) {
      reportRegression("ép kiểu", "BR-TYP-02", castResult);
    }
    if (hasRegression(anyResult)) {
      reportRegression("`any` trong test", "BR-TYP-08", anyResult);
    }
    process.stdout.write(
      "\nXem TYPE-SAFETY §7.3 để biết dùng gì thay ép kiểu.\n"
    );
    process.exitCode = 1;
    return;
  }

  if (wantsUpdate) {
    writeBaseline(current);
    process.stdout.write(
      `✅ lint:type-safety — hạ baseline: ép kiểu ${total(baseline.casts)} → ${total(current.casts)}, any trong test ${total(baseline.testAny)} → ${total(current.testAny)}\n`
    );
    return;
  }

  const dropped =
    total(baseline.casts) -
    total(current.casts) +
    (total(baseline.testAny) - total(current.testAny));
  const note =
    dropped > 0
      ? ` — giảm ${dropped} chỗ, chạy \`pnpm lint:type-safety --update\` để hạ baseline`
      : "";
  process.stdout.write(
    `✅ lint:type-safety — ${total(current.casts)} ép kiểu + ${total(current.testAny)} any trong test, không tăng${note}\n`
  );
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  main();
}
