import { getCloudflareQueuePort, type QueuedJobEnvelope } from "@mindkid/queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeD1, createFakeDoSql } from "./__tests__/cloudflare-fakes.js";

// `BR-JOB-11`: nạp bullmq ở bất kỳ đâu trong đồ thị import của entry là lỗi.
vi.mock("bullmq", () => {
  throw new Error("bullmq must not be loaded by the Cloudflare entry");
});

vi.mock("cloudflare:workers", () => ({
  DurableObject: class {
    protected readonly ctx: unknown;
    protected readonly env: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  },
}));

const enqueueFromConsumer = vi.hoisted(() => ({
  fn: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("#src/consumers/index", () => ({
  CONSUMERS: {
    "sweep:abandoned": () => enqueueFromConsumer.fn(),
    "billing:renew": vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("#src/graduation-sensor", () => ({
  checkGraduationReadiness: vi.fn(() => Promise.resolve()),
}));

const ictMs = (h: number, mi: number): number =>
  Date.UTC(2026, 10, 24, h - 7, mi);

describe("cloudflare-entry (mindkid-worker)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MINDKID_RUNTIME", "cloudflare");
    vi.stubEnv("QUEUE_DRIVER", "cloudflare-do");
  });

  it("imports without loading bullmq and exports DO classes + default scheduled()", async () => {
    const entry = await import("./cloudflare-entry.js");
    expect(typeof entry.JobQueueDO).toBe("function");
    expect(typeof entry.AuthCoordinatorDO).toBe("function");
    expect(typeof entry.default.scheduled).toBe("function");
  });

  it("scheduled() at 00:30 ICT enqueues billing:renew into the single queue-v1 DO", async () => {
    const { default: worker } = await import("./cloudflare-entry.js");
    const received: QueuedJobEnvelope[][] = [];
    const idFromName = vi.fn((name: string) => ({ name }));
    const fakeD1 = createFakeD1();
    const waits: Promise<unknown>[] = [];

    worker.scheduled(
      { scheduledTime: ictMs(0, 30) },
      {
        DB_CORE: fakeD1,
        DB_LOGS: fakeD1,
        DB_BLOBS: fakeD1,
        JOB_QUEUE_DO: {
          idFromName,
          get: () => ({
            enqueueBatch: (jobs) => {
              received.push([...jobs]);
              return Promise.resolve({ accepted: jobs.length });
            },
          }),
        },
      },
      { waitUntil: (p) => waits.push(p) }
    );
    await Promise.all(waits);

    expect(idFromName).toHaveBeenCalledWith("queue-v1");
    const names = received.flat().map((j) => j.name);
    expect(names).toContain("billing:renew");
    expect(names).not.toContain("backup:postgres");
    const renew = received.flat().find((j) => j.name === "billing:renew");
    expect(renew?.jobId).toBe("billing:renew:2026-11-24T00:30");
  });

  it("enqueue() inside a JobQueueDO handler stays local and never touches BullMQ", async () => {
    const { enqueue } = await import("@mindkid/queue");
    const { JobQueueDO } = await import("./cloudflare-entry.js");
    enqueueFromConsumer.fn.mockImplementation(() =>
      enqueue("email:send", {
        notificationId: 7,
        to: "parent@example.vn",
        code: "verify_email",
        payload: {},
      })
    );

    const sql = createFakeDoSql();
    let alarmAt: number | null = null;
    const fakeD1 = createFakeD1();
    const dO = new JobQueueDO(
      {
        storage: {
          sql,
          getAlarm: () => Promise.resolve(alarmAt),
          setAlarm: (ms: number) => {
            alarmAt = ms;
            return Promise.resolve();
          },
        },
      },
      { DB_CORE: fakeD1, DB_LOGS: fakeD1, DB_BLOBS: fakeD1 }
    );
    await dO.enqueueBatch([
      {
        jobId: "sweep:abandoned:t1",
        name: "sweep:abandoned",
        payloadJson: "{}",
        maxAttempts: 1,
        backoffType: "fixed",
        backoffDelayMs: 1000,
        timeoutSeconds: 30,
      },
    ]);
    const drained = await dO.alarm();

    expect(drained.failed).toBe(0);
    expect(enqueueFromConsumer.fn).toHaveBeenCalledTimes(1);
    expect(await enqueueFromConsumer.fn.mock.results[0]?.value).toEqual({
      id: "email:send:7",
      name: "email:send",
    });
    expect(getCloudflareQueuePort()).toBeDefined();
  });
});
