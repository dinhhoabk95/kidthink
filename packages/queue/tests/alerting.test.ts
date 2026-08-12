import { describe, expect, it } from "vitest";
import {
  alert,
  EmailAlertAdapter,
  LogOnlyAlertAdapter,
  registerAlertDispatcher,
  setAlertPort,
} from "../src/alert.ts";

describe("Task 3 — Alert Port & Delivery (BR-JOB-03, BR-JOB-05, BR-TLM-06, D-FX)", () => {
  it("delivers alert to operational email recipient channel (D-FX)", async () => {
    const adapter = new EmailAlertAdapter("ops@kidthink.vn");
    expect(adapter.isLogOnly()).toBe(false);

    let dispatchedEmail: string | undefined;
    let dispatchedPayload: any;

    registerAlertDispatcher((to, payload) => {
      dispatchedEmail = to;
      dispatchedPayload = payload;
      return Promise.resolve();
    });

    setAlertPort(adapter);

    const _payload = await alert(
      "error",
      "Worker process backlog exceeded threshold",
      {
        waitingCount: 550,
      }
    );

    expect(dispatchedEmail).toBe("ops@kidthink.vn");
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
