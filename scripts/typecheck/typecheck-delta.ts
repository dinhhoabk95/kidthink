/**
 * Cổng TYPECHECK — mọi project TypeScript của repo phải được chạy, và số lỗi
 * **chỉ được giảm**.
 *
 * Vì sao là bậc thang chứ không phải "phải sạch": `tsconfig.base.json` bật
 * `noUncheckedIndexedAccess` để khớp đúng luật Nuxt đã ép cho `apps/*`. Trước
 * đó lưới gốc tắt flag này, nên `pnpm typecheck` exit 0 trong khi `vue-tsc` trên
 * chính file của `packages/*` báo 686 lỗi. Bật flag làm lộ nợ có sẵn; cấm ngay
 * là cổng đỏ vĩnh viễn và người ta sẽ tắt nó (cùng lý do `BR-TYP-02`).
 *
 * Cổng đọc baseline `typecheck-baseline.json` theo từng project × từng file:
 *   - file tăng lỗi hoặc file mới có lỗi → fail
 *   - lỗi không gắn file (config sai, thiếu .nuxt/) → fail ngay, ❌ NEVER bỏ qua
 *   - giảm → xanh, nhắc chạy `pnpm typecheck:update`
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { type Counts, readCounts, sortCounts } from "./ratchet.ts";

/** Một project = một lần gọi compiler. `cwd` tương đối gốc repo. */
export interface TypecheckProject {
  readonly name: string;
  readonly cwd: string;
  readonly compiler: "tsc" | "vue-tsc";
  readonly project: string;
}

/**
 * Nguồn sự thật duy nhất cho "code nào được typecheck".
 *
 * `packages/*` KHÔNG có dòng riêng: lưới gốc `tsconfig.json` đã phủ chúng bằng
 * glob, nên thêm package mới không phải sửa bảng này. Cổng
 * `lint-workspace-gate` kiểm rằng mỗi package vẫn có `tsconfig.json` riêng cho
 * editor và cùng `extends` một base.
 */
export const TYPECHECK_PROJECTS: readonly TypecheckProject[] = [
  { name: "root", cwd: ".", compiler: "tsc", project: "tsconfig.json" },
  {
    name: "worker",
    cwd: "apps/worker",
    compiler: "tsc",
    project: "tsconfig.json",
  },
  {
    name: "web:app",
    cwd: "apps/web",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.app.json",
  },
  {
    name: "web:server",
    cwd: "apps/web",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.server.json",
  },
  {
    name: "web:shared",
    cwd: "apps/web",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.shared.json",
  },
  {
    name: "web:node",
    cwd: "apps/web",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.node.json",
  },
  {
    name: "admin:app",
    cwd: "apps/admin",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.app.json",
  },
  {
    name: "admin:server",
    cwd: "apps/admin",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.server.json",
  },
  {
    name: "admin:shared",
    cwd: "apps/admin",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.shared.json",
  },
  {
    name: "admin:node",
    cwd: "apps/admin",
    compiler: "vue-tsc",
    project: ".nuxt/tsconfig.node.json",
  },
];

export const BASELINE_PATH = path.join(
  import.meta.dirname,
  "typecheck-baseline.json"
);

/** `src/a.ts(12,5): error TS2532: ...` — cột và mã lỗi không vào khoá. */
const FILE_ERROR = /^(.+?)\((\d+),(\d+)\): error TS\d+:/;
/** `error TS5083: Cannot read file ...` — lỗi cấu hình, không gắn file nào. */
const GLOBAL_ERROR = /^error TS\d+:/;
const SEP = /\\/g;

export interface ProjectErrors {
  /** Đường dẫn tương đối **gốc repo** → số lỗi. */
  readonly files: Counts;
  /** Lỗi không gắn file: cấu hình sai, thiếu `.nuxt/`. Luôn là fail. */
  readonly global: readonly string[];
}

function toRepoRelative(cwd: string, file: string): string {
  const absolute = path.resolve(REPO_ROOT, cwd, file);
  return path.relative(REPO_ROOT, absolute).replace(SEP, "/");
}

/**
 * Đọc stdout của tsc/vue-tsc. Đường dẫn trong output là tương đối `cwd` của lần
 * chạy, nên phải quy về gốc repo — nếu không, `apps/web` và `root` cùng báo một
 * file mà baseline lại thấy hai khoá khác nhau.
 */
export function parseCompilerOutput(
  output: string,
  cwd: string
): ProjectErrors {
  const files: Counts = {};
  const global: string[] = [];

  for (const line of output.split("\n")) {
    const fileMatch = FILE_ERROR.exec(line);
    if (fileMatch?.[1]) {
      const key = toRepoRelative(cwd, fileMatch[1]);
      files[key] = (files[key] ?? 0) + 1;
      continue;
    }
    if (GLOBAL_ERROR.test(line)) {
      global.push(line.trim());
    }
  }

  return { files, global };
}

export type TypecheckBaseline = Record<string, Counts>;

export function readTypecheckBaseline(
  baselinePath: string = BASELINE_PATH
): TypecheckBaseline {
  if (!fs.existsSync(baselinePath)) {
    return {};
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }
  const baseline: TypecheckBaseline = {};
  for (const [project, counts] of Object.entries(parsed)) {
    baseline[project] = readCounts(counts);
  }
  return baseline;
}

export function writeTypecheckBaseline(
  baseline: TypecheckBaseline,
  baselinePath: string = BASELINE_PATH
): void {
  const payload: TypecheckBaseline = {};
  for (const project of Object.keys(baseline).sort()) {
    payload[project] = sortCounts(baseline[project] ?? {});
  }
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
}
