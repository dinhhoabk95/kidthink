import { checkRateLimit } from "@mindkid/cache";
import { RateLimitedError } from "@mindkid/errors/common";
import { z } from "zod";
import {
  type ClientErrorContextValue,
  ingestClientError,
} from "#server/services/error-log-service";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const CLIENT_ERROR_LIMIT = 10;
const CLIENT_ERROR_WINDOW_SECONDS = 60;

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

const jsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const clientErrorContextValueSchema: z.ZodType<ClientErrorContextValue> =
  z.union([
    jsonPrimitiveSchema,
    z.array(jsonPrimitiveSchema),
    z.record(z.string(), jsonPrimitiveSchema),
  ]);

const clientErrorSchema = z.object({
  code: z.string().max(80).optional(),
  message: z.string().max(500).optional(),
  fingerprint: z.string().max(120).optional(),
  context: z.record(z.string(), clientErrorContextValueSchema).optional(),
});

export default defineApiRoute({
  auth: "guest",
  body: clientErrorSchema,
  async handler({ event, body }) {
    await checkClientErrorRateLimit(getVerifiedRemoteIp(event));
    return await ingestClientError(body);
  },
});
