import { getActiveObjectStorageDriver } from "@mindkid/storage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({ registerCloudflareD1Bindings: vi.fn() }));

vi.mock("nitropack/runtime", () => ({
  defineNitroPlugin: (fn: unknown) => fn,
}));
vi.mock("@mindkid/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/db")>();
  return {
    ...actual,
    registerCloudflareD1Bindings: dbMock.registerCloudflareD1Bindings,
  };
});

import { wireCloudflareEnv } from "#server/plugins/00-cloudflare-bindings";

const AUTH_COORDINATOR_RE = /AUTH_COORDINATOR/;
const DB_BLOBS_RE = /DB_BLOBS/;

const fakeD1 = {
  prepare: vi.fn(),
  batch: vi.fn(),
  exec: vi.fn(),
};

function makeNamespace() {
  const stub = {
    kvGet: vi.fn(),
    kvSet: vi.fn(),
    kvDel: vi.fn(),
    kvDeleteByPrefix: vi.fn(),
    consumeRateLimit: vi.fn(),
  };
  return {
    stub,
    get: vi.fn(() => stub),
    idFromName: vi.fn(() => ({})),
  };
}

describe("00-cloudflare-bindings fail-closed (BR-JOB-12)", () => {
  beforeEach(() => {
    dbMock.registerCloudflareD1Bindings.mockClear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("thiếu AUTH_COORDINATOR → ném lỗi rõ ràng và KHÔNG đánh dấu env đã nối", () => {
    const env = { DB_CORE: fakeD1, DB_BLOBS: fakeD1 };
    expect(() => wireCloudflareEnv(env)).toThrow(AUTH_COORDINATOR_RE);
    expect(() => wireCloudflareEnv(env)).toThrow(AUTH_COORDINATOR_RE);
  });

  it("thiếu DB_BLOBS → ném lỗi rõ ràng", () => {
    const env = { DB_CORE: fakeD1, AUTH_COORDINATOR: makeNamespace() };
    expect(() => wireCloudflareEnv(env)).toThrow(DB_BLOBS_RE);
  });

  it("đủ binding → nối một lần cho mỗi env", () => {
    const auth = makeNamespace();
    const env = {
      DB_CORE: fakeD1,
      DB_BLOBS: fakeD1,
      AUTH_COORDINATOR: auth,
    };
    wireCloudflareEnv(env);
    wireCloudflareEnv(env);
    expect(auth.get).toHaveBeenCalledTimes(1);
    expect(getActiveObjectStorageDriver()).toBeDefined();
  });
});
