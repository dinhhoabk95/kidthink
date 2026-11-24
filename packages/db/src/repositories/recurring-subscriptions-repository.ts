import { eq } from "drizzle-orm";
import { RECURRING_SUBSCRIPTION_STATUS } from "#src/constants/billing-ops-enums";
import type { JsonRecord } from "#src/constants/json";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  PUBLIC_USER_COLUMNS,
  type PublicUser,
} from "#src/repositories/sensitive";
import {
  clampLimit,
  firstOrNull,
  requireFirst,
  uniq,
} from "#src/repositories/utils";
import { paymentTransactions, recurringSubscriptions } from "#src/schema/index";

export type RecurringSubscriptionEntity =
  typeof recurringSubscriptions.$inferSelect;
export type PaymentTransactionEntity = typeof paymentTransactions.$inferSelect;

export type RecurringSubscriptionWithUserEntity =
  RecurringSubscriptionEntity & {
    readonly user: PublicUser;
  };

export interface CreateRecurringSubscriptionInput {
  readonly userId: number;
  readonly packageCode: string;
  readonly offerCode: string;
  readonly billingPeriod: string;
  readonly priceVnd: number;
  readonly autoRenew?: boolean;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly nextBillingAt: Date | null;
  readonly consentTermsVersion: string;
  readonly consentSnapshot?: JsonRecord | null;
  readonly now?: Date;
}

export type UpdateRecurringSubscriptionInput = Partial<
  Omit<
    typeof recurringSubscriptions.$inferInsert,
    | "id"
    | "userId"
    | "packageCode"
    | "offerCode"
    | "billingPeriod"
    | "createdAt"
  >
>;

export interface CreatePaymentTransactionInput {
  readonly provider: string;
  readonly providerEventId: string;
  readonly orderId?: number | null;
  readonly orderUuid: string;
  readonly amountVnd: number;
  readonly status: string;
  readonly rawPayload?: JsonRecord | null;
  readonly reconciledAt?: Date | null;
  readonly createdAt?: Date;
}

export class RecurringSubscriptionsRepository extends BaseRepository {
  async createSubscription(
    input: CreateRecurringSubscriptionInput
  ): Promise<RecurringSubscriptionEntity> {
    const now = input.now ?? new Date();
    return await requireFirst(
      this.db
        .insert(recurringSubscriptions)
        .values({
          userId: input.userId,
          packageCode: input.packageCode,
          offerCode: input.offerCode,
          billingPeriod: input.billingPeriod,
          priceVnd: input.priceVnd,
          autoRenew: input.autoRenew ?? true,
          status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
          nextBillingAt: input.nextBillingAt,
          consentTermsVersion: input.consentTermsVersion,
          consentSnapshot: input.consentSnapshot ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to create recurring subscription"
    );
  }

  async findById(id: number): Promise<RecurringSubscriptionEntity | null> {
    return (
      (await this.db.query.recurringSubscriptions.findFirst({
        where: { id },
      })) ?? null
    );
  }

  async findByIdForUser(
    id: number,
    userId: number
  ): Promise<RecurringSubscriptionEntity | null> {
    return (
      (await this.db.query.recurringSubscriptions.findFirst({
        where: { id, userId },
      })) ?? null
    );
  }

  async listByUser(userId: number): Promise<RecurringSubscriptionEntity[]> {
    return await this.db.query.recurringSubscriptions.findMany({
      where: { userId },
      orderBy: { createdAt: "desc", id: "desc" },
    });
  }

  async updateSubscriptionById(
    id: number,
    patch: UpdateRecurringSubscriptionInput
  ): Promise<RecurringSubscriptionEntity | null> {
    return await firstOrNull(
      this.db
        .update(recurringSubscriptions)
        .set({ ...patch, updatedAt: patch.updatedAt ?? new Date() })
        .where(eq(recurringSubscriptions.id, id))
        .returning()
    );
  }

  async listActiveForRenewalReminder(
    now: Date,
    windowEnd: Date
  ): Promise<RecurringSubscriptionWithUserEntity[]> {
    return await this.db.query.recurringSubscriptions.findMany({
      where: {
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        autoRenew: true,
        nextBillingAt: { isNotNull: true, gt: now, lte: windowEnd },
      },
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
    });
  }

  async listDueForRenewal(now: Date): Promise<RecurringSubscriptionEntity[]> {
    return await this.db.query.recurringSubscriptions.findMany({
      where: {
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        autoRenew: true,
        nextBillingAt: { isNotNull: true, lte: now },
      },
    });
  }

  async listDueForDunning(
    now: Date,
    limit = 200
  ): Promise<RecurringSubscriptionEntity[]> {
    return await this.db.query.recurringSubscriptions.findMany({
      where: {
        status: RECURRING_SUBSCRIPTION_STATUS.PAST_DUE,
        nextBillingAt: { isNotNull: true, lte: now },
      },
      limit: clampLimit(limit, 200, 500),
    });
  }

  async findTransactionByProviderEvent(
    provider: string,
    providerEventId: string
  ): Promise<PaymentTransactionEntity | null> {
    return (
      (await this.db.query.paymentTransactions.findFirst({
        where: { provider, providerEventId },
      })) ?? null
    );
  }

  async listTransactionsByProviderEvents(
    provider: string,
    eventIds: readonly string[]
  ): Promise<PaymentTransactionEntity[]> {
    const uniqueEvents = uniq(eventIds);
    if (uniqueEvents.length === 0) {
      return [];
    }
    return await this.db.query.paymentTransactions.findMany({
      where: {
        provider,
        providerEventId: { in: uniqueEvents },
      },
    });
  }

  async listTransactionsByProvider(
    provider: string,
    limit = 100
  ): Promise<PaymentTransactionEntity[]> {
    return await this.db.query.paymentTransactions.findMany({
      where: { provider },
      orderBy: { createdAt: "desc", id: "desc" },
      limit: clampLimit(limit, 100, 200),
    });
  }

  async insertTransaction(
    input: CreatePaymentTransactionInput
  ): Promise<PaymentTransactionEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(paymentTransactions)
        .values({
          provider: input.provider,
          providerEventId: input.providerEventId,
          orderId: input.orderId ?? null,
          orderUuid: input.orderUuid,
          amountVnd: input.amountVnd,
          status: input.status,
          rawPayload: input.rawPayload ?? null,
          reconciledAt: input.reconciledAt ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to insert payment transaction"
    );
  }
}
