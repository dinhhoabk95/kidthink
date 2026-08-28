import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { repoPath } from "#src/repo-paths";

/**
 * BR-ENV-03 — bộ nạp `.env` của máy trạm.
 *
 * Vòng lặp cũ `break` ở file `.env` đầu tiên tìm được, nên chạy với cwd
 * `apps/web` thì `apps/web/.env` (2 tên) che sạch `.env` gốc (44 tên) và mọi
 * biến bắt buộc còn lại rơi về shell. Cổng này giữ quy tắc mới: nạp **mọi**
 * `.env` từ gần ra xa, file gần cwd thắng, file gốc lấp chỗ trống.
 *
 * Phải chạy trong tiến trình con: bộ nạp là side-effect lúc import, chạy đúng
 * một lần cho mỗi tiến trình, và nó đọc `process.cwd()`.
 */

const TSX_BIN = repoPath("node_modules", ".bin", "tsx");
const LOADER = repoPath("packages", "config", "src", "require-env.ts");

/** Tiền tố riêng để không đụng biến thật đang có trong môi trường của vitest. */
const SHARED = "MINDKID_PROBE_SHARED";
const OVERRIDDEN = "MINDKID_PROBE_OVERRIDDEN";
const APP_ONLY = "MINDKID_PROBE_APP_ONLY";

const PROBE_SOURCE = `import ${JSON.stringify(LOADER)};
process.stdout.write(
  JSON.stringify({
    shared: process.env.${SHARED} ?? null,
    overridden: process.env.${OVERRIDDEN} ?? null,
    appOnly: process.env.${APP_ONLY} ?? null,
  })
);
`;

interface ProbeResult {
  shared: string | null;
  overridden: string | null;
  appOnly: string | null;
}

let treeRoot: string;
let outerDir: string;
let innerDir: string;
let emptyDir: string;

/** Môi trường sạch: bỏ ba tên thăm dò để chỉ còn file quyết định giá trị. */
function childEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env = { ...process.env, ...extra };
  for (const name of [SHARED, OVERRIDDEN, APP_ONLY]) {
    if (!(name in extra)) {
      delete env[name];
    }
  }
  return env;
}

/**
 * Nổ chứ ❌ NEVER trả về kết quả rỗng khi tiến trình con chết: một probe hỏng
 * trả `{null, null, null}` sẽ làm ca âm cuối cùng xanh vì lý do sai.
 */
function runProbe(
  cwd: string,
  extra: Record<string, string> = {}
): ProbeResult {
  const probe = path.join(cwd, "probe.ts");
  writeFileSync(probe, PROBE_SOURCE, "utf8");

  const result = spawnSync(TSX_BIN, [probe], {
    cwd,
    encoding: "utf8",
    env: childEnv(extra),
  });

  if (result.status !== 0 || result.stderr !== "") {
    throw new Error(
      `probe exited ${result.status}: ${result.stderr || result.stdout}`
    );
  }

  return JSON.parse(result.stdout) as ProbeResult;
}

beforeAll(() => {
  treeRoot = mkdtempSync(path.join(tmpdir(), "mindkid-env-"));
  outerDir = path.join(treeRoot, "repo");
  innerDir = path.join(outerDir, "apps", "app");
  emptyDir = path.join(treeRoot, "bare");
  mkdirSync(innerDir, { recursive: true });
  mkdirSync(emptyDir, { recursive: true });

  writeFileSync(
    path.join(outerDir, ".env"),
    `${SHARED}=from_root\n${OVERRIDDEN}=from_root\n`,
    "utf8"
  );
  writeFileSync(
    path.join(innerDir, ".env"),
    `${OVERRIDDEN}=from_app\n${APP_ONLY}=from_app\n`,
    "utf8"
  );
});

afterAll(() => {
  rmSync(treeRoot, { recursive: true, force: true });
});

describe("Bộ nạp .env phân lớp (BR-ENV-03)", () => {
  it("nạp cả .env gốc lẫn .env của app khi cwd là thư mục app", () => {
    const probe = runProbe(innerDir);

    expect(probe.shared).toBe("from_root");
    expect(probe.appOnly).toBe("from_app");
  });

  it("ca âm: file gần cwd nhất thắng, không phải file gốc", () => {
    const probe = runProbe(innerDir);

    expect(probe.overridden).toBe("from_app");
  });

  it("biến đã có trong môi trường thắng mọi file .env", () => {
    const probe = runProbe(innerDir, { [OVERRIDDEN]: "from_shell" });

    expect(probe.overridden).toBe("from_shell");
  });

  it("không có .env nào trên đường đi thì không nổ", () => {
    const probe = runProbe(emptyDir);

    expect(probe).toEqual({ shared: null, overridden: null, appOnly: null });
  });
});
