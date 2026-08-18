import { runExpireSoftUnlockEntitlements } from "@mindkid/db";

export async function runSoftUnlockExpireJob(jobId: string): Promise<void> {
  const result = await runExpireSoftUnlockEntitlements();
  console.info(
    `[entitlement:soft-unlock-expire] Job ${jobId} expired ${result.expiredCount} soft_unlock entitlements.`
  );
}
