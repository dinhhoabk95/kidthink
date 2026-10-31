import { AppError } from "@mindkid/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import paymentWebhookHandler from "#server/api/guest/webhooks/payments/[provider].post";
import {
  buildWebhookPayload,
  mockRawWebhookEvent,
  signRawBody,
} from "~~/tests/mock-payment-webhook.js";

const processMock = vi.hoisted(() => vi.fn());

vi.mock("#server/services/index.js", () => ({
  processAutomatedPaymentWebhook: processMock,
}));

async function rejectionOf(
  promise: Promise<unknown>
): Promise<AppError | undefined> {
  try {
    await promise;
  } catch (error) {
    return error instanceof AppError ? error : undefined;
  }
  return undefined;
}

describe("Payment webhook route — UC-079 BR-001", () => {
  beforeEach(() => {
    processMock.mockReset();
    processMock.mockResolvedValue({
      success: true,
      orderUuid: "00000000-0000-4000-8000-000000000001",
      orderStatus: "approved",
      isDuplicate: false,
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("accepts a body signed over its exact raw bytes", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload());
    const response = await paymentWebhookHandler(
      mockRawWebhookEvent({
        provider: "payos",
        rawBody,
        signature: signRawBody(rawBody),
      })
    );

    expect(response.ok).toBe(true);
    expect(processMock).toHaveBeenCalledTimes(1);
  });

  it("accepts a gateway body whose key order and whitespace differ from JSON.stringify", async () => {
    const payload = buildWebhookPayload();
    const rawBody = `{ "mode" : "sandbox",\n  "merchant_id":"test_merchant",\n  "timestamp_seconds": ${payload.timestamp_seconds}, "status":"success", "amount_vnd":299000,\n "order_uuid":"${payload.order_uuid}", "provider_event_id":"${payload.provider_event_id}", "provider":"payos" }`;

    const response = await paymentWebhookHandler(
      mockRawWebhookEvent({
        provider: "payos",
        rawBody,
        signature: signRawBody(rawBody),
      })
    );

    expect(response.ok).toBe(true);
  });

  it("rejects a wrong signature with WEBHOOK_SIGNATURE_INVALID and processes nothing", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload());
    const error = await rejectionOf(
      paymentWebhookHandler(
        mockRawWebhookEvent({
          provider: "payos",
          rawBody,
          signature: signRawBody(rawBody, "another-secret-0123456789"),
        })
      )
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(error?.status).toBe(401);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a body that was re-whitespaced after signing", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload());
    const signature = signRawBody(rawBody);
    const tampered = JSON.stringify(JSON.parse(rawBody), null, 2);

    const error = await rejectionOf(
      paymentWebhookHandler(
        mockRawWebhookEvent({ provider: "payos", rawBody: tampered, signature })
      )
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a missing signature header", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload());
    const error = await rejectionOf(
      paymentWebhookHandler(mockRawWebhookEvent({ provider: "payos", rawBody }))
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(processMock).not.toHaveBeenCalled();
  });

  it("ignores a signature embedded in the body", async () => {
    const payload = buildWebhookPayload();
    const withoutSig = JSON.stringify(payload);
    const rawBody = JSON.stringify({
      ...payload,
      signature: signRawBody(withoutSig),
    });
    const error = await rejectionOf(
      paymentWebhookHandler(mockRawWebhookEvent({ provider: "payos", rawBody }))
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or empty body", async () => {
    for (const rawBody of [undefined, ""]) {
      const error = await rejectionOf(
        paymentWebhookHandler(
          mockRawWebhookEvent({
            provider: "payos",
            rawBody,
            signature: signRawBody("{}"),
          })
        )
      );
      expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    }
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a correctly signed but non-JSON or off-schema body without processing", async () => {
    for (const rawBody of ["not json", JSON.stringify({ provider: "payos" })]) {
      const error = await rejectionOf(
        paymentWebhookHandler(
          mockRawWebhookEvent({
            provider: "payos",
            rawBody,
            signature: signRawBody(rawBody),
          })
        )
      );
      expect(error?.code).toBe("VALIDATION_FAILED");
    }
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a validly signed signal from an unknown merchant", async () => {
    const rawBody = JSON.stringify(
      buildWebhookPayload({ merchant_id: "someone_else" })
    );
    const error = await rejectionOf(
      paymentWebhookHandler(
        mockRawWebhookEvent({
          provider: "payos",
          rawBody,
          signature: signRawBody(rawBody),
        })
      )
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a validly signed live signal while the system runs in sandbox", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload({ mode: "live" }));
    const error = await rejectionOf(
      paymentWebhookHandler(
        mockRawWebhookEvent({
          provider: "payos",
          rawBody,
          signature: signRawBody(rawBody),
        })
      )
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rejects a sandbox signal while the system runs live", async () => {
    vi.stubEnv("PAYMENT_MODE", "live");
    try {
      const rawBody = JSON.stringify(buildWebhookPayload({ mode: "sandbox" }));
      const error = await rejectionOf(
        paymentWebhookHandler(
          mockRawWebhookEvent({
            provider: "payos",
            rawBody,
            signature: signRawBody(rawBody),
          })
        )
      );
      expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
      expect(processMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects a body whose provider field differs from the route provider", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload({ provider: "momo" }));
    const error = await rejectionOf(
      paymentWebhookHandler(
        mockRawWebhookEvent({
          provider: "payos",
          rawBody,
          signature: signRawBody(rawBody),
        })
      )
    );

    expect(error?.code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect(processMock).not.toHaveBeenCalled();
  });

  it("fails closed when PAYMENT_MODE is not configured", async () => {
    vi.stubEnv("PAYMENT_MODE", "");
    try {
      const rawBody = JSON.stringify(buildWebhookPayload());
      await expect(
        paymentWebhookHandler(
          mockRawWebhookEvent({
            provider: "payos",
            rawBody,
            signature: signRawBody(rawBody),
          })
        )
      ).rejects.toThrow();
      expect(processMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("passes the stale-timestamp signal on to the service, which owns the 5-minute window", async () => {
    const stale = buildWebhookPayload({
      timestamp_seconds: Math.floor(Date.now() / 1000) - 3600,
    });
    const rawBody = JSON.stringify(stale);
    await paymentWebhookHandler(
      mockRawWebhookEvent({
        provider: "payos",
        rawBody,
        signature: signRawBody(rawBody),
      })
    );

    expect(processMock).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp_seconds: stale.timestamp_seconds })
    );
  });

  it("accepts the signature from x-signature too", async () => {
    const rawBody = JSON.stringify(buildWebhookPayload());
    const response = await paymentWebhookHandler(
      mockRawWebhookEvent({
        provider: "payos",
        rawBody,
        signature: signRawBody(rawBody),
        headerName: "x-signature",
      })
    );
    expect(response.ok).toBe(true);
  });
});
