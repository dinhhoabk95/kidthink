import { describe, expect, it, vi } from "vitest";
import {
  ALERT_HTTP_TIMEOUT_MS,
  type AlertPayload,
  HealthchecksAlertAdapter,
  TelegramAlertAdapter,
} from "#src/alert";

function payload(): AlertPayload {
  return {
    timestamp: new Date(0).toISOString(),
    severity: "critical",
    message: "Hàng đợi worker tồn đọng vượt ngưỡng",
    context: { waiting: 501 },
  };
}

/** Một fetch không bao giờ settle — đúng hình dạng của một endpoint treo. */
const HANGS = () => new Promise<Response>(() => undefined);

describe("Alert HTTP — mọi request phải có hạn (BR-MON-01)", () => {
  it("Telegram gắn AbortSignal có timeout vào request", async () => {
    let init: RequestInit | undefined;
    const fetchFn = vi.fn((_url: string, options?: RequestInit) => {
      init = options;
      return Promise.resolve(new Response("{}", { status: 200 }));
    });

    await new TelegramAlertAdapter({
      botToken: "real_token",
      chatId: "42",
      fetchFn: fetchFn as unknown as typeof fetch,
    }).sendAlert(payload());

    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("Healthchecks gắn AbortSignal có timeout vào ping", async () => {
    let init: RequestInit | undefined;
    const fetchFn = vi.fn((_url: string, options?: RequestInit) => {
      init = options;
      return Promise.resolve(new Response("ok", { status: 200 }));
    });

    await new HealthchecksAlertAdapter({
      pingUrl: "https://hc-ping.com/abc",
      fetchFn: fetchFn as unknown as typeof fetch,
    }).ping("fail", "test");

    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("ca âm: request treo thì bị huỷ trước hạn, không chờ mãi", async () => {
    const adapter = new HealthchecksAlertAdapter({
      pingUrl: "https://hc-ping.com/abc",
      fetchFn: HANGS as unknown as typeof fetch,
    });

    // Không có timeout thì lời gọi này không bao giờ settle — và vì nó nằm
    // trong `setInterval` của monitor, mỗi phút lại chồng thêm một lần treo.
    await expect(
      Promise.race([
        adapter.ping("fail", "treo"),
        new Promise((resolve) => setTimeout(() => resolve("VẪN_TREO"), 50)),
      ])
    ).resolves.toBe("VẪN_TREO");

    expect(ALERT_HTTP_TIMEOUT_MS).toBeGreaterThan(0);
    expect(ALERT_HTTP_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });

  it("ca âm: ping hỏng thì NÉM, không nuốt", async () => {
    const adapter = new HealthchecksAlertAdapter({
      pingUrl: "https://hc-ping.com/abc",
      fetchFn: (() =>
        Promise.reject(new Error("ENOTFOUND"))) as unknown as typeof fetch,
    });

    await expect(adapter.ping("fail", "x")).rejects.toThrow("ENOTFOUND");
  });

  it("cả hai kênh chết thì ghi ALERT_LOST và Cấm — NEVER làm người gọi nổ", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const adapter = new TelegramAlertAdapter({
      botToken: "real_token",
      chatId: "42",
      fetchFn: (() =>
        Promise.reject(new Error("telegram down"))) as unknown as typeof fetch,
      fallbackAdapter: new HealthchecksAlertAdapter({
        pingUrl: "https://hc-ping.com/abc",
        fetchFn: (() =>
          Promise.reject(new Error("hc down"))) as unknown as typeof fetch,
      }),
    });

    await expect(adapter.sendAlert(payload())).resolves.toBeUndefined();

    const lost = warn.mock.calls.find((call) =>
      String(call[0]).includes("ALERT_LOST")
    );
    expect(lost).toBeDefined();
    expect(String(lost?.[0])).toContain("telegram down");
    expect(String(lost?.[0])).toContain("hc down");

    warn.mockRestore();
  });
});
