/**
 * Cổng bậc thang API surface — Task #264 (L0).
 *
 * Đo các khoản nợ có thể nhìn thấy bằng tĩnh trong route API. Baseline chỉ
 * được hạ: thêm nợ mới hoặc thêm file mới có nợ đều làm cổng đỏ.
 *
 * Usage:
 *   pnpm check:api-surface
 *   pnpm check:api-surface --update
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "@mindkid/config/paths";
import {
  type ApiRoute,
  listApiRoutes,
} from "../apps/web/tests/gates/rate-limit-coverage.ts";
import { stripCommentsAndStrings } from "../apps/web/tests/security/route-validation.ts";
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
  "scripts/api-surface-baseline.json"
);

import { resolveRequestBodySizeLimit } from "../packages/shared/src/rate-limit-routes.ts";

export interface ApiSurfaceSource {
  readonly route: ApiRoute;
  readonly source: string;
}

export interface ApiSurfaceBaseline {
  body_size_missing: Counts;
  same_origin_in_route: Counts;
  raw_zod_parse: Counts;
  manager_remote_ip: Counts;
  raw_read_body: Counts;
  not_on_factory: Counts;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BODY_READ =
  /\b(?:readBody|readRawBody|readRequestBody|readValidatedBody)\s*\(/;
const SAME_ORIGIN_GUARD = /\bassert(?:Manager)?SameOriginRequest\b/;
const RAW_ZOD_PARSE =
  /\b(?!JSON\.)[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.parse\s*\(/;
const MANAGER_REMOTE_IP = /\bgetManagerRemoteIp\s*\(/;
const RAW_READ_BODY = /\breadBody\s*\(/;
const DEFINE_API_ROUTE = /export\s+default\s+defineApiRoute\s*\(/;

function countMatches(source: string, pattern: RegExp): number {
  return source.match(new RegExp(pattern.source, "g"))?.length ?? 0;
}

function emptyBaseline(): ApiSurfaceBaseline {
  return {
    body_size_missing: {},
    same_origin_in_route: {},
    raw_zod_parse: {},
    manager_remote_ip: {},
    raw_read_body: {},
    not_on_factory: {},
  };
}

function addCount(counts: Counts, file: string, value: number): void {
  if (value > 0) {
    counts[file] = value;
  }
}

function detectRequiredMinSize(source: string): number {
  if (source.includes("PROOF_MAX_IMAGE_SIZE_BYTES")) {
    return 5 * 1024 * 1024;
  }
  if (source.includes("MAX_FILE_SIZE")) {
    return 2 * 1024 * 1024;
  }
  if (source.includes("readMultipartFormData")) {
    return 1024 * 1024;
  }
  return 0;
}

function hasMissingBodySize(
  route: ApiRoute,
  source: string,
  code: string
): boolean {
  if (!MUTATING_METHODS.has(route.method)) {
    return false;
  }
  const required = detectRequiredMinSize(source);
  const resolvedLimit = resolveRequestBodySizeLimit(route.path);
  if (required > 0) {
    return resolvedLimit === null || resolvedLimit < required;
  }
  if (BODY_READ.test(code) && !route.path.startsWith("/api/guest/webhooks/")) {
    return resolvedLimit === null;
  }
  return false;
}

export function collectApiSurfaceCounts(
  sources: readonly ApiSurfaceSource[]
): ApiSurfaceBaseline {
  const counts = emptyBaseline();

  for (const { route, source } of sources) {
    const code = stripCommentsAndStrings(source);

    if (hasMissingBodySize(route, source, code)) {
      addCount(counts.body_size_missing, route.file, 1);
    }

    addCount(
      counts.same_origin_in_route,
      route.file,
      countMatches(code, SAME_ORIGIN_GUARD)
    );
    addCount(
      counts.raw_zod_parse,
      route.file,
      countMatches(code, RAW_ZOD_PARSE)
    );
    addCount(
      counts.manager_remote_ip,
      route.file,
      countMatches(code, MANAGER_REMOTE_IP)
    );
    addCount(
      counts.raw_read_body,
      route.file,
      countMatches(code, RAW_READ_BODY)
    );
    if (!DEFINE_API_ROUTE.test(code)) {
      addCount(counts.not_on_factory, route.file, 1);
    }
  }

  return counts;
}

function readApiSurfaceBaseline(): ApiSurfaceBaseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    return emptyBaseline();
  }
  const raw = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Record<
    string,
    Record<string, number>
  >;
  return {
    body_size_missing: readCounts(raw.body_size_missing),
    same_origin_in_route: readCounts(raw.same_origin_in_route),
    raw_zod_parse: readCounts(raw.raw_zod_parse),
    manager_remote_ip: readCounts(raw.manager_remote_ip),
    raw_read_body: readCounts(raw.raw_read_body),
    not_on_factory: readCounts(raw.not_on_factory),
  };
}

function writeApiSurfaceBaseline(baseline: ApiSurfaceBaseline): void {
  const sorted: ApiSurfaceBaseline = {
    body_size_missing: sortCounts(baseline.body_size_missing),
    same_origin_in_route: sortCounts(baseline.same_origin_in_route),
    raw_zod_parse: sortCounts(baseline.raw_zod_parse),
    manager_remote_ip: sortCounts(baseline.manager_remote_ip),
    raw_read_body: sortCounts(baseline.raw_read_body),
    not_on_factory: sortCounts(baseline.not_on_factory),
  };
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(sorted, null, 2)}\n`,
    "utf8"
  );
}

function collectCurrentBaseline(): ApiSurfaceBaseline {
  const routes = listApiRoutes();
  const sources = routes.map((route): ApiSurfaceSource => {
    const filePath = path.join(REPO_ROOT, "apps/web/server/api", route.file);
    return { route, source: fs.readFileSync(filePath, "utf8") };
  });
  return collectApiSurfaceCounts(sources);
}

const METRICS: readonly {
  key: keyof ApiSurfaceBaseline;
  label: string;
}[] = [
  { key: "body_size_missing", label: "mutating body không có trần" },
  { key: "same_origin_in_route", label: "same-origin guard trong route" },
  { key: "raw_zod_parse", label: "Zod .parse() trần" },
  { key: "manager_remote_ip", label: "getManagerRemoteIp" },
  { key: "raw_read_body", label: "readBody(event) thô" },
  { key: "not_on_factory", label: "chưa dùng defineApiRoute" },
];

function reportMetric(
  key: keyof ApiSurfaceBaseline,
  label: string,
  current: ApiSurfaceBaseline,
  baseline: ApiSurfaceBaseline
): boolean {
  const currentCounts = current[key];
  const baselineCounts = baseline[key];
  const result = compareToBaseline(currentCounts, baselineCounts);
  const currentTotal = total(currentCounts);
  const baselineTotal = total(baselineCounts);
  let icon = "✅";
  if (hasRegression(result)) {
    icon = "❌";
  } else if (currentTotal < baselineTotal) {
    icon = "⬇";
  }

  process.stdout.write(
    `  ${icon} ${label.padEnd(34)} ${String(currentTotal).padStart(3)} (baseline ${baselineTotal})\n`
  );

  for (const item of result.added) {
    process.stdout.write(`      + [mới] ${key} · ${item.file}: ${item.to}\n`);
  }
  for (const item of result.increased) {
    process.stdout.write(
      `      ▲ [tăng] ${key} · ${item.file}: ${item.from} → ${item.to}\n`
    );
  }
  return hasRegression(result);
}

export function findApiSurfaceRegressions(
  current: ApiSurfaceBaseline,
  baseline: ApiSurfaceBaseline
): string[] {
  const worse: string[] = [];
  for (const metric of METRICS) {
    for (const item of refuseIncrease(
      current[metric.key],
      baseline[metric.key]
    )) {
      worse.push(`${metric.key} · ${item.file}: ${item.from} → ${item.to}`);
    }
  }
  return worse;
}

function handleUpdate(
  current: ApiSurfaceBaseline,
  baseline: ApiSurfaceBaseline,
  hasBaseline: boolean
): void {
  const force = process.argv.includes("--force");
  if (hasBaseline && !force) {
    const worse = findApiSurfaceRegressions(current, baseline);
    if (worse.length > 0) {
      process.stderr.write(
        "❌ --update bị từ chối: baseline chỉ được giảm. Dùng --force nếu có lý do hợp lệ.\n" +
          worse.map((line) => `   ${line}\n`).join("")
      );
      process.exit(1);
    }
  } else if (!(hasBaseline || force)) {
    process.stderr.write(
      "❌ --update bị từ chối: baseline vắng mặt. Bắt buộc có --force để gieo baseline ban đầu.\n"
    );
    process.exit(1);
  }
  writeApiSurfaceBaseline(current);
  process.stdout.write(
    `✅ Đã cập nhật ${path.relative(REPO_ROOT, BASELINE_PATH)}\n`
  );
}

function main(): void {
  const current = collectCurrentBaseline();
  const hasBaseline = fs.existsSync(BASELINE_PATH);
  const baseline = readApiSurfaceBaseline();
  let regressed = false;

  process.stdout.write("▸ Cổng bậc thang API surface (Task #264)\n");
  for (const metric of METRICS) {
    regressed =
      reportMetric(metric.key, metric.label, current, baseline) || regressed;
  }

  if (process.argv.includes("--update")) {
    handleUpdate(current, baseline, hasBaseline);
    return;
  }
  if (regressed) {
    process.stderr.write("❌ Cổng API surface đỏ: có nợ mới phát sinh.\n");
    process.exit(1);
  }
  process.stdout.write("✅ Cổng xanh: không có nợ mới.\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
