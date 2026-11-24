import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveProductionEmailAdapter } from "./email-send.js";

describe("resolveProductionEmailAdapter (#20 Brevo HTTP Email Adapter)", () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv.NODE_ENV = process.env.NODE_ENV;
    savedEnv.MINDKID_RUNTIME = process.env.MINDKID_RUNTIME;
    savedEnv.BREVO_API_KEY = process.env.BREVO_API_KEY;
    savedEnv.EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;
    savedEnv.EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME;

    Reflect.deleteProperty(process.env, "BREVO_API_KEY");
    Reflect.deleteProperty(process.env, "EMAIL_FROM_ADDRESS");
    Reflect.deleteProperty(process.env, "EMAIL_FROM_NAME");
    Reflect.deleteProperty(process.env, "MINDKID_RUNTIME");
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) {
        Reflect.deleteProperty(process.env, k);
      } else {
        process.env[k] = v;
      }
    }
    vi.restoreAllMocks();
  });

  it("returns undefined in local dev/test when Brevo config is absent", () => {
    expect(resolveProductionEmailAdapter()).toBeUndefined();
  });

  it("throws fail-closed in production when Brevo config is missing", () => {
    process.env.NODE_ENV = "production";
    expect(() => resolveProductionEmailAdapter()).toThrow(
      "Missing Brevo HTTP email configuration"
    );
  });

  it("throws fail-closed in Cloudflare runtime when Brevo config is missing", () => {
    process.env.MINDKID_RUNTIME = "cloudflare";
    expect(() => resolveProductionEmailAdapter()).toThrow(
      "Missing Brevo HTTP email configuration"
    );
  });

  it("wraps BrevoHttpEmailDriver, suppresses deleted users, and throws on HTTP failure", async () => {
    process.env.NODE_ENV = "production";
    process.env.BREVO_API_KEY = "xkeysib-test-key";
    process.env.EMAIL_FROM_ADDRESS = "no-reply@tinimath.vn";
    process.env.EMAIL_FROM_NAME = "TiniMath";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messageId: "<brevo-msg-1>" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }));

    const adapter = resolveProductionEmailAdapter();
    expect(adapter).toBeDefined();
    if (!adapter) {
      return;
    }

    const suppressed = await adapter.sendEmail({
      to: "parent@example.com",
      code: "order_approved",
      payload: { orderCode: "ORD-1", packageName: "Standard" },
      recipientStatus: "deleted",
    });
    expect(suppressed).toEqual({
      sent: false,
      suppressedReason: "ACCOUNT_DELETED",
    });
    expect(fetchMock).not.toHaveBeenCalled();

    const dispatched = await adapter.sendEmail({
      to: "parent@example.com",
      code: "order_approved",
      payload: { orderCode: "ORD-1", packageName: "Standard" },
    });
    expect(dispatched).toEqual({
      sent: true,
      providerMessageId: "<brevo-msg-1>",
    });

    await expect(
      adapter.sendEmail({
        to: "parent@example.com",
        code: "order_approved",
        payload: { orderCode: "ORD-2", packageName: "Standard" },
      })
    ).rejects.toThrow("Brevo HTTP 401");
  });
});
