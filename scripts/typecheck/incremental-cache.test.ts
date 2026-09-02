import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import ts from "typescript";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Cổng cho cache typecheck (Task #204, `#204.6` và `#204.7`).
 *
 * Bật `incremental` là đánh đổi: nhanh hơn nhiều, nhưng nếu cache **nuốt một lỗi
 * mới** thì cổng typecheck xanh giả — dạng hỏng đắt nhất trong repo này. Nên bài
 * quan trọng ở đây không phải "có nhanh không" mà là **ca âm**: chạy lượt ấm trên
 * một file vừa bị tiêm lỗi thì phải đỏ, đúng file, đúng mã lỗi.
 *
 * Bài chạy `tsc` thật trên một project bé dựng trong thư mục tạm, không mock.
 */

const BASE_CONFIG = path.join(
  REPO_ROOT,
  "packages",
  "config",
  "tsconfig.base.json"
);
const TSC_BIN = path.join(REPO_ROOT, "node_modules", ".bin", "tsc");
const TS_ERROR_LINE = /error TS\d+/;
const NOT_ASSIGNABLE = /TS2322/;
/** Biến `configDir` của TS 5.5+, khớp bằng regex để tránh placeholder trong chuỗi. */
const CONFIG_DIR_TOKEN = /\$\{configDir\}/;

const workspaces: string[] = [];

function makeProject(): { dir: string; source: string; buildInfo: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-tsinc-"));
  workspaces.push(dir);
  const buildInfo = path.join(dir, ".cache", "probe.tsbuildinfo");
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({
      extends: BASE_CONFIG,
      compilerOptions: {
        types: [],
        incremental: true,
        tsBuildInfoFile: buildInfo,
      },
      include: ["probe.ts"],
    })
  );
  return { dir, source: path.join(dir, "probe.ts"), buildInfo };
}

function runTsc(dir: string): { status: number; output: string } {
  const result = spawnSync(TSC_BIN, ["--noEmit", "-p", "tsconfig.json"], {
    cwd: dir,
    encoding: "utf8",
  });
  return {
    status: result.status ?? -1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

afterAll(() => {
  for (const dir of workspaces) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * `tsconfig.base.json` là JSONC (có comment), nên `JSON.parse` chết ở dòng 2.
 * Dùng đúng parser mà `tsc` dùng — Cấm — NEVER bóc comment bằng regex, vì một
 * chuỗi chứa `//` sẽ bị cắt nhầm và bài kiểm lại đo sai thứ.
 */
function readCompilerOptions(configPath: string): Record<string, unknown> {
  const parsed = ts.readConfigFile(configPath, ts.sys.readFile);
  if (parsed.error !== undefined) {
    throw new Error(
      ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")
    );
  }
  const config: unknown = parsed.config;
  if (typeof config !== "object" || config === null) {
    throw new Error(`${configPath} không đọc được thành object`);
  }
  const options = Reflect.get(config, "compilerOptions");
  if (typeof options !== "object" || options === null) {
    throw new Error(`${configPath} thiếu compilerOptions`);
  }
  return { ...options };
}

describe("tsconfig.base.json — hợp đồng cache", () => {
  const options = readCompilerOptions(BASE_CONFIG);

  it("bật incremental — không có nó thì mỗi lượt typecheck kiểm lại từ đầu", () => {
    expect(options.incremental).toBe(true);
  });

  it("ghi tsBuildInfoFile vào node_modules/.cache — Cấm — NEVER rơi vào cây nguồn", () => {
    const target = options.tsBuildInfoFile;
    expect(typeof target).toBe("string");
    expect(String(target)).toContain("node_modules/.cache/");
  });

  it("dùng biến configDir — thiếu nó thì mọi project chung một buildinfo", () => {
    // Đường dẫn tương đối trong file `extends` được giải theo vị trí file BASE,
    // nên không có biến này thì root, packages/db, packages/shared… cùng ghi vào
    // `packages/config/node_modules/.cache/` và đạp lên cache của nhau.
    // Khớp bằng regex chứ không bằng chuỗi: biome cấm chuỗi thường chứa
    // placeholder dạng template (`noTemplateCurlyInString`).
    expect(String(options.tsBuildInfoFile)).toMatch(CONFIG_DIR_TOKEN);
  });
});

describe("ca âm: lượt ấm Cấm — NEVER nuốt lỗi mới", () => {
  it("dựng cache trên mã sạch, rồi tiêm lỗi thì lượt ấm vẫn đỏ đúng file", () => {
    const project = makeProject();

    fs.writeFileSync(project.source, "export const value: number = 1;\n");
    const cold = runTsc(project.dir);
    expect(cold.output).not.toMatch(TS_ERROR_LINE);
    expect(cold.status).toBe(0);
    // Cache phải tồn tại thật; không có nó thì bài dưới đo lượt nguội, không phải ấm.
    expect(fs.existsSync(project.buildInfo)).toBe(true);

    fs.writeFileSync(project.source, 'export const value: number = "sai";\n');
    const warm = runTsc(project.dir);
    expect(warm.status).not.toBe(0);
    expect(warm.output).toMatch(NOT_ASSIGNABLE);
    expect(warm.output).toContain("probe.ts");
  });

  it("sửa lại cho đúng thì lượt ấm kế tiếp xanh — cache Cấm — NEVER giữ lỗi cũ", () => {
    const project = makeProject();

    fs.writeFileSync(project.source, 'export const value: number = "sai";\n');
    expect(runTsc(project.dir).status).not.toBe(0);

    fs.writeFileSync(project.source, "export const value: number = 1;\n");
    const fixed = runTsc(project.dir);
    expect(fixed.output).not.toMatch(TS_ERROR_LINE);
    expect(fixed.status).toBe(0);
  });
});
