import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface WebScaleManifestEntry {
  outcome: string;
  specId: string;
  specRelPath: string;
  taskId: string;
  owners: string[];
  dependencies: string[];
  evidencePaths: string[];
  businessRuleIds: string[];
  status: "accepted" | "deferred" | "retired";
}

export const ACCEPTED_WEB_SCALE_MANIFEST: WebScaleManifestEntry[] = [
  {
    outcome: "automated_payment",
    specId: "AUTOMATED-PAYMENT",
    specRelPath: "docs/specs/01-platform/automated-payment.md",
    taskId: "Task #71",
    owners: ["platform", "finance"],
    dependencies: ["PAYMENT-FLOW", "PAYMENT-ORDER-CREATE", "ENTITLEMENT-MODEL"],
    evidencePaths: [
      "packages/shared/tests/web-scale-contract.test.ts",
      "apps/web/tests/api/payment-flow-e2e.test.ts",
    ],
    businessRuleIds: ["BR-APM-01", "BR-APM-02", "BR-APM-03", "BR-APM-04"],
    status: "accepted",
  },
  {
    outcome: "recurring_billing",
    specId: "RECURRING-BILLING",
    specRelPath: "docs/specs/03-account/recurring-billing.md",
    taskId: "Task #71",
    owners: ["account", "finance"],
    dependencies: [
      "AUTOMATED-PAYMENT",
      "SUBSCRIPTION-VIEW",
      "ENTITLEMENT-MODEL",
    ],
    evidencePaths: [
      "packages/shared/tests/web-scale-contract.test.ts",
      "apps/web/tests/api/users/subscription-view.test.ts",
    ],
    businessRuleIds: ["BR-RBL-01", "BR-RBL-02", "BR-RBL-03", "BR-RBL-04"],
    status: "accepted",
  },
  {
    outcome: "payment_refund",
    specId: "PAYMENT-REFUND",
    specRelPath: "docs/specs/06-admin/payment-refund.md",
    taskId: "Task #71",
    owners: ["admin", "finance"],
    dependencies: [
      "AUTOMATED-PAYMENT",
      "PAYMENT-APPROVAL",
      "ENTITLEMENT-GRANT",
    ],
    evidencePaths: [
      "packages/shared/tests/web-scale-contract.test.ts",
      "apps/web/tests/api/payment-flow-e2e.test.ts",
    ],
    businessRuleIds: ["BR-RFD-01", "BR-RFD-02", "BR-RFD-03", "BR-RFD-04"],
    status: "accepted",
  },
  {
    outcome: "pwa_install",
    specId: "PWA-INSTALL",
    specRelPath: "docs/specs/01-platform/pwa-install.md",
    taskId: "Task #72",
    owners: ["platform", "product"],
    dependencies: ["OFFLINE-PLAY"],
    evidencePaths: [
      "packages/shared/tests/pwa-offline-pack.test.ts",
      "apps/web/tests/e2e/pwa-offline-pack-e2e.test.ts",
    ],
    businessRuleIds: ["BR-PWA-01", "BR-PWA-02", "BR-PWA-03", "BR-PWA-04"],
    status: "accepted",
  },
  {
    outcome: "offline_curriculum_pack",
    specId: "OFFLINE-CURRICULUM-PACK",
    specRelPath: "docs/specs/01-platform/offline-curriculum-pack.md",
    taskId: "Task #72",
    owners: ["platform", "product"],
    dependencies: ["PWA-INSTALL", "OFFLINE-PLAY", "CURRICULUM-PLAYER"],
    evidencePaths: [
      "packages/shared/tests/pwa-offline-pack.test.ts",
      "apps/web/tests/api/users/offline-pack.test.ts",
      "apps/web/tests/e2e/pwa-offline-pack-e2e.test.ts",
    ],
    businessRuleIds: ["BR-OCP-01", "BR-OCP-02", "BR-OCP-03", "BR-OCP-04"],
    status: "accepted",
  },
  {
    outcome: "offline_play",
    specId: "OFFLINE-PLAY",
    specRelPath: "docs/specs/01-platform/offline-play.md",
    taskId: "Task #72",
    owners: ["platform", "engine"],
    dependencies: ["GAMEPLAY-SESSION", "TELEMETRY-PIPELINE"],
    evidencePaths: [
      "packages/shared/tests/pwa-offline-pack.test.ts",
      "apps/web/tests/api/users/offline-pack.test.ts",
      "apps/web/tests/e2e/sw-cache.test.ts",
    ],
    businessRuleIds: ["BR-OFF-01", "BR-OFF-02", "BR-OFF-03", "BR-OFF-04"],
    status: "accepted",
  },
];

