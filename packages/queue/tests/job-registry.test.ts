import { describe, expect, it } from "vitest";
import { JOB_DEFINITIONS } from "#src/jobs/index";
import { getJobDefinition, JOB_REGISTRY } from "#src/registry";
import { defineEventJobWithoutIdempotencyKey } from "#tests/fixtures/event-job-without-idempotency-key";

const CRON_PATTERN = /^[\d*/, -]+$/;
const MISSING_KEY_MESSAGE = /BẮT BUỘC khai idempotencyKey/;

const MVP_JOB_NAMES = [
  "rollup:session",
  "rollup:daily",
  "sweep:abandoned",
  "entitlement:expire",
  "order:expire",
  "account:purge",
  "email:send",
  "image:cleanup-orphan",
  "backup:postgres",
  "backup:verify",
];

const ADDON_JOB_NAMES = [
  "entitlement:soft-unlock-expire",
  "report:manual-grants-monthly",
  "pdf:render",
  "sweep:pdf-cleanup",
  "embed:content",
];

describe("Task 1 — Job Registry & Boundaries (BR-JOB-04, BR-JOB-07)", () => {
  it("khai đủ 10 job MVP của job-queue.md §7.1 cộng 5 job add-on", () => {
    const jobNames = JOB_REGISTRY.map((job) => job.name);

    for (const name of MVP_JOB_NAMES) {
      expect(jobNames).toContain(name);
    }
    for (const name of ADDON_JOB_NAMES) {
      expect(jobNames).toContain(name);
    }
    expect(JOB_REGISTRY).toHaveLength(
      MVP_JOB_NAMES.length + ADDON_JOB_NAMES.length
    );

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

  it("mọi job theo sự kiện đều khai idempotencyKey (BR-JOB-02)", () => {
    const eventJobs = JOB_DEFINITIONS.filter(
      (job) => job.schedule.kind === "event"
    );

    expect(eventJobs.length).toBeGreaterThan(0);
    for (const job of eventJobs) {
      expect(job.idempotencyKey, job.name).toBeTypeOf("function");
    }
  });

  it("mọi job theo lịch đều khai cron pattern kèm timezone ICT", () => {
    const cronJobs = JOB_DEFINITIONS.filter(
      (job) => job.schedule.kind === "cron"
    );

    expect(cronJobs.length).toBeGreaterThan(0);
    for (const job of cronJobs) {
      if (job.schedule.kind !== "cron") {
        continue;
      }
      expect(job.schedule.pattern, job.name).toMatch(CRON_PATTERN);
      expect(job.schedule.tz, job.name).toBe("Asia/Ho_Chi_Minh");
    }
  });

  it("ca âm BR-JOB-02: job sự kiện thiếu idempotencyKey bị từ chối lúc khai", () => {
    expect(defineEventJobWithoutIdempotencyKey).toThrow(MISSING_KEY_MESSAGE);
  });
});
