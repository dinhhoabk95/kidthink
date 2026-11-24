import { ServiceUnavailableError } from "@mindkid/errors/common";
import { afterEach, describe, expect, it } from "vitest";
import {
  enqueue,
  enqueueBatch,
  getFailedCount,
  getWaitingCount,
  registerCloudflareQueuePort,
} from "#src/index";

describe("enqueue đóng-khi-lỗi trên driver cloudflare-do (BR-JOB-12)", () => {
  afterEach(() => {
    registerCloudflareQueuePort(undefined);
    // biome-ignore lint/performance/noDelete: env var phải bị gỡ thật
    delete process.env.QUEUE_DRIVER;
  });

  it("enqueue ném ServiceUnavailableError khi chưa nối port, không dùng BullMQ", async () => {
    process.env.QUEUE_DRIVER = "cloudflare-do";
    registerCloudflareQueuePort(undefined);
    await expect(
      enqueue("rollup:session", { sessionUuid: "s1" })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it("enqueueBatch ném ServiceUnavailableError khi chưa nối port", async () => {
    process.env.QUEUE_DRIVER = "cloudflare-do";
    registerCloudflareQueuePort(undefined);
    await expect(
      enqueueBatch([{ name: "rollup:session", payload: { sessionUuid: "s1" } }])
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it("getWaitingCount ném ServiceUnavailableError khi chưa nối port, không rơi về BullMQ", async () => {
    process.env.QUEUE_DRIVER = "cloudflare-do";
    registerCloudflareQueuePort(undefined);
    await expect(getWaitingCount()).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });

  it("getFailedCount ném ServiceUnavailableError khi chưa nối port, không rơi về BullMQ", async () => {
    process.env.QUEUE_DRIVER = "cloudflare-do";
    registerCloudflareQueuePort(undefined);
    await expect(getFailedCount()).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });
});
