import { getDb, recurringSubscriptions } from "@mindkid/db";
import { SubscriptionNotFoundError } from "@mindkid/errors/billing";
import { desc, eq } from "drizzle-orm";
import { defineApiRoute } from "#server/utils/define-api-route";

export default defineApiRoute({
  auth: "user",
  handler: async ({ auth: session }) => {
    const db = getDb();

    const [sub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.userId, session.user_id))
      .orderBy(desc(recurringSubscriptions.id))
      .limit(1);

    if (!sub) {
      throw new SubscriptionNotFoundError();
    }

    const nextBillingIso = sub.nextBillingAt
      ? sub.nextBillingAt.toISOString()
      : null;

    return {
      subscription_id: String(sub.id),
      package_code: sub.packageCode,
      offer_code: sub.offerCode,
      billing_period: sub.billingPeriod,
      auto_renew: sub.autoRenew,
      status: sub.status,
      current_period_start: sub.currentPeriodStart.toISOString(),
      current_period_end: sub.currentPeriodEnd.toISOString(),
      next_billing_date: nextBillingIso,
      next_billing_at: nextBillingIso,
      price_vnd: sub.priceVnd,
      dunning_attempts: sub.dunningAttempts,
      consent_terms_version: sub.consentTermsVersion,
    };
  },
});
