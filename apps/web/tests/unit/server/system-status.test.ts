import { describe, expect, it } from "vitest";
import {
  probePostgres,
  probeQueue,
  probeValkey,
} from "#server/api/managers/system/status.get.js";

describe("System Activity Health Probes (BR-SYS-01..06, D-KT)", () => {
  describe("probePostgres", () => {
    it("reports status ok and state up with measured latency when SELECT 1 succeeds within threshold", async () => {
      const result = await probePostgres(async () => {
        await Promise.resolve();
      }, 200);

      expect(result.status).toBe("ok");
      expect(result.state).toBe("up");
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.runbook_url).toBe("/docs/runbooks/db-troubleshooting.md");
    });

    it("reports status bad and state degraded when SELECT 1 exceeds threshold", async () => {
      const result = await probePostgres(async () => {
        await Promise.resolve();
      }, 0);

      expect(result.status).toBe("bad");
      expect(result.state).toBe("degraded");
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it("Scenario: BR-SYS-01 — reports status unknown and state down when query fails (never ok)", async () => {
      const result = await probePostgres(() =>
        Promise.reject(
          new Error("postgres://secret-user:secret-pass@db:5432/mindkid")
        )
      );

      expect(result.status).toBe("unknown");
      expect(result.state).toBe("down");
      expect(result.latency_ms).toBe(-1);
      expect(JSON.stringify(result)).not.toContain("postgres://");
      expect(JSON.stringify(result)).not.toContain("secret-pass");
    });
  });

  describe("probeValkey", () => {
    it("reports status ok and state up with measured latency when PING returns true", async () => {
      const result = await probeValkey(() => Promise.resolve(true), 200);

      expect(result.status).toBe("ok");
      expect(result.state).toBe("up");
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.runbook_url).toBe("/docs/runbooks/valkey-cache.md");
    });

    it("reports status bad and state degraded when PING latency exceeds threshold", async () => {
      const result = await probeValkey(async () => {
        await Promise.resolve();
        return true;
      }, 0);

      expect(result.status).toBe("bad");
      expect(result.state).toBe("degraded");
    });

    it("Scenario: BR-SYS-01 — reports status bad/unknown and state down when PING returns false or throws", async () => {
      const falseResult = await probeValkey(() => Promise.resolve(false));
      expect(falseResult.status).toBe("bad");
      expect(falseResult.state).toBe("down");
      expect(falseResult.status).not.toBe("ok");

      const throwResult = await probeValkey(() =>
        Promise.reject(new Error("Redis connection refused"))
      );
      expect(throwResult.status).toBe("unknown");
      expect(throwResult.state).toBe("down");
      expect(throwResult.status).not.toBe("ok");
    });
  });

  describe("probeQueue", () => {
    it("reads real BullMQ job counts (waiting, active, completed, failed, delayed) and oldest waiting age", async () => {
      const fixedNow = 1_700_000_100_000;
      const result = await probeQueue(
        () => ({
          getJobCounts: () =>
            Promise.resolve({
              waiting: 7,
              active: 2,
              completed: 42,
              failed: 3,
              delayed: 5,
            }),
          getWaiting: () => Promise.resolve([{ timestamp: 1_700_000_040_000 }]),
        }),
        fixedNow
      );

      expect(result.service.status).toBe("ok");
      expect(result.service.state).toBe("up");
      expect(result.jobs.status).toBe("ok");
      expect(result.jobs.waiting_count).toBe(7);
      expect(result.jobs.active_count).toBe(2);
      expect(result.jobs.completed_count).toBe(42);
      expect(result.jobs.failed_count).toBe(3);
      expect(result.jobs.delayed_count).toBe(5);
      expect(result.jobs.failed_24h_count).toBe(3);
      expect(result.jobs.oldest_job_age_seconds).toBe(60);
      expect(result.jobs.counts).toEqual({
        waiting: 7,
        active: 2,
        completed: 42,
        failed: 3,
        delayed: 5,
      });
    });

    it("marks jobs status as bad when waiting backlog > 500 or failed > 10", async () => {
      const highBacklog = await probeQueue(() => ({
        getJobCounts: () =>
          Promise.resolve({
            waiting: 501,
            active: 1,
            completed: 10,
            failed: 0,
            delayed: 0,
          }),
      }));
      expect(highBacklog.jobs.status).toBe("bad");

      const highFailed = await probeQueue(() => ({
        getJobCounts: () =>
          Promise.resolve({
            waiting: 0,
            active: 0,
            completed: 10,
            failed: 11,
            delayed: 0,
          }),
      }));
      expect(highFailed.jobs.status).toBe("bad");
    });

    it("Scenario: BR-SYS-01 — reports unknown status and down state when queue inspection fails (never ok)", async () => {
      const failedProbe = await probeQueue(() => ({
        getJobCounts: () =>
          Promise.reject(new Error("Valkey connection closed")),
      }));

      expect(failedProbe.service.status).toBe("unknown");
      expect(failedProbe.service.state).toBe("down");
      expect(failedProbe.jobs.status).toBe("unknown");
      expect(failedProbe.jobs.status).not.toBe("ok");
      expect(failedProbe.jobs.counts).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
    });
  });
});
