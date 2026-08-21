import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  checkBashSyntax,
  collectShellScripts,
  isShellcheckAvailable,
  runShellcheck,
  scanAndLintShellScripts,
} from "../src/lint-shell-scripts.ts";

const BAD_FIXTURE = "packages/gates/tests/fixtures/shell/bad/unquoted.sh";

describe("Gate lint:shell", () => {
  it("shellcheck is installed; without it the gate cannot do its job", () => {
    expect(isShellcheckAvailable()).toBe(true);
  });

  it("collects the server scripts and skips the fixtures", () => {
    const files = collectShellScripts(REPO_ROOT);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.includes("infra/scripts/mindkid.sh"))).toBe(
      true
    );
    expect(files.some((f) => f.includes("fixtures"))).toBe(false);
  });

  it("goes red on a fixture that bash -n accepts", () => {
    // The point of the gate: this file parses, so syntax checking alone passes.
    expect(checkBashSyntax(resolve(REPO_ROOT, BAD_FIXTURE))).toBeNull();

    const findings = runShellcheck([BAD_FIXTURE], REPO_ROOT);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.map((f) => f.code)).toContain("SC2086");
  });

  it("anchors every finding to a line so it can be acted on", () => {
    const findings = runShellcheck([BAD_FIXTURE], REPO_ROOT);
    expect(findings.every((f) => f.line > 0)).toBe(true);
    expect(findings.every((f) => f.file === BAD_FIXTURE)).toBe(true);
  });

  it("is green on the real server scripts", { timeout: 60_000 }, () => {
    expect(scanAndLintShellScripts(REPO_ROOT)).toEqual([]);
  });
});
