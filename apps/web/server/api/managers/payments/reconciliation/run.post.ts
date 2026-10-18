import { writeAudit } from "@mindkid/audit";
import { getOwnerDb } from "@mindkid/db";
import { AUTOMATED_PAYMENT_PROVIDERS } from "@mindkid/shared";
import { getHeader } from "h3";
import { z } from "zod";
import { reconcileAutomatedPayments } from "#server/services/automated-payment";
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
  handler: async ({ event, auth, body }) => {
    const report = await reconcileAutomatedPayments({
      provider: body.provider,
      records: body.records.map((r) => ({
        providerEventId: r.provider_event_id,
        orderUuid: r.order_uuid,
        amountVnd: r.amount_vnd,
        status: r.status,
        timestamp: r.timestamp ?? new Date(),
      })),
    });

    const reason =
      body.reason ?? "Đối soát giao dịch thanh toán tự động (BR-APM-06)";
    const db = getOwnerDb();
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: auth.manager_id,
        action: "data_exported",
        reason,
        entity_type: "payment_reconciliation",
        entity_id: body.provider,
        after_data: {
          provider: body.provider,
          total_checked: report.totalChecked,
          matched_count: report.matchedCount,
          mismatched_count: report.mismatchedCount,
          mismatches: report.mismatches,
        },
        ip_address: getVerifiedRemoteIp(event),
        user_agent: getHeader(event, "user-agent") ?? "unknown",
      });
    });

    return {
      ok: true,
      provider: body.provider,
      total_checked: report.totalChecked,
      matched_count: report.matchedCount,
      mismatched_count: report.mismatchedCount,
      mismatches: report.mismatches,
    };
  },
});
