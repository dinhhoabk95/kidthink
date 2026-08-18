import { runExpirePaymentOrders } from "@mindkid/db";

export async function runOrderExpireJob(jobId: string): Promise<void> {
  const result = await runExpirePaymentOrders();
  console.info(
    `[order:expire] Job ${jobId} expired ${result.expiredCount} pending orders.`
  );
}
