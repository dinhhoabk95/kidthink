import {
  auditLogs,
  consentLogs,
  getOwnerDb,
  packages,
  users,
} from "@mindkid/db";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import {
  PackageNotFoundError,
  PackageNotSellableError,
} from "@mindkid/errors/billing";
import { InternalError } from "@mindkid/errors/common";
import {
  type Offer,
  PACKAGE_CATALOG,
  type PackageDefinition,
} from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { getRequestHeader, type H3Event } from "h3";
import { z } from "zod";
import { createRecurringSubscription } from "#server/services/recurring-billing";
import { assertUnrestrictedUser } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const optInRecurringSchema = z
  .object({
    package_code: z.string().min(1),
    billing_period: z.enum(["monthly", "annual"]),
    offer_code: z.string().min(1).optional(),
    consent_accepted: z.literal(true).optional(),
    consent: z.literal(true).optional(),
    terms_version: z.string().min(1).optional(),
  })
  .refine((data) => data.consent_accepted === true || data.consent === true, {
    message: "Vui lòng xác nhận đồng ý điều khoản gia hạn tự động.",
    path: ["consent_accepted"],
  });

function resolveSellableRecurringOffer(
  packageCode: string,
  billingPeriod: "monthly" | "annual",
  offerCode?: string
): { pkg: PackageDefinition; matchedOffer: Offer; resolvedOfferCode: string } {
  const pkg = PACKAGE_CATALOG[packageCode];
  if (!pkg) {
    throw new PackageNotFoundError();
  }

  if (!pkg.is_public || pkg.status !== "active") {
    throw new PackageNotSellableError();
  }

  if (offerCode === "lifetime") {
    throw new PackageNotSellableError(
      "Gói trọn đời không hỗ trợ thanh toán định kỳ."
    );
  }

  const matchedOffer =
    pkg.offers.find((o) => o.offer_code === (offerCode ?? billingPeriod)) ??
    pkg.offers.find((o) => o.duration_days !== null);

  if (!matchedOffer || matchedOffer.duration_days === null) {
    throw new PackageNotSellableError(
      "Gói dịch vụ không hỗ trợ thanh toán định kỳ."
    );
  }

  return {
    pkg,
    matchedOffer,
    resolvedOfferCode: offerCode ?? matchedOffer.offer_code,
  };
}

function extractRequestClientMeta(event: H3Event): {
  ipAddress: string;
  userAgent: string;
} {
  const forwardedIp = getRequestHeader(event, "x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ipAddress =
    forwardedIp || event.node?.req?.socket?.remoteAddress || "127.0.0.1";
  const userAgent = getRequestHeader(event, "user-agent") || "unknown";
  return { ipAddress, userAgent };
}

export default defineApiRoute({
  auth: "user",
  body: optInRecurringSchema,
  handler: async ({ event, auth: session, body }) => {
    const db = getOwnerDb();

    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user_id))
      .limit(1);

    if (!userRecord) {
      throw new UnauthenticatedError();
    }

    assertUnrestrictedUser(userRecord.status);

    const { package_code, billing_period, offer_code, terms_version } = body;
    const { pkg, matchedOffer, resolvedOfferCode } =
      resolveSellableRecurringOffer(package_code, billing_period, offer_code);

    const [dbPackage] = await db
      .select({ code: packages.code })
      .from(packages)
      .where(eq(packages.code, pkg.code))
      .limit(1);

    if (!dbPackage) {
      await db
        .insert(packages)
        .values({
          code: pkg.code,
          name: pkg.name,
          description: pkg.description,
          audience: pkg.audience,
          offers: [...pkg.offers],
          isPublic: pkg.is_public,
          status: pkg.status,
        })
        .onConflictDoNothing();
    }

    const now = new Date();
    const resolvedTermsVersion = terms_version ?? "v1.0";
    const priceVnd = matchedOffer.price_vnd;
    const { ipAddress, userAgent } = extractRequestClientMeta(event);

    const consentSnapshot = {
      package_code: pkg.code,
      offer_code: resolvedOfferCode,
      billing_period,
      price_vnd: priceVnd,
      terms_version: resolvedTermsVersion,
      accepted_at: now.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    const subscription = await createRecurringSubscription(
      {
        userId: userRecord.id,
        packageCode: pkg.code,
        offerCode: resolvedOfferCode,
        billingPeriod: billing_period,
        priceVnd,
        termsVersion: resolvedTermsVersion,
        consentSnapshot,
      },
      now
    );

    if (!subscription) {
      throw new InternalError("Không thể khởi tạo gói gia hạn tự động.");
    }

    await db.insert(consentLogs).values({
      userId: userRecord.id,
      consentType: "terms",
      action: "accepted",
      ipAddress,
      userAgent,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(auditLogs).values({
      actorType: "user",
      actorId: userRecord.id,
      action: "subscription.opt_in_recurring",
      entityType: "recurring_subscription",
      entityId: String(subscription.id),
      afterData: consentSnapshot,
      ipAddress,
      userAgent,
      createdAt: now,
      updatedAt: now,
    });

    const nextBillingIso = subscription.nextBillingAt
      ? subscription.nextBillingAt.toISOString()
      : subscription.currentPeriodEnd.toISOString();

    return {
      subscription_id: String(subscription.id),
      package_code: subscription.packageCode,
      billing_period: subscription.billingPeriod,
      price_vnd: subscription.priceVnd,
      auto_renew: true,
      status: subscription.status,
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      next_billing_date: nextBillingIso,
      next_billing_at: nextBillingIso,
    };
  },
});
