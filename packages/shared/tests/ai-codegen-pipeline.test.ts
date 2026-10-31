import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildSpecIndex,
  computeSpecHash,
  evaluateGenCheck,
  formatGeneratedHeader,
  generateGameSessionFromSpec,
  generateRoutesFromSpec,
  generateSchemaFromSpec,
  generateTestsFromSpec,
  generateZodFromSpec,
  parseSpecMarkdown,
  SensitiveDomainCodegenError,
} from "#src/codegen-pipeline";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../..");
const HEX_8_REGEX = /^[a-f0-9]{8}$/;

describe("AI Codegen Pipeline (docs/specs/01-platform/ai-codegen-pipeline.md, #307)", () => {
  it("S1 (BR-AIG-04, BR-AIG-10): parses real spec markdown into deterministic SpecIndex with 8-char SHA-256 hash", () => {
    const flagSpecPath = "docs/specs/01-platform/feature-flag-service.md";
    const flagMarkdown = fs.readFileSync(
      path.join(ROOT_DIR, flagSpecPath),
      "utf8"
    );

    const parsed1 = parseSpecMarkdown(flagSpecPath, flagMarkdown);
    const parsed2 = parseSpecMarkdown(flagSpecPath, flagMarkdown);

    expect(parsed1.specId).toBe("FEATURE-FLAG-SERVICE");
    expect(parsed1.specSlug).toBe("feature-flag-service");
    expect(parsed1.specHash).toMatch(HEX_8_REGEX);
    expect(parsed1.specHash).toBe(parsed2.specHash);
    expect(parsed1.isSensitiveDomain).toBe(false);

    const ruleIds = parsed1.businessRules.map((r) => r.id);
    expect(ruleIds).toContain("BR-FLG-01");
    expect(ruleIds).toContain("BR-FLG-02");
    expect(ruleIds).toContain("BR-FLG-04");

    expect(parsed1.endpoints.map((e) => `${e.method} ${e.path}`)).toEqual(
      expect.arrayContaining(["GET /api/managers/feature-flags"])
    );

    const index = buildSpecIndex([
      { specPath: flagSpecPath, markdown: flagMarkdown },
    ]);
    expect(index.version).toBe(1);
    expect(index.specs).toHaveLength(1);
  });

  it("S2 (BR-AIG-02, BR-AIG-04, BR-AIG-06, BR-AIG-10): generates deterministic tests, zod, routes, schema, and session with @generated header", () => {
    const flagSpecPath = "docs/specs/01-platform/feature-flag-service.md";
    const flagMarkdown = fs.readFileSync(
      path.join(ROOT_DIR, flagSpecPath),
      "utf8"
    );
    const spec = parseSpecMarkdown(flagSpecPath, flagMarkdown);
    const expectedHeader = formatGeneratedHeader(spec.specId, spec.specHash);

    const testCodeA = generateTestsFromSpec(spec);
    const testCodeB = generateTestsFromSpec(spec);
    expect(testCodeA).toBe(testCodeB);
    expect(testCodeA.startsWith(expectedHeader)).toBe(true);
    expect(testCodeA).toContain("Scenario:");

    const zodCode = generateZodFromSpec(spec);
    expect(zodCode.startsWith(expectedHeader)).toBe(true);
    expect(zodCode).toContain('import { z } from "zod";');

    const routeCode = generateRoutesFromSpec(spec);
    expect(routeCode.startsWith(expectedHeader)).toBe(true);
    expect(routeCode).toContain("defineApiRoute");

    const schemaCode = generateSchemaFromSpec(spec);
    expect(schemaCode.startsWith(expectedHeader)).toBe(true);
    expect(schemaCode).toContain("feature-flag-service.md");

    const sessionCode = generateGameSessionFromSpec(spec, {
      className: "CountTapSession",
    });
    expect(sessionCode.startsWith(expectedHeader)).toBe(true);
    expect(sessionCode).toContain(
      "export class CountTapSession extends StatefulGameSession"
    );
  });

  it("S2 Negative Case (BR-AIG-01, BR-AIG-03): blocks codegen for sensitive domains unless Task #14 exception is explicitly passed", () => {
    const authSpecPath = "docs/specs/01-platform/auth-tokens-sessions.md";
    const authMarkdown = fs.readFileSync(
      path.join(ROOT_DIR, authSpecPath),
      "utf8"
    );
    const authSpec = parseSpecMarkdown(authSpecPath, authMarkdown);
    expect(authSpec.isSensitiveDomain).toBe(true);

    // Tests are always allowed for sensitive domains (§2.1)
    expect(() => generateTestsFromSpec(authSpec)).not.toThrow();

    // Production code generators throw SensitiveDomainCodegenError by default
    expect(() => generateRoutesFromSpec(authSpec)).toThrow(
      SensitiveDomainCodegenError
    );
    expect(() => generateZodFromSpec(authSpec)).toThrow(
      SensitiveDomainCodegenError
    );
    expect(() => generateSchemaFromSpec(authSpec)).toThrow(
      SensitiveDomainCodegenError
    );

    // Explicit Task #14 exception allows human-reviewed generation
    expect(() =>
      generateRoutesFromSpec(authSpec, { allowTask14Exception: true })
    ).not.toThrow();
  });

  it("S3 (BR-AIG-04, BR-AIG-05, BR-AIG-08): evaluateGenCheck detects spec drift, manual edits, and untested rules", () => {
    const specMarkdownV1 = [
      "# Spec V1",
      "- **BR-EXM-01**: Must validate input.",
      "- **BR-EXM-02**: Must return 200.",
    ].join("\n");
    const specV1 = parseSpecMarkdown(
      "docs/specs/01-platform/example-spec.md",
      specMarkdownV1
    );
    const generatedV1 = generateZodFromSpec(specV1);

    // 1. Clean state passes
    const cleanCheck = evaluateGenCheck({
      specs: [specV1],
      generatedFiles: [
        {
          filePath: "packages/shared/src/generated/example.zod.ts",
          content: generatedV1,
          expectedContent: generatedV1,
        },
      ],
      testFilesContent: ["it('covers BR-EXM-01 and BR-EXM-02', () => {})"],
      enforceRuleCoverageForSpecs: ["example-spec"],
    });
    expect(cleanCheck.passed).toBe(true);
    expect(cleanCheck.driftedFiles).toEqual([]);
    expect(cleanCheck.untestedRules).toEqual([]);
    expect(cleanCheck.manualEditsDetected).toEqual([]);

    // 2. Spec updated without regenerating -> driftedFiles detected
    const specV2 = parseSpecMarkdown(
      "docs/specs/01-platform/example-spec.md",
      `${specMarkdownV1}\n- **BR-EXM-03**: New rule.`
    );
    const driftCheck = evaluateGenCheck({
      specs: [specV2],
      generatedFiles: [
        {
          filePath: "packages/shared/src/generated/example.zod.ts",
          content: generatedV1,
        },
      ],
      testFilesContent: ["it('covers BR-EXM-01 and BR-EXM-02', () => {})"],
      enforceRuleCoverageForSpecs: ["example-spec"],
    });
    expect(driftCheck.passed).toBe(false);
    expect(driftCheck.driftedFiles).toEqual([
      {
        filePath: "packages/shared/src/generated/example.zod.ts",
        expectedSpecHash: computeSpecHash(
          `${specMarkdownV1}\n- **BR-EXM-03**: New rule.`
        ),
        actualSpecHash: specV1.specHash,
      },
    ]);
    expect(driftCheck.untestedRules).toEqual([
      {
        ruleId: "BR-EXM-03",
        specPath: "docs/specs/01-platform/example-spec.md",
      },
    ]);

    // 3. Manual edit to @generated file -> manualEditsDetected
    const manuallyEdited = `${generatedV1}\nexport const extraHack = true;\n`;
    const manualEditCheck = evaluateGenCheck({
      specs: [specV1],
      generatedFiles: [
        {
          filePath: "packages/shared/src/generated/example.zod.ts",
          content: manuallyEdited,
          expectedContent: generatedV1,
        },
      ],
    });
    expect(manualEditCheck.passed).toBe(false);
    expect(manualEditCheck.manualEditsDetected).toEqual([
      "packages/shared/src/generated/example.zod.ts",
    ]);
  });
});
