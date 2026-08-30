/**
 * Chạy toàn bộ project TypeScript của repo và so với baseline.
 *
 *   node scripts/typecheck/typecheck-gate.ts            # cổng
 *   node scripts/typecheck/typecheck-gate.ts --update   # hạ baseline
 *   node scripts/typecheck/typecheck-gate.ts --only web:app
 *
 * ❌ NEVER gọi `nuxt typecheck`: nó nạp `nuxt.config.ts` nên chết khi thiếu env,
 * và bản trước của nó exit 0 im lặng. Cổng gọi thẳng `vue-tsc -p` trên từng
 * `.nuxt/tsconfig.*.json` — deterministic, không phụ thuộc env.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "@mindkid/config/paths";
import {
  compareToBaseline,
  hasRegression,
  refuseIncrease,
  total,
} from "./ratchet.ts";
import {
  type ProjectErrors,
  parseCompilerOutput,
  readTypecheckBaseline,
  TYPECHECK_PROJECTS,
  type TypecheckBaseline,
  type TypecheckProject,
  writeTypecheckBaseline,
} from "./typecheck-delta.ts";

const COMPILER_BIN: Record<TypecheckProject["compiler"], string[]> = {
  tsc: ["node_modules/.bin/tsc"],
  // vue-tsc chỉ được cài trong app Nuxt, không hoist lên gốc.
  "vue-tsc": ["node_modules/.bin/vue-tsc"],
};

function resolveCompiler(project: TypecheckProject): string {
  const candidates = [
    path.join(REPO_ROOT, project.cwd, COMPILER_BIN[project.compiler][0] ?? ""),
    path.join(REPO_ROOT, COMPILER_BIN[project.compiler][0] ?? ""),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Không tìm thấy ${project.compiler} cho project ${project.name}. Chạy \`pnpm install\`.`
  );
}

function runProject(project: TypecheckProject): ProjectErrors {
  const cwd = path.join(REPO_ROOT, project.cwd);
  const configPath = path.join(cwd, project.project);
  if (!fs.existsSync(configPath)) {
    // Thiếu `.nuxt/` là cổng KHÔNG chạy được, ❌ NEVER bỏ qua im lặng.
    return {
      files: {},
      global: [
        `${project.project} không tồn tại — chạy \`pnpm --filter @mindkid/${path.basename(project.cwd)} exec nuxt prepare\` trước.`,
      ],
    };
  }
  const result = spawnSync(
    resolveCompiler(project),
    ["--noEmit", "-p", project.project],
    { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  return interpretCompilerRun(result, project.cwd);
}

/** Hình dạng của `spawnSync` mà cổng thực sự đọc — tách ra để kiểm được. */
export interface CompilerRun {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly error?: Error;
  readonly stdout?: string;
  readonly stderr?: string;
}

/**
 * Trạng thái thoát của trình biên dịch là **dữ liệu của cổng**, không phải rác.
 *
 * Bản cũ vứt cả ba (`status`, `signal`, `error`) và chỉ parse stdout/stderr.
 * Hậu quả cụ thể: `vue-tsc` trên `web:app` (685 lỗi, 172 file) bị OOM kill sau
 * khi in 200 diagnostic → parser đọc 200 → mọi file đều "giảm" →
 * `hasRegression` chỉ nhìn `increased`/`added` nên không thấy gì →
 * cổng in `⬇ -485`, exit 0, rồi **bảo người chạy `typecheck:update`**, tức xoá
 * vĩnh viễn 485 lỗi đã biết khỏi bậc thang. Một stack trace của trình biên dịch
 * hay `ENOBUFS` ở mốc 64 MB cũng cho ra đúng kết quả xanh đó.
 *
 * `global.length > 0` đã buộc `regressed` ở `reportProject`, nên mọi nhánh dưới
 * đây đi thẳng ra exit 1.
 */
