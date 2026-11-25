import { describe, expect, it, vi } from "vitest";
import {
  AUTH_HINT_TTL_MS,
  classifySessionProbe,
  type HintStorage,
  hasAuthHint,
  probeSessionWithBackoff,
  type SessionProbeStatus,
  writeAuthHint,
} from "~/composables/auth-session-status";

function memoryStorage(): HintStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

/** P0 — get-session 429 không được coi là "chưa đăng nhập" (auth-tokens-sessions.md 6b). */
describe("classifySessionProbe", () => {
  it("429, 5xx, status 0 và lỗi không status là unavailable", () => {
    for (const status of [429, 500, 502, 503, 0, undefined]) {
      expect(classifySessionProbe({ data: null, error: { status } })).toBe(
        "unavailable"
      );
    }
  });

  it("401 hoặc 200 rỗng là anonymous", () => {
    expect(classifySessionProbe({ data: null, error: { status: 401 } })).toBe(
      "anonymous"
    );
    expect(classifySessionProbe({ data: null, error: null })).toBe("anonymous");
    expect(classifySessionProbe(null)).toBe("anonymous");
  });

  it("có data là authenticated", () => {
    expect(classifySessionProbe({ data: { user: {} }, error: null })).toBe(
      "authenticated"
    );
  });
});

describe("probeSessionWithBackoff", () => {
  it("thử lại khi unavailable với backoff 400ms rồi 1200ms, dừng khi có kết quả", async () => {
    const results: SessionProbeStatus[] = [
      "unavailable",
      "unavailable",
      "authenticated",
    ];
    const probe = vi.fn(() => Promise.resolve(results.shift() ?? "anonymous"));
    const sleep = vi.fn(() => Promise.resolve());
    const out = await probeSessionWithBackoff(probe, sleep);
    expect(out).toBe("authenticated");
    expect(probe).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((c) => (c as unknown as number[])[0])).toEqual([
      400, 1200,
    ]);
  });

  it("không retry khi anonymous", async () => {
    const probe = vi.fn(() => Promise.resolve<SessionProbeStatus>("anonymous"));
    const sleep = vi.fn(() => Promise.resolve());
    expect(await probeSessionWithBackoff(probe, sleep)).toBe("anonymous");
    expect(probe).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("hết lượt vẫn unavailable thì trả unavailable (không thành anonymous)", async () => {
    const probe = vi.fn(() =>
      Promise.resolve<SessionProbeStatus>("unavailable")
    );
    expect(await probeSessionWithBackoff(probe, () => Promise.resolve())).toBe(
      "unavailable"
    );
    expect(probe).toHaveBeenCalledTimes(3);
  });
});

describe("auth hint", () => {
  it("ghi, đọc, hết hạn sau 12 giờ và xoá khi anonymous", () => {
    const storage = memoryStorage();
    expect(hasAuthHint(1000, storage)).toBe(false);
    writeAuthHint(true, 1000, storage);
    expect(hasAuthHint(1000 + AUTH_HINT_TTL_MS - 1, storage)).toBe(true);
    expect(hasAuthHint(1000 + AUTH_HINT_TTL_MS, storage)).toBe(false);
    writeAuthHint(false, 2000, storage);
    expect(hasAuthHint(2000, storage)).toBe(false);
  });
});
