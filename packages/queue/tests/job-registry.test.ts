import { describe, expect, it } from "vitest";
import {
  getJobDefinition,
  JOB_REGISTRY,
  validateJobRegistryConsumers,
} from "../src/registry.ts";

describe("Task 1 — Job Registry & Boundaries (BR-JOB-04, BR-JOB-07)", () => {
  it("defines all 12 MVP jobs with exact specs (BR-JOB-01..08, BR-EGR-09)", () => {
    expect(JOB_REGISTRY).toHaveLength(14);

    const jobNames = JOB_REGISTRY.map((j) => j.name);
    expect(jobNames).toContain("rollup:session");
    expect(jobNames).toContain("rollup:daily");
    expect(jobNames).toContain("sweep:abandoned");
    expect(jobNames).toContain("entitlement:expire");
    expect(jobNames).toContain("order:expire");
    expect(jobNames).toContain("entitlement:soft-unlock-expire");
    expect(jobNames).toContain("account:purge");
    expect(jobNames).toContain("email:send");
    expect(jobNames).toContain("image:cleanup-orphan");
    expect(jobNames).toContain("backup:postgres");
    expect(jobNames).toContain("backup:verify");
    expect(jobNames).toContain("report:manual-grants-monthly");
    expect(jobNames).toContain("pdf:render");
    expect(jobNames).toContain("sweep:pdf-cleanup");

    for (const job of JOB_REGISTRY) {
      expect(job.name).toBeDefined();
      expect(job.schedule).toBeDefined();
      expect(job.idempotencyKeyFormat).toBeDefined();
      expect(job.timeoutSeconds).toBeGreaterThan(0);
      expect(job.ownerStep).toBeDefined();
      expect(job.retryPolicy.maxAttempts).toBeGreaterThan(0);
    }
  });

  it("purge job has single attempt without retry (BR-JOB-05 / §7.2)", () => {
    const purgeJob = getJobDefinition("account:purge");
    expect(purgeJob).toBeDefined();
    expect(purgeJob?.retryPolicy.maxAttempts).toBe(1);
    expect(purgeJob?.retryPolicy.backoffType).toBe("none");
    expect(purgeJob?.retryPolicy.alertOnFailImmediately).toBe(true);
  });

  it("validates registered consumers gate correctly (D-FW)", () => {
    const implemented = [
      "backup:postgres",
      "backup:verify",
      "email:send",
      "rollup:daily",
      "entitlement:expire",
    ];

    const gateResult = validateJobRegistryConsumers(implemented, "P1.5");
    expect(gateResult.valid).toBe(true);
    expect(gateResult.errors).toHaveLength(0);

    // Negative test 1: Unknown consumer implemented -> RED
    const invalidConsumers = [...implemented, "unknown:job"];
    const gateResult1 = validateJobRegistryConsumers(invalidConsumers, "P1.5");
    expect(gateResult1.valid).toBe(false);
    expect(gateResult1.errors[0]).toContain("not registered in JOB_REGISTRY");

    // Negative test 2: Step P1.5 passed but missing rollup:daily consumer -> RED
    const missingDaily = implemented.filter((c) => c !== "rollup:daily");
    const gateResult2 = validateJobRegistryConsumers(missingDaily, "P1.5");
    expect(gateResult2.valid).toBe(false);
    expect(gateResult2.errors[0]).toContain("must have an active consumer");
  });
});
