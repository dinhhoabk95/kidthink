import { NotFoundError } from "@mindkid/errors/common";
import {
  defineEventHandler,
  getHeader,
  setHeader,
  setResponseStatus,
} from "h3";
import {
  type CloudflareHealthEnv,
  runSystemHealthCheck,
} from "#server/services/health-service";
import { constantTimeEqual } from "#server/utils/constant-time";

/** BR-HLT-07: kiểm sâu chỉ cho người cầm `HEALTHCHECK_TOKEN`; sai/thiếu thì 404 như route không tồn tại. */
function assertHealthToken(provided: string | undefined): void {
  const expected = process.env.HEALTHCHECK_TOKEN?.trim();
  if (!(expected && provided && constantTimeEqual(provided, expected))) {
    throw new NotFoundError();
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  assertHealthToken(getHeader(event, "x-health-token"));

  const cfEnv = (
    event.context as { cloudflare?: { env?: CloudflareHealthEnv } } | undefined
  )?.cloudflare?.env;

  const result = await runSystemHealthCheck(cfEnv);
  if (!result.ok) {
    setResponseStatus(event, 503);
  }
  return result.body;
});
