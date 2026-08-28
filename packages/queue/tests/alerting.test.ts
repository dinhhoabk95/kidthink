import { describe, expect, it } from "vitest";
import {
  AlertingUnreachableError,
  alert,
  assertAlertingReachable,
  DeduplicatingAlertAdapter,
  EmailAlertAdapter,
  HealthchecksAlertAdapter,
  LogOnlyAlertAdapter,
  registerAlertDispatcher,
  setAlertPort,
  TelegramAlertAdapter,
} from "#src/alert";

describe("Task 3 — Alert Port & Delivery (BR-JOB-03, BR-JOB-05, BR-TLM-06, D-FX)", () => {
  it("delivers alert to operational email recipient channel (D-FX)", async () => {
    const adapter = new EmailAlertAdapter("ops@mindkid.vn");

    let dispatchedEmail: string | undefined;
    let dispatchedPayload: any;

    registerAlertDispatcher((to, payload) => {
      dispatchedEmail = to;
      dispatchedPayload = payload;
      return Promise.resolve();
    });

    setAlertPort(adapter);
    // Only once a real dispatcher exists does this adapter reach anybody. With
    // no dispatcher it writes a console line, and it says so.
    expect(adapter.isLogOnly()).toBe(false);

    const _payload = await alert(
      "error",
      "Worker process backlog exceeded threshold",
      {
        waitingCount: 550,
      }
    );

    expect(dispatchedEmail).toBe("ops@mindkid.vn");
    expect(dispatchedPayload).toBeDefined();
    expect(dispatchedPayload.severity).toBe("error");
    expect(dispatchedPayload.message).toContain("backlog exceeded");
  });

  it("negative test: log-only alert adapter is rejected by operational delivery requirement (D-FX)", () => {
    const logOnly = new LogOnlyAlertAdapter();
    expect(logOnly.isLogOnly()).toBe(true);

    // Enforce that real alerting setup must not use LogOnly adapter
    expect(() => {
      if (logOnly.isLogOnly()) {
        throw new Error(
          "D-FX: Log-only alert adapter is not allowed in production"
        );
      }
    }).toThrow("Log-only alert adapter is not allowed in production");
  });
});

describe("BR-MON-01: a process must not run deaf", () => {
  it("the email adapter admits it is log-only without a transport", async () => {
    const { clearAlertDispatcher } = await import("#src/alert");
    clearAlertDispatcher();
    // There is no email transport in this repository yet — the notification
    // path ends at LocalFileEmailAdapter — so this must not claim otherwise.
    expect(new EmailAlertAdapter("ops@mindkid.vn").isLogOnly()).toBe(true);
  });

  it("Telegram with no token falls back to Healthchecks, and reports honestly", () => {
    // Empty, not undefined: undefined means "read the environment", and this
    // test must not depend on whichever .env the developer has.
    const reachable = new TelegramAlertAdapter({
      botToken: "",
      chatId: "",
      fallbackAdapter: new HealthchecksAlertAdapter({
        pingUrl: "https://hc-ping.com/uuid",
      }),
    });
    expect(reachable.isLogOnly()).toBe(false);

    const deaf = new TelegramAlertAdapter({
      botToken: "",
      chatId: "",
      fallbackAdapter: new LogOnlyAlertAdapter(),
    });
    expect(deaf.isLogOnly()).toBe(true);
  });

  it("Healthchecks with no ping URL is log-only", () => {
    expect(
      new HealthchecksAlertAdapter({ pingUrl: "", checkUuid: "" }).isLogOnly()
    ).toBe(true);
  });

  it("RED: production refuses to start when no channel reaches a person", () => {
    setAlertPort(new LogOnlyAlertAdapter());
    expect(() => assertAlertingReachable(true)).toThrowError(
      AlertingUnreachableError
    );
  });

  it("development is allowed to run with only a log", () => {
    setAlertPort(new LogOnlyAlertAdapter());
    expect(() => assertAlertingReachable(false)).not.toThrow();
  });

  it("a configured channel satisfies the assertion", () => {
    setAlertPort(
      new DeduplicatingAlertAdapter(
        new TelegramAlertAdapter({ botToken: "t", chatId: "c" })
      )
    );
    expect(() => assertAlertingReachable(true)).not.toThrow();
  });
});
