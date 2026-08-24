import { describe, expect, it, vi } from "vitest";
import {
  type AlertPayload,
  alert,
  DeadManSwitchMonitor,
  DeduplicatingAlertAdapter,
  HealthchecksAlertAdapter,
  setAlertPort,
  TelegramAlertAdapter,
} from "#src/alert";

describe("Task 1 — Alert Adapters & Reliability (BR-MON-01, BR-MON-03, BR-MON-04, D-IQ, D-S)", () => {
  it("TelegramAlertAdapter formats message and dispatches to Telegram Bot API", async () => {
    let calledUrl = "";
    let requestBody: {
      chat_id?: string;
      text?: string;
      [key: string]: unknown;
    } | null = null;

    const mockFetch = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        calledUrl = url;
        requestBody = JSON.parse((init?.body as string) || "{}");
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response);
      });

    const adapter = new TelegramAlertAdapter({
      botToken: "test_bot_token_123",
      chatId: "ops_channel_456",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const payload: AlertPayload = {
      timestamp: "2026-08-14T10:00:00.000Z",
      severity: "critical",
      message: "Database connection failed",
      context: { host: "db.mindkid.vn", error_code: "ECONNREFUSED" },
      runbook: "https://docs.tinimath.vn/runbooks/db-disconnected",
    };

    await adapter.sendAlert(payload);

    expect(calledUrl).toBe(
      "https://api.telegram.org/bottest_bot_token_123/sendMessage"
    );
    const body = requestBody as {
      chat_id?: string;
      text?: string;
      [key: string]: unknown;
    } | null;
    expect(body?.chat_id).toBe("ops_channel_456");
    expect(String(body?.text)).toContain(
      "[ALERT:CRITICAL] Database connection failed"
    );
    expect(String(body?.text)).toContain(
      "https://docs.tinimath.vn/runbooks/db-disconnected"
    );
    expect(String(body?.text)).toContain("ECONNREFUSED");
  });

  it("TelegramAlertAdapter automatically falls back to Email on 5xx failure and logs incident (D-S)", async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
      } as Response);
    });

    let fallbackReceived: AlertPayload | null = null;
    const fallbackEmailAdapter = {
      sendAlert: (p: AlertPayload) => {
        fallbackReceived = p;
        return Promise.resolve();
      },
      isLogOnly: () => false,
    };

    const adapter = new TelegramAlertAdapter({
      botToken: "test_bot_token_123",
      chatId: "ops_channel_456",
      fallbackAdapter: fallbackEmailAdapter,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const payload: AlertPayload = {
      timestamp: "2026-08-14T10:00:00.000Z",
      severity: "error",
      message: "Redis memory pressure high",
      context: { used_memory_mb: 950 },
    };

    await adapter.sendAlert(payload);

    expect(fallbackReceived).not.toBeNull();
    const fallback = fallbackReceived as AlertPayload | null;
    expect(fallback?.message).toBe("Redis memory pressure high");
    expect(fallback?.context?._fallback_from).toBe("telegram");
    expect(String(fallback?.context?._fallback_reason)).toContain("HTTP 502");
  });

  it("HealthchecksAlertAdapter sends dead-man switch pings and failure signals", async () => {
    let pingedEndpoint = "";
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      pingedEndpoint = url;
      return Promise.resolve({ ok: true, status: 200 } as Response);
    });

    const hcAdapter = new HealthchecksAlertAdapter({
      pingUrl: "https://hc-ping.com/12345678-abcd-ef01-2345-6789abcdef01",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    await hcAdapter.ping("success", "Heartbeat tick");
    expect(pingedEndpoint).toBe(
      "https://hc-ping.com/12345678-abcd-ef01-2345-6789abcdef01"
    );

    await hcAdapter.ping("fail", "DB unavailable");
    expect(pingedEndpoint).toBe(
      "https://hc-ping.com/12345678-abcd-ef01-2345-6789abcdef01/fail"
    );

    await hcAdapter.ping("start");
    expect(pingedEndpoint).toBe(
      "https://hc-ping.com/12345678-abcd-ef01-2345-6789abcdef01/start"
    );
  });

  it("DeduplicatingAlertAdapter suppresses duplicate alerts within 15-minute sliding window (BR-MON-01)", async () => {
    const deliveredAlerts: AlertPayload[] = [];
    const innerPort = {
      sendAlert: (p: AlertPayload) => {
        deliveredAlerts.push(p);
        return Promise.resolve();
      },
      isLogOnly: () => false,
    };

    const dedupeAdapter = new DeduplicatingAlertAdapter(
      innerPort,
      15 * 60 * 1000
    );

    const basePayload: AlertPayload = {
      timestamp: "2026-08-14T10:00:00.000Z",
      severity: "critical",
      message: "Valkey cluster unavailable",
      context: { port: 6379 },
    };

    // 1st delivery at T=0m -> Delivered
    await dedupeAdapter.sendAlert(basePayload);
    expect(deliveredAlerts.length).toBe(1);

    // 2nd delivery at T=5m (same severity + message) -> Suppressed
    await dedupeAdapter.sendAlert(basePayload);
    expect(deliveredAlerts.length).toBe(1);

    // 3rd delivery at T=10m -> Suppressed
    await dedupeAdapter.sendAlert(basePayload);
    expect(deliveredAlerts.length).toBe(1);

    // Different message -> Delivered immediately
    await dedupeAdapter.sendAlert({
      ...basePayload,
      message: "Different alert message",
    });
    expect(deliveredAlerts.length).toBe(2);
  });

  it("Negative test: 15m window ensures at most 4 alerts per hour during persistent failure", async () => {
    let callCount = 0;
    const innerPort = {
      sendAlert: () => {
        callCount++;
        return Promise.resolve();
      },
      isLogOnly: () => false,
    };

    const dedupeAdapter = new DeduplicatingAlertAdapter(
      innerPort,
      15 * 60 * 1000
    );

    // Simulate 60 rapid attempts over 1 hour (every 1 minute)
    const t0 = Date.now();
    for (let minute = 0; minute < 60; minute++) {
      const simulatedTime = t0 + minute * 60 * 1000;
      await dedupeAdapter.sendAlertWithTime(
        {
          timestamp: new Date(simulatedTime).toISOString(),
          severity: "critical",
          message: "Continuous disk exhaustion",
          context: { percent: 99 },
        },
        simulatedTime
      );
    }

    // In 60 minutes, with 15m sliding window: attempts at min 0, 15, 30, 45 trigger = exactly 4 alerts
    expect(callCount).toBe(4);
  });

  it("Scenario: BR-MON-04 — DeadManSwitch triggers alert via independent channel after 10m silence", async () => {
    let independentAlertReceived: AlertPayload | null = null;
    const independentPort = {
      sendAlert: (p: AlertPayload) => {
        independentAlertReceived = p;
        return Promise.resolve();
      },
      isLogOnly: () => false,
    };

    const monitor = new DeadManSwitchMonitor(independentPort, 10 * 60 * 1000);
    const t0 = 1_700_000_000_000;

    monitor.recordHeartbeat(t0);

    // 5 minutes later -> No alert
    const triggeredAt5m = await monitor.checkHeartbeat(t0 + 5 * 60 * 1000);
    expect(triggeredAt5m).toBe(false);
    expect(independentAlertReceived).toBeNull();

    // 10 minutes later -> Alert triggered on independent channel!
    const triggeredAt10m = await monitor.checkHeartbeat(t0 + 10 * 60 * 1000);
    expect(triggeredAt10m).toBe(true);
    expect(independentAlertReceived).not.toBeNull();
    const indAlert = independentAlertReceived as AlertPayload | null;
    expect(indAlert?.message).toContain("BR-MON-04");
    expect(indAlert?.context?.independentChannel).toBe(true);
  });

  it("Scenario: D-IQ — all alerts pass through AlertPort, no direct unauthorized calls", async () => {
    let dispatchedThroughPort = false;
    const port = {
      sendAlert: () => {
        dispatchedThroughPort = true;
        return Promise.resolve();
      },
      isLogOnly: () => false,
    };

    setAlertPort(port);
    await alert("error", "Testing AlertPort routing boundary", { check: true });
    expect(dispatchedThroughPort).toBe(true);
  });
});
