import { runExpireEntitlements } from "@mindkid/db";

export async function runEntitlementExpireJob(
  jobId: string,
  data?: { dateIct?: string }
): Promise<void> {
  const result = await runExpireEntitlements(data?.dateIct);
  console.info(
    `[entitlement:expire] Job ${jobId} expired ${result.expiredCount} entitlements.`
  );
}
