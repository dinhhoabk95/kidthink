import { AUTOMATED_PAYMENT_PROVIDERS } from "@mindkid/shared";
import { getHeader } from "h3";
import { z } from "zod";
import { runAutomatedPaymentReconciliation } from "#server/services/automated-payment";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const reconciliationRecordSchema = z.object({
  provider_event_id: z.string().min(1),
  order_uuid: z.string().uuid(),
  amount_vnd: z.number().int().positive(),
  status: z.string().min(1),
  timestamp: z.coerce.date().optional(),
});

const runReconciliationSchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS),
  records: z.array(reconciliationRecordSchema).max(200),
  reason: z
    .string()
    .min(3)
    .max(500)
    .default("Đối soát giao dịch thanh toán tự động (BR-APM-06)"),
});

export default defineApiRoute({
  auth: "super_admin",
  body: runReconciliationSchema,
  handler: async ({ event, auth, body }) =>
    await runAutomatedPaymentReconciliation({
      managerId: auth.manager_id,
      provider: body.provider,
      records: body.records.map((r) => ({
        providerEventId: r.provider_event_id,
        orderUuid: r.order_uuid,
        amountVnd: r.amount_vnd,
        status: r.status,
        timestamp: r.timestamp ?? new Date(),
      })),
      reason:
        body.reason ?? "Đối soát giao dịch thanh toán tự động (BR-APM-06)",
      ipAddress: getVerifiedRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    }),
});
