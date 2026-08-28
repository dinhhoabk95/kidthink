import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  formatRenderReport,
  lintSingleSessionFile,
  scanRenderGate,
} from "./render.ts";

const rootDir = REPO_ROOT;
const gameEngineDir = resolve(rootDir, "packages", "game-engine");
const templatesDir = resolve(gameEngineDir, "src", "templates");
const configPath = resolve(gameEngineDir, "config", "render-implemented.json");
const fixturesDir = resolve(gameEngineDir, "tests", "gates", "fixtures");

describe("Engine Render Quality Gates (BR-ERC-01..05)", () => {
  it("passes cleanly on canonical repository templates with initial ratchet", () => {
    const result = scanRenderGate(templatesDir, configPath);
    expect(result.violations).toEqual([]);
    expect(result.activeCount).toBe(27);
    expect(result.implementedCount).toBe(0);
    expect(result.missingCount).toBe(27);

    const report = formatRenderReport(result);
    expect(report).toBe("27 engine active, 0 cài render, 27 thiếu");
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
