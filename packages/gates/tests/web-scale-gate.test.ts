import { describe, expect, it } from "vitest";
import {
  ACCEPTED_WEB_SCALE_MANIFEST,
  validateWebScaleManifest,
  type WebScaleManifestEntry,
} from "#src/check-web-scale-gate-lib";

const BASE_ENTRY = ACCEPTED_WEB_SCALE_MANIFEST[0];

describe("Web Scale Gate Verification — Task #78 / P5.3", () => {
  it("passes cleanly on canonical accepted Web Scale manifest", () => {
    const violations = validateWebScaleManifest(ACCEPTED_WEB_SCALE_MANIFEST);
    expect(violations).toHaveLength(0);
  });

  it("Checkpoint A / Ca âm 1: flags MISSING_EVIDENCE_FILE when test file does not exist", () => {
    if (!BASE_ENTRY) {
      throw new Error("Missing BASE_ENTRY");
    }
    const dirtyManifest: WebScaleManifestEntry[] = [
      {
        ...BASE_ENTRY,
        evidencePaths: [
          "packages/shared/tests/non_existent_test_evidence.test.ts",
        ],
      },
    ];

    const violations = validateWebScaleManifest(dirtyManifest);
    expect(violations).toContainEqual(
      expect.objectContaining({
        code: "MISSING_EVIDENCE_FILE",
      })
    );
  });

  it("Checkpoint A / Ca âm 2: flags FORBIDDEN_SCOPE_IN_MANIFEST when retired scopes appear in manifest", () => {
    const dirtyManifest: WebScaleManifestEntry[] = [
      {
        outcome: "classroom",
        specId: "CLASSROOM-MANAGEMENT",
        specRelPath: "docs/specs/01-platform/automated-payment.md",
        taskId: "Task #73",
        owners: ["product"],
        dependencies: [],
        evidencePaths: ["packages/shared/tests/web-scale-contract.test.ts"],
        businessRuleIds: [],
        status: "accepted",
      },
      {
        outcome: "native_mobile",
        specId: "MOBILE-APP",
        specRelPath: "docs/specs/01-platform/automated-payment.md",
        taskId: "Task #74",
        owners: ["product"],
        dependencies: [],
        evidencePaths: ["packages/shared/tests/web-scale-contract.test.ts"],
        businessRuleIds: [],
        status: "accepted",
      },
    ];

    const violations = validateWebScaleManifest(dirtyManifest);
    expect(violations).toHaveLength(2);
    expect(violations[0]?.code).toBe("FORBIDDEN_SCOPE_IN_MANIFEST");
    expect(violations[1]?.code).toBe("FORBIDDEN_SCOPE_IN_MANIFEST");
  });

  it("Checkpoint A / Ca âm 3: flags MISSING_OWNER_OR_TASK when task or owner is missing", () => {
    if (!BASE_ENTRY) {
      throw new Error("Missing BASE_ENTRY");
    }
    const dirtyManifest: WebScaleManifestEntry[] = [
      {
        ...BASE_ENTRY,
        taskId: "",
        owners: [],
      },
    ];

    const violations = validateWebScaleManifest(dirtyManifest);
    expect(violations).toContainEqual(
      expect.objectContaining({
        code: "MISSING_OWNER_OR_TASK",
      })
    );
  });

  it("Checkpoint A / Ca âm 4: flags MISSING_SPEC_FILE when spec file does not exist", () => {
    if (!BASE_ENTRY) {
      throw new Error("Missing BASE_ENTRY");
    }
    const dirtyManifest: WebScaleManifestEntry[] = [
      {
        ...BASE_ENTRY,
        specRelPath: "docs/specs/00-non-existent/fake-spec.md",
      },
    ];

    const violations = validateWebScaleManifest(dirtyManifest);
    expect(violations).toContainEqual(
      expect.objectContaining({
        code: "MISSING_SPEC_FILE",
      })
    );
  });

  it("Checkpoint A / Ca âm 5: flags MISSING_BR_IN_TESTS when claimed BR is not in spec or tests", () => {
    if (!BASE_ENTRY) {
      throw new Error("Missing BASE_ENTRY");
    }
    const dirtyManifest: WebScaleManifestEntry[] = [
      {
        ...BASE_ENTRY,
        businessRuleIds: ["BR-APM-999-NONEXISTENT"],
      },
    ];

    const violations = validateWebScaleManifest(dirtyManifest);
    expect(violations).toContainEqual(
      expect.objectContaining({
        code: "MISSING_BR_IN_TESTS",
      })
    );
  });
});
