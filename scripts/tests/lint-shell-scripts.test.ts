import { unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkBashSyntax,
  scanAndLintShellScripts,
} from "../lint-shell-scripts.js";

describe("Task #90 — WP90.10 Shell Scripts Syntax Verification", () => {
  it("all real infra/scripts/*.sh pass bash -n syntax verification", () => {
    const errors = scanAndLintShellScripts();
    expect(errors).toEqual([]);
  });

  it("detects syntax error on malformed bash script fixture", () => {
    const badScriptPath = resolve(import.meta.dirname, "temp_bad_script.sh");
    writeFileSync(
      badScriptPath,
      "if [ true; then echo missing bracket fi",
      "utf8"
    );

    try {
      const err = checkBashSyntax(badScriptPath);
      expect(err).not.toBeNull();
      expect(err?.error).toBeTruthy();
    } finally {
      unlinkSync(badScriptPath);
    }
  });
});
