import { and, eq, inArray, isNotNull, lt, type SQL } from "drizzle-orm";
import {
  PAYMENT_ORDER_STATUS,
  type PaymentOrderStatus,
} from "#src/constants/billing-ops-enums";
import {
  type CreatePaymentOrderInput,
  OrdersReadRepository,
  type PaymentOrderEntity,
  type SubmitOrderProofInput,
} from "#src/repositories/billing-read-repository";
import {
  andConditions,
  clampLimit,
  firstOrNull,
  requireFirst,
  toNullableDate,
} from "#src/repositories/utils";
import { paymentOrders } from "#src/schema/index";

export interface UpdateOrderProofPatch {
  readonly proofPath?: string | null;
  readonly bankTxnRef: string;
  readonly status?: PaymentOrderStatus;
  readonly submittedAt?: Date;
  readonly updatedAt?: Date;
}

const REVIEWABLE_ORDER_STATUSES: readonly PaymentOrderStatus[] = [
  PAYMENT_ORDER_STATUS.SUBMITTED,
  PAYMENT_ORDER_STATUS.UNDER_REVIEW,
];

const PROOF_SUBMISSION_ORDER_STATUSES: readonly PaymentOrderStatus[] = [
  PAYMENT_ORDER_STATUS.PENDING,
  PAYMENT_ORDER_STATUS.PENDING_PROOF,
];

export class OrdersRepository extends OrdersReadRepository {
  private async updateOrderWhere(
    condition: SQL | undefined,
    values: Partial<typeof paymentOrders.$inferInsert>
  ): Promise<PaymentOrderEntity | null> {
    return await firstOrNull(
      this.db.update(paymentOrders).set(values).where(condition).returning()
    );
  }

  private async reviewOrder(
    orderUuid: string,
    status:
      | typeof PAYMENT_ORDER_STATUS.APPROVED
      | typeof PAYMENT_ORDER_STATUS.REJECTED,
    managerId: number | null,
    adminNote: string | null,
    reviewedAt?: Date
  ): Promise<PaymentOrderEntity | null> {
    const ts = reviewedAt ?? new Date();
    return await this.updateOrderWhere(
      and(
        eq(paymentOrders.uuid, orderUuid),
        inArray(paymentOrders.status, [...REVIEWABLE_ORDER_STATUSES])
      ),
      {
        status,
        reviewedByManagerId: managerId,
        reviewedAt: ts,
        adminNote,
        updatedAt: ts,
      }
    );
  }

