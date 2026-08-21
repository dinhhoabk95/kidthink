import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  lintGeneratedArtifacts,
  lintTemplateDirectories,
  lintTemplateLayouts,
  scanAllTemplateGates,
} from "./templates.ts";

const rootDir = REPO_ROOT;
const gameEngineDir = resolve(rootDir, "packages", "game-engine");
const templatesDir = resolve(gameEngineDir, "src", "templates");

describe("Template Quality Gates (BR-TAK-01..14)", () => {
  it("passes cleanly on canonical repository templates", () => {
    const violations = scanAllTemplateGates(gameEngineDir);
    expect(violations).toEqual([]);
  });

  it("verifies template directories have required files (BR-TAK-01, BR-TAK-09)", () => {
    const violations = lintTemplateDirectories(templatesDir);
    expect(violations).toEqual([]);
  });

  it("verifies all generated artifacts match generator output (BR-TAK-03)", () => {
    const violations = lintGeneratedArtifacts(gameEngineDir);
    expect(violations).toEqual([]);
  });

  it("verifies declared layouts are registered in LAYOUT_IDS (BR-TAK-12)", () => {
    const violations = lintTemplateLayouts(templatesDir);
    expect(violations).toEqual([]);
  });
});
