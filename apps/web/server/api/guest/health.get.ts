import { defineEventHandler, setHeader, setResponseStatus } from "h3";
import {
  type CloudflareHealthEnv,
  runSystemHealthCheck,
} from "#server/services/health-service";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");

  const cfEnv = (
    event.context as { cloudflare?: { env?: CloudflareHealthEnv } } | undefined
  )?.cloudflare?.env;

  const result = await runSystemHealthCheck(cfEnv);
  if (!result.ok) {
    setResponseStatus(event, 503);
  }
  return result.body;
});