export const FORBIDDEN_ACTIVE_OUTCOMES = [
  "classroom",
  "native_mobile",
  "licensing",
  "localization",
  "market_expansion",
];

export interface WebScaleViolation {
  code:
    | "MISSING_SPEC_FILE"
    | "SPEC_NOT_APPROVED"
    | "MISSING_EVIDENCE_FILE"
    | "MISSING_BR_IN_TESTS"
    | "FORBIDDEN_SCOPE_IN_MANIFEST"
    | "MISSING_OWNER_OR_TASK"
    | "DEFERRED_OUTCOME_UNSUPPORTED";
  message: string;
}

function validateSpecFile(
  entry: WebScaleManifestEntry,
  rootDir: string
): { violation?: WebScaleViolation; specContent?: string } {
  const specAbsPath = join(rootDir, entry.specRelPath);
  if (!existsSync(specAbsPath)) {
    return {
      violation: {
        code: "MISSING_SPEC_FILE",
        message: `Spec file ${entry.specRelPath} không tồn tại`,
      },
    };
  }

  const specContent = readFileSync(specAbsPath, "utf8");
  const isApproved =
    specContent.includes("status: approved") ||
    specContent.includes("status: implemented");
  if (!isApproved) {
    return {
      violation: {
        code: "SPEC_NOT_APPROVED",
        message: `Spec ${entry.specId} chưa ở trạng thái approved hoặc implemented`,
      },
      specContent,
    };
  }

  return { specContent };
}

function collectEvidenceContents(
  entry: WebScaleManifestEntry,
  rootDir: string
): { violations: WebScaleViolation[]; testContents: string[] } {
  const violations: WebScaleViolation[] = [];
  const testContents: string[] = [];

  for (const evidenceRel of entry.evidencePaths) {
    const evidenceAbs = join(rootDir, evidenceRel);
    if (existsSync(evidenceAbs)) {
      testContents.push(readFileSync(evidenceAbs, "utf8"));
    } else {
      violations.push({
        code: "MISSING_EVIDENCE_FILE",
        message: `Evidence file ${evidenceRel} cho outcome ${entry.outcome} không tồn tại`,
      });
    }
  }

  return { violations, testContents };
}

function validateBusinessRules(
  entry: WebScaleManifestEntry,
  specContent: string,
  testContents: string[]
): WebScaleViolation[] {
  const violations: WebScaleViolation[] = [];
  const mergedTests = testContents.join("\n");

  for (const brId of entry.businessRuleIds) {
    if (!(mergedTests.includes(brId) || specContent.includes(brId))) {
      violations.push({
        code: "MISSING_BR_IN_TESTS",
        message: `Business Rule ${brId} của outcome ${entry.outcome} chưa được dẫn chứng trong spec/test`,
      });
    }
  }

  return violations;
}

function validateManifestEntry(
  entry: WebScaleManifestEntry,
  rootDir: string
): WebScaleViolation[] {
  const violations: WebScaleViolation[] = [];

  if (FORBIDDEN_ACTIVE_OUTCOMES.includes(entry.outcome)) {
    return [
      {
        code: "FORBIDDEN_SCOPE_IN_MANIFEST",
        message: `Outcome "${entry.outcome}" đã bị loại bỏ khỏi Web Scale scope (Task #73-#77 retired).`,
      },
    ];
  }

  if (!entry.taskId || entry.owners.length === 0) {
    violations.push({
      code: "MISSING_OWNER_OR_TASK",
      message: `Outcome ${entry.outcome} thiếu Task ID hoặc owner`,
    });
  }

  if (entry.status === "deferred" || entry.status === "retired") {
    return violations;
  }

  const { violation: specViolation, specContent } = validateSpecFile(
    entry,
    rootDir
  );
  if (specViolation) {
    violations.push(specViolation);
  }

  const { violations: evidenceViolations, testContents } =
    collectEvidenceContents(entry, rootDir);
  violations.push(...evidenceViolations);

  if (specContent) {
    violations.push(...validateBusinessRules(entry, specContent, testContents));
  }

  return violations;
}

export function validateWebScaleManifest(
  manifest: WebScaleManifestEntry[],
  rootDir = resolve(import.meta.dirname, "..")
): WebScaleViolation[] {
  return manifest.flatMap((entry) => validateManifestEntry(entry, rootDir));
}
