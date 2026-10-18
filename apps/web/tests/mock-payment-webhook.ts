import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { computePaymentWebhookSignature } from "@mindkid/shared";
import { createEvent } from "h3";

export interface WebhookPayloadFixture {
  provider: string;
  provider_event_id: string;
  order_uuid: string;
  amount_vnd: number;
  status: string;
  timestamp_seconds: number;
  merchant_id: string;
  mode: string;
}

export function buildWebhookPayload(
  overrides: Partial<WebhookPayloadFixture> = {}
): WebhookPayloadFixture {
  return {
    provider: "payos",
    provider_event_id: `evt_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
    order_uuid: "00000000-0000-4000-8000-000000000001",
    amount_vnd: 299_000,
    status: "success",
    timestamp_seconds: Math.floor(Date.now() / 1000),
    merchant_id: "test_merchant",
    mode: "sandbox",
    ...overrides,
  };
}

/** Khoá ký mà route sẽ dùng cho payos trong môi trường test. */
export function payosWebhookSecret(): string {
  return (
    process.env.PAYMENT_PAYOS_WEBHOOK_SECRET ??
    process.env.PAYMENT_WEBHOOK_SECRET ??
    ""
  );
}

export function signRawBody(rawBody: string, secret = payosWebhookSecret()) {
  return computePaymentWebhookSignature(rawBody, secret);
}

/**
 * Dựng H3Event thật với thân là luồng byte thô: route phải tự đọc
 * `readRawBody`, không có `context.body` đã parse sẵn nào để dựa vào.
 */
export function mockRawWebhookEvent(params: {
  provider: string;
  rawBody?: string;
  signature?: string;
  headerName?: string;
}) {
  const headers: Record<string, string> = {};
  if (params.signature !== undefined) {
    headers[params.headerName ?? "x-webhook-signature"] = params.signature;
  }
  if (params.rawBody !== undefined) {
    headers["content-length"] = String(Buffer.byteLength(params.rawBody));
  }
  const chunks =
    params.rawBody === undefined ? [] : [Buffer.from(params.rawBody, "utf8")];
  const req = Object.assign(Readable.from(chunks), {
    method: "POST",
    url: `/api/guest/webhooks/payments/${params.provider}`,
    headers,
  }) as unknown as IncomingMessage;
  const res = {} as ServerResponse;
  const event = createEvent(req, res);
  event.context.params = { provider: params.provider };
  return event;
}
