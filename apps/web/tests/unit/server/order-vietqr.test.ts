import { MissingEnvError } from "@mindkid/config";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import { afterEach, describe, expect, it, vi } from "vitest";

const generateMock = vi.hoisted(() => vi.fn());

vi.mock("@mindkid/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/shared")>();
  return { ...actual, generateVietQrPayload: generateMock };
});

import { buildVietQrOrThrow } from "#server/services/order-service";

describe("buildVietQrOrThrow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    generateMock.mockReset();
  });

  it("thiếu env => 503 và log tên biến thiếu", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    generateMock.mockImplementation(() => {
      throw new MissingEnvError("VIETQR_BANK_ID", "hint");
    });
    expect(() => buildVietQrOrThrow(1000, "MK1")).toThrow(
      ServiceUnavailableError
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0]?.[0])).toContain("VIETQR_BANK_ID");
  });

  it("lỗi khác được ném lại nguyên trạng", () => {
    const bug = new TypeError("bug");
    generateMock.mockImplementation(() => {
      throw bug;
    });
    expect(() => buildVietQrOrThrow(1000, "MK1")).toThrow(bug);
  });
});
