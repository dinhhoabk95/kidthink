import { alert } from "@mindkid/queue";
import type { Job } from "bullmq";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { closeWorker, processJob, startWorker } from "./worker.js";

const unknownJobRegex = /Unknown job name/;

vi.mock("@mindkid/queue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/queue")>();
  return {
    ...actual,
    alert: vi.fn(),
  };
});

describe("apps/worker", () => {
  beforeAll(async () => {
    // Start worker in test mode or just test the process function
  });

  afterAll(async () => {
    await closeWorker();
    vi.restoreAllMocks();
  });

  it("processJob throws error for unregistered job names and calls alert (BR-BAK-04 proxy)", async () => {
    const fakeJob = { name: "unknown:job", data: {}, id: "fake-id" } as Job;

    await expect(processJob(fakeJob)).rejects.toThrow(unknownJobRegex);
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Job failed",
      expect.objectContaining({
        jobId: "fake-id",
        error: expect.stringContaining("Unknown job name"),
      })
    );
  });

  it("worker can be started and closed cleanly", async () => {
    const worker = startWorker();
    expect(worker).toBeDefined();

    // Close it
    await closeWorker();
  });
});
