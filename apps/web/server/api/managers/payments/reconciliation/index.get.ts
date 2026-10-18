import { getOwnerDb, paymentOrders, paymentTransactions } from "@mindkid/db";
import { AUTOMATED_PAYMENT_PROVIDERS } from "@mindkid/shared";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { reconcileAutomatedPayments } from "#server/services/automated-payment";
import { defineApiRoute } from "#server/utils/define-api-route";

const reconciliationQuerySchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS).default("payos"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export default defineApiRoute({
  auth: "super_admin",
  query: reconciliationQuerySchema,
  handler: async ({ query }) => {
    const db = getOwnerDb();
    const provider = query.provider ?? "payos";
    const limit = query.limit ?? 50;

    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.provider, provider))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit);

    const orderUuids = transactions.map((t) => t.orderUuid);
    const orders =
      orderUuids.length > 0
        ? await db
            .select()
            .from(paymentOrders)
            .where(inArray(paymentOrders.uuid, orderUuids))
        : [];

    const orderAmountByUuid = new Map<string, number>();
    for (const o of orders) {
      orderAmountByUuid.set(o.uuid, o.amountVnd);
    }

    const report = await reconcileAutomatedPayments({
      provider,
      records: transactions.map((t) => ({
        providerEventId: t.providerEventId,
        orderUuid: t.orderUuid,
        amountVnd: orderAmountByUuid.get(t.orderUuid) ?? t.amountVnd,
        status: t.status,
        timestamp: t.createdAt,
      })),
    });

    return {
      provider,
      items: transactions.map((t) => ({
        id: t.id,
        provider: t.provider,
        provider_event_id: t.providerEventId,
        order_uuid: t.orderUuid,
        amount_vnd: t.amountVnd,
        status: t.status,
        reconciled_at: t.reconciledAt,
        created_at: t.createdAt,
      })),
      summary: {
        total_checked: report.totalChecked,
        matched_count: report.matchedCount,
        mismatched_count: report.mismatchedCount,
      },
      mismatches: report.mismatches,
    };
  },
});
