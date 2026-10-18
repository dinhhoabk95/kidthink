import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { generateAllTemplateArtifacts } from "#scripts/gen-templates-lib";
import { ALL_TEMPLATES } from "#src/generated/template-registry";
import { TEMPLATE_SEED_ENTRIES } from "#src/generated/template-seed";
import {
  lintGeneratedArtifacts,
  lintTemplateDirectories,
  lintTemplateLayouts,
  scanAllTemplateGates,
} from "./templates.ts";

const rootDir = REPO_ROOT;
const gameEngineDir = resolve(rootDir, "packages", "game-engine");
const templatesDir = resolve(gameEngineDir, "src", "templates");

describe("Template Quality Gates (BR-TAK-01..12)", () => {
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

  it("BR-TAK-02: adding GT-999 folder generates all 6 registry files without touching outside hand-written files", () => {
    const tempEngineDir = mkdtempSync(join(tmpdir(), "tak-gt999-"));
    try {
      const gt999Dir = join(tempEngineDir, "src", "templates", "GT-999");
      mkdirSync(gt999Dir, { recursive: true });
      writeFileSync(
        join(gt999Dir, "template.ts"),
        'export default { code: "GT-999", layouts: ["grid"] };\n'
      );
      writeFileSync(
        join(gt999Dir, "session.ts"),
        "export class GT999Session {}\n"
      );
      writeFileSync(
        join(gt999Dir, "fixtures.ts"),
        'export const F = [{ prompt: "1" }, { prompt: "2" }, { prompt: "3" }];\n'
      );

      const generated = generateAllTemplateArtifacts(tempEngineDir);
      expect(generated.size).toBe(6);
      for (const content of generated.values()) {
        expect(content).toContain("GT-999");
      }
      expect(
        lintTemplateDirectories(join(tempEngineDir, "src", "templates"))
      ).toEqual([]);
    } finally {
      rmSync(tempEngineDir, { recursive: true, force: true });
    }
  });

  it("Ca âm BR-TAK-03: detects manually modified generated artifact", () => {
    const tempEngineDir = mkdtempSync(join(tmpdir(), "tak-br03-"));
    try {
      const gt001Dir = join(tempEngineDir, "src", "templates", "GT-001");
      const genDir = join(tempEngineDir, "src", "generated");
      mkdirSync(gt001Dir, { recursive: true });
      mkdirSync(genDir, { recursive: true });
      writeFileSync(
        join(gt001Dir, "template.ts"),
        'export default { code: "GT-001", layouts: ["grid"] };\n'
      );
      writeFileSync(
        join(gt001Dir, "session.ts"),
        "export class GT001Session {}\n"
      );

      const expected = generateAllTemplateArtifacts(tempEngineDir);
      for (const [filePath, content] of expected.entries()) {
        writeFileSync(filePath, content);
      }
      // Tamper with one generated file
      writeFileSync(
        join(genDir, "template-codes.ts"),
        "// manually edited\nexport const ALL_TEMPLATE_CODES = [] as const;\n"
      );

      const violations = lintGeneratedArtifacts(tempEngineDir);
      expect(violations.some((v) => v.rule === "BR-TAK-03")).toBe(true);
    } finally {
      rmSync(tempEngineDir, { recursive: true, force: true });
    }
  });

  it("Ca âm BR-TAK-09: detects template with fewer than 3 sample levels in fixtures.ts", () => {
    const tempTemplatesDir = mkdtempSync(join(tmpdir(), "tak-br09-"));
    try {
      const gtDir = join(tempTemplatesDir, "GT-998");
      mkdirSync(gtDir, { recursive: true });
      writeFileSync(join(gtDir, "template.ts"), "export default {};\n");
      writeFileSync(join(gtDir, "session.ts"), "export class S {}\n");
      writeFileSync(
        join(gtDir, "fixtures.ts"),
        'export const F = [{ prompt: "only one" }, { prompt: "only two" }];\n'
      );

      const violations = lintTemplateDirectories(tempTemplatesDir);
      expect(violations.some((v) => v.rule === "BR-TAK-09")).toBe(true);
    } finally {
      rmSync(tempTemplatesDir, { recursive: true, force: true });
    }
  });

  it("BR-TAK-11: TEMPLATE_SEED_ENTRIES matches ALL_TEMPLATES 1-to-1", () => {
    const allCodes = Object.keys(ALL_TEMPLATES);
    expect(TEMPLATE_SEED_ENTRIES).toHaveLength(allCodes.length);

    for (const seedEntry of TEMPLATE_SEED_ENTRIES) {
      const tpl = ALL_TEMPLATES[seedEntry.templateCode];
      expect(tpl).toBeDefined();
      expect(seedEntry.nameVi).toBe(tpl?.name);
      expect(seedEntry.mechanic).toBe(tpl?.mechanic);
      expect(seedEntry.layouts).toEqual(tpl?.layouts);
      expect(seedEntry.limits).toEqual(tpl?.limits);
      expect(seedEntry.ageMin).toBe(tpl?.age_min);
      expect(seedEntry.ageMax).toBe(tpl?.age_max);
      expect(seedEntry.requiresTapFallback).toBe(tpl?.requires_tap_fallback);
      expect(seedEntry.assetKinds).toEqual(tpl?.asset_kinds);
      expect(seedEntry.scoring).toEqual(tpl?.scoring);
      expect(seedEntry.events).toEqual(tpl?.events);
      expect(seedEntry.engineSession).toBe(tpl?.engine_session);
      expect(seedEntry.status).toBe(tpl?.status);
      expect(seedEntry.version).toBe(tpl?.version);
    }
  });

  it("Ca âm BR-TAK-12: detects template declaring an unregistered layout", () => {
    const tempTemplatesDir = mkdtempSync(join(tmpdir(), "tak-br12-"));
    try {
      const gtDir = join(tempTemplatesDir, "GT-997");
      mkdirSync(gtDir, { recursive: true });
      writeFileSync(
        join(gtDir, "template.ts"),
        'export default { code: "GT-997", layouts: ["grid", "unknown-fake-layout"] };\n'
      );
      writeFileSync(join(gtDir, "session.ts"), "export class S {}\n");

      const violations = lintTemplateLayouts(tempTemplatesDir);
      expect(violations.some((v) => v.rule === "BR-TAK-12")).toBe(true);
    } finally {
      rmSync(tempTemplatesDir, { recursive: true, force: true });
    }
  });
});
