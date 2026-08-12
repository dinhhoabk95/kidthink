import fs from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearExecutedJobIds,
  runSendEmail,
} from "../../../apps/worker/src/email/send.js";
import { LocalFileEmailAdapter } from "../src/email-sender.js";

describe("Job email:send Runner (Task 4 / BR-NOT-04..05)", () => {
  const testDir = ".backups/test-email-job";

  beforeEach(() => {
    clearExecutedJobIds();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("dispatches transactional email via adapter", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);
    const res = await runSendEmail("job_101", {
      notificationId: 101,
      to: "parent@example.com",
      code: "order_approved",
      payload: { orderId: "ORD-999" },
      adapter,
    });

    expect(res.status).toBe("dispatched");
    expect(res.providerMessageId).toBeDefined();
  });

  it("Ca âm BR-NOT-05: re-running job with same jobId suppresses second dispatch", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);
    const res1 = await runSendEmail("job_102", {
      notificationId: 102,
      to: "parent@example.com",
      code: "order_approved",
      payload: {},
      adapter,
    });
    expect(res1.status).toBe("dispatched");

    // Second run with same jobId
    const res2 = await runSendEmail("job_102", {
      notificationId: 102,
      to: "parent@example.com",
      code: "order_approved",
      payload: {},
      adapter,
    });
    expect(res2.status).toBe("suppressed");
    expect(res2.suppressedReason).toBe("ALREADY_EXECUTED_JOB");
  });

  it("suppresses periodic email when user opted out", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);
    const res = await runSendEmail("job_103", {
      notificationId: 103,
      to: "parent@example.com",
      code: "weekly_progress",
      payload: {},
      userOptOut: true,
      adapter,
    });

    expect(res.status).toBe("suppressed");
    expect(res.suppressedReason).toBe("USER_OPT_OUT");
  });

  it("hard bounce suppresses periodic email but retains transactional email", async () => {
    const adapter = new LocalFileEmailAdapter(testDir);

    // Periodic email on bouncing address -> suppressed
    const res1 = await runSendEmail("job_104", {
      notificationId: 104,
      to: "bouncing@example.com",
      code: "weekly_progress",
      payload: {},
      isBouncing: true,
      adapter,
    });
    expect(res1.status).toBe("suppressed");
    expect(res1.suppressedReason).toBe("BOUNCING_ADDRESS");

    // Transactional email on bouncing address -> dispatched
    const res2 = await runSendEmail("job_105", {
      notificationId: 105,
      to: "bouncing@example.com",
      code: "order_approved",
      payload: {},
      isBouncing: true,
      adapter,
    });
    expect(res2.status).toBe("dispatched");
  });
});
