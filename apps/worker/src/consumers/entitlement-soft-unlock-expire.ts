import { logJobDone } from "#src/log";
import { runExpireSoftUnlockEntitlements } from "../services/payment-jobs.js";
import type { Consumer } from "./types.js";

export const entitlementSoftUnlockExpire: Consumer<
  "entitlement:soft-unlock-expire"
> = async (_payload, ctx) => {
  const result = await runExpireSoftUnlockEntitlements();
  logJobDone("entitlement:soft-unlock-expire", ctx, {
    expired: result.expiredCount,
  });
};
