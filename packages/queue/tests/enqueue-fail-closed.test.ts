import { ServiceUnavailableError } from "@mindkid/errors/common";
import { afterEach, describe, expect, it } from "vitest";
import {
  enqueue,
  enqueueBatch,
  getFailedCount,
  getWaitingCount,
  registerQueuePort,
} from "#src/index";

describe("enqueue đóng-khi-lỗi khi chưa nối port (BR-JOB-12, BR-JOB-16)", () => {
  afterEach(() => {
    registerQueuePort(undefined);
  });

  it("enqueue ném ServiceUnavailableError khi chưa nối port", async () => {
    registerQueuePort(undefined);
    await expect(
      enqueue("rollup:session", { sessionUuid: "s1" })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it("enqueueBatch ném ServiceUnavailableError khi chưa nối port", async () => {
    registerQueuePort(undefined);
    await expect(
      enqueueBatch([{ name: "rollup:session", payload: { sessionUuid: "s1" } }])
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it("getWaitingCount ném ServiceUnavailableError khi chưa nối port", async () => {
    registerQueuePort(undefined);
    await expect(getWaitingCount()).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });

  it("getFailedCount ném ServiceUnavailableError khi chưa nối port", async () => {
    registerQueuePort(undefined);
    await expect(getFailedCount()).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });
});
