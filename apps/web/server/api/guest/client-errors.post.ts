import { checkRateLimit } from "@mindkid/cache";
import { errorLogs, getOwnerDb } from "@mindkid/db";
import { RateLimitedError } from "@mindkid/errors/common";
import { defineEventHandler, readBody } from "h3";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

// Rate limiting: 10 req / min / IP (BR-ELV-05)
const CLIENT_ERROR_LIMIT = 10;
const CLIENT_ERROR_WINDOW_SECONDS = 60;

/**
 * BR-RTL-08 — mọi lượt consume đi qua `rate-limiter-flexible` trong
 * `packages/cache`. Bản trước đếm bằng một `Map` trong tiến trình: hạn mức reset
 * mỗi lần deploy và không dùng chung giữa các tiến trình PM2.
 */
async function checkClientErrorRateLimit(ip: string): Promise<void> {
  const result = await checkRateLimit(
    `rl:ip:client-errors:${ip}`,
    CLIENT_ERROR_LIMIT,
    CLIENT_ERROR_WINDOW_SECONDS
  );
  if (!result.allowed) {
    throw new RateLimitedError(
      "Quá giới hạn gửi báo cáo lỗi client (tối đa 10 lần/phút)",
      { retry_after_s: CLIENT_ERROR_WINDOW_SECONDS }
    );
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

import { z } from "zod";

const clientErrorSchema = z
  .object({
    code: z.string().max(80).optional(),
    message: z.string().max(500).optional(),
    fingerprint: z.string().max(120).optional(),
    context: z.record(z.unknown()).optional(),
  })
  .optional();

export default defineEventHandler(async (event) => {
  // BR-RTL-04 — bản trước lấy `X-Forwarded-For` thô, tức kẻ gọi tự chọn khoá
  // giới hạn và đổi header mỗi request là đi vòng qua hạn mức.
  await checkClientErrorRateLimit(getVerifiedRemoteIp(event));

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsed = clientErrorSchema.parse(raw);
  const body = parsed || {};

  const code = body.code ? body.code.slice(0, 80) : "CLIENT_ERROR";
  const message = body.message
    ? body.message.slice(0, 500)
    : "Unknown client error";
  const fingerprint = body.fingerprint
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
