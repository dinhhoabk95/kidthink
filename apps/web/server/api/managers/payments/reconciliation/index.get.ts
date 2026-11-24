import { AUTOMATED_PAYMENT_PROVIDERS } from "@mindkid/shared";
import { z } from "zod";
import { getAutomatedPaymentReconciliation } from "#server/services/automated-payment";
import { defineApiRoute } from "#server/utils/define-api-route";

const reconciliationQuerySchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS).default("payos"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export default defineApiRoute({
  auth: "super_admin",
  query: reconciliationQuerySchema,
  handler: async ({ query }) =>
    await getAutomatedPaymentReconciliation(
      query.provider ?? "payos",
      query.limit ?? 50
    ),
});
