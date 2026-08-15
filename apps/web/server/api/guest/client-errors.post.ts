import { errorLogs, getOwnerDb } from "@kidthink/db";
import { createError, defineEventHandler, readBody } from "h3";

// Rate limiting: 10 req / min / IP (BR-ELV-05)
const clientErrorRateLimit = new Map<
  string,
  { count: number; windowStart: number }
>();

function checkClientErrorRateLimit(ip: string): void {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const record = clientErrorRateLimit.get(ip);

  if (record && now - record.windowStart < windowMs) {
    if (record.count >= 10) {
      throw createError({
        statusCode: 429,
        statusMessage: "RATE_LIMIT_EXCEEDED",
        message: "Quá giới hạn gửi báo cáo lỗi client (tối đa 10 lần/phút)",
      });
    }
    record.count++;
  } else {
    clientErrorRateLimit.set(ip, { count: 1, windowStart: now });
  }
}

// Sampling rates (BR-ELV-04)
function shouldSampleError(code: string): boolean {
  let rate = 0.5; // Uncategorized 50%
  if (code.startsWith("ASSET_")) {
    rate = 0.1; // 10%
  } else if (code.startsWith("ENGINE_") || code.startsWith("GAME_")) {
    rate = 1.0; // 100%
  } else if (code.startsWith("NETWORK_") || code.startsWith("FETCH_")) {
    rate = 0.05; // 5%
  }

  return Math.random() < rate;
}

// Allowlisted context keys (BR-ELV-03: Strip child PII / unwhitelisted keys)
const ALLOWED_CONTEXT_KEYS = [
  "route",
  "app_version",
  "device_type",
  "browser",
  "os",
  "dpr",
  "viewport",
];

function sanitizeContext(ctx: unknown): Record<string, unknown> {
  if (!ctx || typeof ctx !== "object") {
    return {};
  }
  const cleaned: Record<string, unknown> = {};
  for (const key of ALLOWED_CONTEXT_KEYS) {
    if (key in (ctx as Record<string, unknown>)) {
      cleaned[key] = (ctx as Record<string, unknown>)[key];
    }
  }
  return cleaned;
}

export default defineEventHandler(async (event) => {
  const ip =
    (event.node?.req?.headers?.["x-forwarded-for"] as string) ||
    (event.node?.req?.socket?.remoteAddress as string) ||
    "127.0.0.1";
  checkClientErrorRateLimit(ip);

  const body =
    (event.context?.body as Record<string, unknown>) ||
    ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
    (await readBody(event).catch(() => ({})));

  const code =
    typeof body?.code === "string" ? body.code.slice(0, 80) : "CLIENT_ERROR";
  const message =
    typeof body?.message === "string"
      ? body.message.slice(0, 500)
      : "Unknown client error";
  const fingerprint =
    typeof body?.fingerprint === "string"
      ? body.fingerprint.slice(0, 120)
      : `${code}_${message.slice(0, 40)}`;

  // Sampling check (BR-ELV-04)
  if (!shouldSampleError(code)) {
    return { status: "sampled_out" };
  }

  // Strip PII (BR-ELV-03)
  const sanitizedCtx = sanitizeContext(body?.context);

  const db = getOwnerDb();
  await db.insert(errorLogs).values({
    source: "client",
    level: "error",
    code,
    message,
    fingerprint,
    context: sanitizedCtx,
  });

  return { status: "accepted", fingerprint };
});