export function interpretCompilerRun(
  result: CompilerRun,
  cwd: string
): ProjectErrors {
  if (result.error) {
    return {
      files: {},
      global: [`không chạy được trình biên dịch — ${result.error.message}`],
    };
  }
  if (result.signal !== null) {
    return {
      files: {},
      global: [
        `trình biên dịch bị giết bởi ${result.signal} — kết quả không dùng được`,
      ],
    };
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const parsed = parseCompilerOutput(output, cwd);

  // `tsc`: 0 = sạch, 1/2 = có diagnostic. Khác 0 mà không đọc được diagnostic
  // nào nghĩa là nó nổ, hoặc định dạng output đã đổi.
  if (
    result.status !== 0 &&
    parsed.global.length === 0 &&
    total(parsed.files) === 0
  ) {
    return {
      ...parsed,
      global: [
        `exit ${result.status} nhưng không phân tích được diagnostic nào — định dạng output đã đổi?`,
      ],
    };
  }
  return parsed;
}

interface ProjectReport {
  readonly project: TypecheckProject;
  readonly errors: ProjectErrors;
  readonly regressed: boolean;
  readonly missingBaseline: boolean;
  readonly current: number;
  readonly baseline: number;
}

function reportProject(
  project: TypecheckProject,
  baseline: TypecheckBaseline
): ProjectReport {
  const errors = runProject(project);
  const known = baseline[project.name];
  const ratchet = compareToBaseline(errors.files, known ?? {});
  return {
    project,
    errors,
    regressed: hasRegression(ratchet) || errors.global.length > 0,
    missingBaseline: known === undefined,
    current: total(errors.files),
    baseline: total(known ?? {}),
  };
}

function formatDelta(delta: number): string {
  if (delta === 0) {
    return "=";
  }
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function statusMark(report: ProjectReport, delta: number): string {
  if (report.regressed) {
    return "❌";
  }
  // Chưa có dòng baseline thì con số hiện tại chưa nói được gì — Cấm hiện ✅,
  // vì dấu đó cạnh một lần chạy exit 1 là output tự mâu thuẫn.
  if (report.missingBaseline) {
    return "❔";
  }
  return delta < 0 ? "⬇" : "✅";
}

function describe(report: ProjectReport): string {
  const { project, current, baseline } = report;
  const delta = current - baseline;
  return `${statusMark(report, delta)} ${project.name.padEnd(14)} ${String(current).padStart(5)} lỗi (baseline ${baseline}, ${formatDelta(delta)})`;
}

/**
 * `--only web` chọn cả bốn project của apps/web, `--only web:app` chọn đúng một.
 * Khớp theo tiền tố vì một app Nuxt là **nhiều** project tsconfig — lọc bằng tên
 * đầy đủ thì gọi "kiểm apps/web" phải nhớ liệt kê đủ bốn, và thiếu một là vùng
 * đó không được kiểm mà không cổng nào báo.
 */
function selectProjects(only: string): readonly TypecheckProject[] {
  return TYPECHECK_PROJECTS.filter(
    (p) => p.name === only || p.name.startsWith(`${only}:`)
  );
}

/**
 * Ghi baseline mới — chỉ khi lượt chạy sạch và bậc thang không đi lên.
 *
 * Hai chốt chặn, cả hai đều thiếu ở bản cũ:
 * 1. Một project không chạy xong có `files` rỗng; ghi nó xuống là **xoá sạch**
 *    bậc thang của project đó.
 * 2. `--update` cũ ghi đè bằng số hiện tại bất kể tăng hay giảm, và nó đã được
 *    dùng đúng như thế: +187 lỗi ở Task #124, +7 ở Task #125.
 */
function applyUpdate(
  reports: readonly ProjectReport[],
  baseline: TypecheckBaseline,
  allowIncrease: boolean
): void {
  const broken = reports.filter((r) => r.errors.global.length > 0);
  if (broken.length > 0) {
    process.stderr.write(
      `\n❌ --update bị từ chối: ${broken.map((r) => r.project.name).join(", ")} không chạy xong.\n`
    );
    process.exit(1);
  }

  const next: TypecheckBaseline = { ...baseline };
  const worse: string[] = [];
  for (const report of reports) {
    const previous = baseline[report.project.name] ?? {};
    for (const item of refuseIncrease(report.errors.files, previous)) {
      worse.push(
        `${report.project.name} · ${item.file}: ${item.from} → ${item.to}`
      );
    }
    next[report.project.name] = report.errors.files;
  }

  if (worse.length > 0 && !allowIncrease) {
    process.stderr.write(
      "\n❌ --update sẽ TĂNG nợ ở những file dưới đây. Bậc thang chỉ đi xuống:\n" +
        worse.map((line) => `   ${line}\n`).join("") +
        "   Sửa lỗi, hoặc chạy lại với --allow-increase kèm lý do trong PR.\n"
    );
    process.exit(1);
  }

  writeTypecheckBaseline(next);
  process.stdout.write("\n✅ đã ghi typecheck-baseline.json\n");
}

function main(): void {
  const args = process.argv.slice(2);
  const update = args.includes("--update");
  const allowIncrease = args.includes("--allow-increase");
  const onlyIndex = args.indexOf("--only");
  const only = onlyIndex === -1 ? undefined : args[onlyIndex + 1];
  const projects = only ? selectProjects(only) : TYPECHECK_PROJECTS;

  if (projects.length === 0) {
    process.stderr.write(
      `Không có project tên "${only}". Có: ${TYPECHECK_PROJECTS.map((p) => p.name).join(", ")}.\n`
    );
    process.exit(2);
  }

  const baseline = readTypecheckBaseline();
  const reports = projects.map((project) => reportProject(project, baseline));

  for (const report of reports) {
    process.stdout.write(`${describe(report)}\n`);
    for (const line of report.errors.global) {
      process.stdout.write(`   ⛔ ${line}\n`);
    }
  }

  if (update) {
    applyUpdate(reports, baseline, allowIncrease);
    return;
  }

  // Hai lý do đỏ, hai câu khác nhau: "có lỗi mới" nói sai về một project sạch
  // mà chỉ thiếu dòng baseline, và câu sai thì người đọc đi sửa nhầm chỗ.
  const regressed = reports.filter((r) => r.regressed);
  const unbaselined = reports.filter((r) => !r.regressed && r.missingBaseline);

  if (regressed.length > 0) {
    process.stderr.write(
      `\n❌ typecheck: ${regressed.map((r) => r.project.name).join(", ")} có lỗi mới.\n` +
        "   Sửa lỗi, hoặc nếu đã giảm thật thì chạy `pnpm typecheck:update`.\n"
    );
  }
  if (unbaselined.length > 0) {
    process.stderr.write(
      `\n❔ typecheck: ${unbaselined.map((r) => r.project.name).join(", ")} chưa có dòng baseline.\n` +
        "   Chạy `pnpm typecheck:update` để chốt mức hiện tại.\n"
    );
  }
  if (regressed.length > 0 || unbaselined.length > 0) {
    process.exit(1);
  }

  const dropped = reports.filter((r) => r.current < r.baseline);
  if (dropped.length > 0) {
    process.stdout.write(
      "\n⬇ Nợ đã giảm — chạy `pnpm typecheck:update` để chốt mức mới.\n"
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
