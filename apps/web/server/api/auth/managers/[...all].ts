// route-validation: exempt — Better Auth internal endpoint schema validation
import { defineEventHandler, toWebRequest } from "h3";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { getManagerAuth } from "#server/utils/better-auth";

export default defineEventHandler((event) => {
  const verifiedIp = getVerifiedRemoteIp(event);
  const req = toWebRequest(event);
  req.headers.delete("x-forwarded-for");
  req.headers.delete("cf-connecting-ip");
  if (verifiedIp && verifiedIp !== "unknown") {
    req.headers.set("x-real-ip", verifiedIp);
  } else {
    req.headers.delete("x-real-ip");
  }
  return getManagerAuth().handler(req);
});
