import { uploadPrivateAsset } from "@mindkid/storage";
import { afterEach, describe, expect, it, vi } from "vitest";

const repoMock = vi.hoisted(() => ({
  orders: {
    countAll: vi.fn(() => Promise.resolve(0)),
    listForExport: vi.fn(() => Promise.resolve([])),
  },
  auditLogs: {
    transaction: vi.fn((fn: (tx: object) => Promise<void>) => fn({})),
  },
}));

vi.mock("#server/utils/repositories", () => ({
  useOwnerRepositories: () => repoMock,
}));
vi.mock("@mindkid/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/storage")>();
  return {
    ...actual,
    uploadPrivateAsset: vi.fn(actual.uploadPrivateAsset),
  };
});
vi.mock("@mindkid/audit", () => ({
  writeAudit: vi.fn(() => Promise.resolve()),
}));
vi.mock("@mindkid/cache", () => ({
  checkRateLimit: vi.fn(() =>
    Promise.resolve({ allowed: true, remaining: 4, resetSeconds: 1 })
  ),
}));

import { generateAdminExport } from "#server/services/admin-export-service";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("CSV export admin có hạn lưu 1 ngày (BR-IMG-15)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uploadPrivateAsset nhận expiresAt = now + 1 ngày", async () => {
    const upload = vi.mocked(uploadPrivateAsset);
    const before = Date.now();
    await generateAdminExport({
      kind: "revenue",
      managerId: 1,
      reason: "kiểm tra hạn lưu trữ",
    });
    const options = upload.mock.calls[0]?.[0];
    expect(options?.expiresAt).toBeInstanceOf(Date);
    const delta = (options?.expiresAt?.getTime() ?? 0) - before;
    expect(delta).toBeGreaterThanOrEqual(ONE_DAY_MS - 1000);
    expect(delta).toBeLessThanOrEqual(ONE_DAY_MS + 5000);
  });
});
