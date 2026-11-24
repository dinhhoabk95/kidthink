import {
  getQueuePort,
  type QueuedJobEnvelope,
  registerQueuePort,
} from "@mindkid/queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFakeAuthCoordinator,
  createFakeD1,
  createFakeDoSql,
} from "./__tests__/cloudflare-fakes.js";

// `BR-JOB-11`, `BR-JOB-16`: adapter `node:sqlite` của runtime dev không được lọt vào đồ thị import
// của entry Cloudflare (workerd không có `node:sqlite`).
vi.mock("@mindkid/local-runtime", () => {
  throw new Error("local-runtime must not be loaded by the Cloudflare entry");
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
  });

  it("imports without loading local-runtime and exports DO classes + default scheduled()", async () => {
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
        AUTH_COORDINATOR: createFakeAuthCoordinator(),
        JOB_QUEUE_DO: {
          idFromName,
          get: () => ({
            enqueueBatch: (jobs) => {
              received.push([...jobs]);
              return Promise.resolve({ accepted: jobs.length });
            },
            getStats: () => Promise.resolve({ waiting: 42, failed: 7 }),
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

    // G4: cổng queue toàn cục ở đường cron là STUB của JobQueueDO, không phải engine.
    expect(await getQueuePort()?.getStats()).toEqual({
      waiting: 42,
      failed: 7,
    });
  });

  it("enqueue() inside a JobQueueDO handler stays on the DO engine and never touches the local runtime", async () => {
    const { enqueue } = await import("@mindkid/queue");
    registerQueuePort(undefined);
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
      {
        DB_CORE: fakeD1,
        DB_LOGS: fakeD1,
        DB_BLOBS: fakeD1,
        AUTH_COORDINATOR: createFakeAuthCoordinator(),
      }
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
    // G4: enqueue trong consumer đi vào engine của chính DO (waiting có email:send)...
    expect((await dO.getStats()).waiting).toBe(1);
    // ...nhưng engine KHÔNG được đăng ký toàn cục ra ngoài DO.
    expect(getQueuePort()).toBeUndefined();
  });
});
