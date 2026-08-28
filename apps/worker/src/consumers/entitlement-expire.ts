import { runExpireEntitlements } from "@mindkid/db";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export const entitlementExpire: Consumer<"entitlement:expire"> = async (
  payload,
  ctx
) => {
  const result = await runExpireEntitlements(payload.dateIct);
  logJobDone("entitlement:expire", ctx, { expired: result.expiredCount });
};
