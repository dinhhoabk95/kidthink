import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";

/**
 * Cổng cho **mặt script** của repo (Task #204, `#204.8`).
 *
 * `AGENTS.md` mô tả `pnpm typecheck` là cổng bậc thang và ghi rằng workspace
 * ❌ NEVER khai script `typecheck` riêng. Thực tế trước Task #204 lệch cả hai:
 * `pnpm typecheck` chạy `scripts/typecheck-parallel.sh` (không có bậc thang),
 * còn cả ba app đều có script `typecheck` riêng. Hai đường đo hai thứ khác nhau
 * và không ai báo — nên bất biến này cần một cổng, không phải một câu văn.
 */

const GATE_ENTRY = "scripts/typecheck/typecheck-gate.ts";
const APPS = ["web", "admin", "worker"] as const;

function readScripts(packageJsonPath: string): Record<string, string> {
  const raw: unknown = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`${packageJsonPath} không đọc được thành object`);
  }
  const scripts = Reflect.get(raw, "scripts");
  if (typeof scripts !== "object" || scripts === null) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(scripts)) {
    out[name] = String(value);
  }
  return out;
}

const rootScripts = readScripts(path.join(REPO_ROOT, "package.json"));

describe("typecheck có đúng MỘT đường chạy", () => {
  it("`pnpm typecheck` gọi thẳng cổng bậc thang", () => {
    expect(rootScripts.typecheck).toContain(GATE_ENTRY);
  });

  it("Cấm — NEVER còn script typecheck thứ hai ở gốc", () => {
    const others = Object.entries(rootScripts).filter(
      ([name, body]) =>
        name !== "typecheck" &&
        name !== "typecheck:update" &&
        (name.startsWith("typecheck") || body.includes("typecheck-parallel"))
    );
    expect(others).toEqual([]);
  });

  it("`typecheck:update` tồn tại — cổng tự bảo người dùng chạy nó", () => {
    // `typecheck-gate.ts` in ra "chạy `pnpm typecheck:update`" ở hai nhánh.
    // Script đó từng KHÔNG tồn tại: lời khuyên trỏ vào hư không.
    expect(rootScripts["typecheck:update"]).toContain(GATE_ENTRY);
    expect(rootScripts["typecheck:update"]).toContain("--update");
  });

  it("Cấm — NEVER workspace nào khai script typecheck riêng", () => {
    const offenders = APPS.filter((app) => {
      const scripts = readScripts(
        path.join(REPO_ROOT, "apps", app, "package.json")
      );
      return scripts.typecheck !== undefined;
    });
    expect(offenders).toEqual([]);
  });

  it("`scripts/typecheck-parallel.sh` đã bị xoá", () => {
    expect(
      fs.existsSync(path.join(REPO_ROOT, "scripts/typecheck-parallel.sh"))
    ).toBe(false);
  });
});

describe("check.sh giữ đủ năm bước của testing-strategy §8", () => {
  const checkScript = fs.readFileSync(
    path.join(REPO_ROOT, "scripts", "check.sh"),
    "utf-8"
  );

  // Đã bị thu hẹp hai lần trong lịch sử repo (xem
  // `docs/tasks/108-quality-gate-convergence-plan.md` §2), nên đây là ca âm cho
  // chính việc bớt bước.
  const REQUIRED = [
    "pnpm lint",
    "lint:deps",
    "pnpm typecheck",
    "vitest run",
    "infra/scripts/tests/run.sh",
  ] as const;

  for (const step of REQUIRED) {
    it(`vẫn chạy \`${step}\``, () => {
      expect(checkScript).toContain(step);
    });
  }

  it("Cấm — NEVER gọi lại typecheck-parallel.sh", () => {
    expect(checkScript).not.toContain("typecheck-parallel");
  });
});