  async createOrder(
    input: CreatePaymentOrderInput
  ): Promise<PaymentOrderEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(paymentOrders)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          userId: input.userId,
          packageCode: input.packageCode,
          offerCode: input.offerCode,
          amountVnd: input.amountVnd,
          currency: input.currency ?? "VND",
          status: input.status ?? PAYMENT_ORDER_STATUS.PENDING,
          transferNote: input.transferNote ?? null,
          expiresAt: toNullableDate(input.expiresAt),
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to insert payment order"
    );
  }

  async submitProof(
    orderUuid: string,
    userId: number,
    input: SubmitOrderProofInput
  ): Promise<PaymentOrderEntity | null> {
    const submittedAt = input.submittedAt ?? new Date();
    return await this.updateOrderWhere(
      and(eq(paymentOrders.uuid, orderUuid), eq(paymentOrders.userId, userId)),
      {
        proofPath: input.proofPath,
        ...(input.bankTxnRef === undefined
          ? {}
          : { bankTxnRef: input.bankTxnRef }),
        status: PAYMENT_ORDER_STATUS.SUBMITTED,
        submittedAt,
        updatedAt: submittedAt,
      }
    );
  }

  async updateProof(
    orderId: number,
    userId: number,
    patch: UpdateOrderProofPatch
  ): Promise<PaymentOrderEntity | null>;
  async updateProof(
    orderId: number,
    patch: UpdateOrderProofPatch
  ): Promise<PaymentOrderEntity | null>;
  async updateProof(
    orderId: number,
    userIdOrPatch: number | UpdateOrderProofPatch,
    maybePatch?: UpdateOrderProofPatch
  ): Promise<PaymentOrderEntity | null> {
    const userId =
      typeof userIdOrPatch === "number" ? userIdOrPatch : undefined;
    const patch =
      typeof userIdOrPatch === "number"
        ? (maybePatch as UpdateOrderProofPatch)
        : userIdOrPatch;

    return await this.updateOrderWhere(
      andConditions([
        eq(paymentOrders.id, orderId),
        userId === undefined ? null : eq(paymentOrders.userId, userId),
        inArray(paymentOrders.status, [...PROOF_SUBMISSION_ORDER_STATUSES]),
      ]),
      {
        bankTxnRef: patch.bankTxnRef,
        ...(patch.proofPath === undefined
          ? {}
          : { proofPath: patch.proofPath }),
        ...(patch.status === undefined ? {} : { status: patch.status }),
        ...(patch.submittedAt === undefined
          ? {}
          : { submittedAt: patch.submittedAt }),
        updatedAt: patch.updatedAt ?? new Date(),
      }
    );
  }

  async claimForReview(
    orderUuid: string,
    managerId: number,
    now: Date = new Date()
  ): Promise<PaymentOrderEntity | null> {
    return await this.updateOrderWhere(
      and(
        eq(paymentOrders.uuid, orderUuid),
        eq(paymentOrders.status, PAYMENT_ORDER_STATUS.SUBMITTED)
      ),
      {
        status: PAYMENT_ORDER_STATUS.UNDER_REVIEW,
        reviewedByManagerId: managerId,
        updatedAt: now,
      }
    );
  }

  async cancelByUser(
    orderUuid: string,
    userId: number,
    now: Date = new Date()
  ): Promise<PaymentOrderEntity | null> {
    return await this.updateOrderWhere(
      and(eq(paymentOrders.uuid, orderUuid), eq(paymentOrders.userId, userId)),
      { status: PAYMENT_ORDER_STATUS.CANCELLED, updatedAt: now }
    );
  }

  async approveOrder(
    orderUuid: string,
    managerId: number | null,
    adminNote?: string | null,
    reviewedAt?: Date
  ): Promise<PaymentOrderEntity | null> {
    return await this.reviewOrder(
      orderUuid,
      PAYMENT_ORDER_STATUS.APPROVED,
      managerId,
      adminNote ?? null,
      reviewedAt
    );
  }

  async rejectOrder(
    orderUuid: string,
    managerId: number,
    adminNote: string,
    reviewedAt?: Date
  ): Promise<PaymentOrderEntity | null> {
    return await this.reviewOrder(
      orderUuid,
      PAYMENT_ORDER_STATUS.REJECTED,
      managerId,
      adminNote,
      reviewedAt
    );
  }

  async updateOrderStatus(
    orderId: number,
    status: PaymentOrderStatus,
    patch: {
      readonly adminNote?: string | null;
      readonly reviewedAt?: Date | null;
      readonly reviewedByManagerId?: number | null;
      readonly updatedAt?: Date;
      readonly allowedCurrentStatuses?: readonly PaymentOrderStatus[];
    } = {}
  ): Promise<PaymentOrderEntity | null> {
    const allowed = patch.allowedCurrentStatuses;
    return await this.updateOrderWhere(
      andConditions([
        eq(paymentOrders.id, orderId),
        allowed && allowed.length > 0
          ? inArray(paymentOrders.status, [...allowed])
          : null,
      ]),
      {
        status,
        ...(patch.adminNote === undefined
          ? {}
          : { adminNote: patch.adminNote }),
        ...(patch.reviewedAt === undefined
          ? {}
          : { reviewedAt: patch.reviewedAt }),
        ...(patch.reviewedByManagerId === undefined
          ? {}
          : { reviewedByManagerId: patch.reviewedByManagerId }),
        updatedAt: patch.updatedAt ?? new Date(),
      }
    );
  }

  async expireStaleOrders(
    now: Date = new Date(),
    limit = 500
  ): Promise<string[]> {
    const capped = clampLimit(limit, 500, 1000);
    const candidates = await this.db
      .select({ id: paymentOrders.id })
      .from(paymentOrders)
      .where(
        and(
          inArray(paymentOrders.status, [
            PAYMENT_ORDER_STATUS.DRAFT,
            PAYMENT_ORDER_STATUS.PENDING,
            PAYMENT_ORDER_STATUS.PENDING_PROOF,
          ]),
          isNotNull(paymentOrders.expiresAt),
          lt(paymentOrders.expiresAt, now)
        )
      )
      .limit(capped);

    if (candidates.length === 0) {
      return [];
    }
    const ids = candidates.map((row) => row.id);
    const updated = await this.db
      .update(paymentOrders)
      .set({ status: PAYMENT_ORDER_STATUS.EXPIRED, updatedAt: now })
      .where(inArray(paymentOrders.id, ids))
      .returning({ uuid: paymentOrders.uuid });
    return updated.map((row) => row.uuid);
  }
}
