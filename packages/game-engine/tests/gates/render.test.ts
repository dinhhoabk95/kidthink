import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  formatRenderReport,
  lintAuxiliaryFile,
  lintSingleSessionFile,
  scanRenderGate,
} from "./render.ts";

const rootDir = REPO_ROOT;
const gameEngineDir = resolve(rootDir, "packages", "game-engine");
const srcDir = resolve(gameEngineDir, "src");
const configPath = resolve(gameEngineDir, "config", "render-implemented.json");
const fixturesDir = resolve(gameEngineDir, "tests", "gates", "fixtures");

describe("Engine Render Quality Gates (BR-ERC-01..05)", () => {
  /**
   * Bậc thang phải đo bằng số **chính xác**, không phải `>= 1` / `<= 26`.
   *
   * `toBeGreaterThanOrEqual(1)` xanh cả khi mới có 1 engine cài render, và
   * `toContain("27 engine active")` bỏ luôn hai con số còn lại khỏi phép so.
   * Số hiện tại đã biết và đếm được, nên nó được ghi thẳng: tiến hay lùi đều
   * làm test đỏ, và đó là điều bậc thang tồn tại để làm.
   */
  it("passes cleanly on canonical repository templates with current ratchet", () => {
    const result = scanRenderGate(srcDir, configPath);
    expect(result.violations).toEqual([]);
    expect(result.activeCount).toBe(37);
    expect(result.implementedCount).toBe(37);
    expect(result.missingCount).toBe(0);

    const report = formatRenderReport(result);
    expect(report).toBe("37 engine active, 37 cài render, 0 thiếu");
  });

  it("ca âm mới: file ngoài templates/ chứa ctx thô làm cổng đỏ (BR-ERC-05)", () => {
    const fixtureDir = resolve(fixturesDir, "raw-canvas-outside-templates");
    const result = scanRenderGate(fixtureDir);
    expect(result.violations.some((v) => v.rule === "BR-ERC-05")).toBe(true);
  });

  it("ca âm mới: file ngoài src/render/ import cache.ts làm cổng đỏ (BR-ERC-06)", () => {
    const fixtureDir = resolve(fixturesDir, "cache-import-outside-render");
    const result = scanRenderGate(fixtureDir);
    expect(result.violations.some((v) => v.rule === "BR-ERC-06")).toBe(true);
  });

  it("ca âm: file phụ cạnh session.ts chứa ctx thô vẫn bị bắt (BR-ERC-05)", () => {
    // Đây là lối đi vòng đã từng dùng: dời mọi lời gọi `ctx.*` sang một file
    // bên cạnh, vì cổng cũ chỉ quét `session.ts`.
    const auxFile = resolve(
      fixturesDir,
      "aux-raw-canvas",
      "GT-001",
      "render-helpers.ts"
    );
    const violations = lintAuxiliaryFile("GT-001", auxFile);
    expect(violations.some((v) => v.rule === "BR-ERC-05")).toBe(true);
  });

  it("ca âm: toạ độ cứng trong hàm draw* ngoài ba tên cũ vẫn bị bắt (BR-ERC-03)", () => {
    // Regex cũ chỉ biết drawClayBody|drawClayContainer|drawScaffoldingHighlight,
    // nên khi thư viện đổi tên hàm thì luật khớp 0 dòng mà cổng vẫn xanh.
    const auxFile = resolve(fixturesDir, "hardcoded-coords-aux", "helper.ts");
    const violations = lintAuxiliaryFile(undefined, auxFile);
    expect(violations.some((v) => v.rule === "BR-ERC-03")).toBe(true);
    expect(violations.some((v) => v.message.includes("drawSlotItem"))).toBe(
      true
    );
  });

  it('ca âm: session chỉ chứa chuỗi "render(" mà không có chữ ký thì đỏ (BR-ERC-01)', () => {
    const sessionFile = resolve(
      fixturesDir,
      "substring-render",
      "GT-001",
      "session.ts"
    );
    const violations = lintSingleSessionFile("GT-001", sessionFile, true);
    expect(violations.some((v) => v.rule === "BR-ERC-01")).toBe(true);
  });

  it("negative case: flags BR-ERC-01 when engine in ratchet list lacks render()", () => {
    const sessionFile = resolve(
      fixturesDir,
      "missing-render",
      "GT-001",
      "session.ts"
    );
    const violations = lintSingleSessionFile("GT-001", sessionFile, true);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.rule === "BR-ERC-01")).toBe(true);
  });

  it("negative case: flags BR-ERC-05 when session directly calls raw canvas drawing methods", () => {
    const sessionFile = resolve(
      fixturesDir,
      "raw-canvas-call",
      "GT-001",
      "session.ts"
    );
    const violations = lintSingleSessionFile("GT-001", sessionFile, false);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.rule === "BR-ERC-05")).toBe(true);
    expect(violations.some((v) => v.message.includes("ctx.fillRect"))).toBe(
      true
    );
  });

  it("negative case: flags BR-ERC-03 when session has hardcoded coordinate literals in draw calls", () => {
    const sessionFile = resolve(
      fixturesDir,
      "hardcoded-coords",
      "GT-001",
      "session.ts"
    );
    const violations = lintSingleSessionFile("GT-001", sessionFile, false);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.rule === "BR-ERC-03")).toBe(true);
  });

  it("negative case: flags BR-ERC-01 when scanning non-existent or empty templates directory", () => {
    const nonExistent = resolve(fixturesDir, "does-not-exist");
    const result = scanRenderGate(nonExistent);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.rule === "BR-ERC-01")).toBe(true);

    const emptyDir = resolve(fixturesDir);
    const emptyResult = scanRenderGate(emptyDir);
    expect(emptyResult.violations.length).toBeGreaterThan(0);
  });
});
