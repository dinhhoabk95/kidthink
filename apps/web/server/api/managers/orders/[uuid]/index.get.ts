import {
  childProfiles,
  getDb,
  managers,
  paymentOrders,
  users,
} from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { PACKAGE_CATALOG } from "@mindkid/shared";
import { and, count, eq, ne } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

type DbClient = ReturnType<typeof getDb>;

function resolveOrderCode(transferNote: string | null, uuid: string): string {
  if (transferNote && transferNote.trim().length > 0) {
    return transferNote.trim();
  }
  return uuid.slice(0, 8).toUpperCase();
}

async function fetchPriorOrdersForUser(
  db: DbClient,
  userId: number,
  currentOrderId: number
) {
  const rows = await db
    .select({
      uuid: paymentOrders.uuid,
      transfer_note: paymentOrders.transferNote,
      package_code: paymentOrders.packageCode,
      offer_code: paymentOrders.offerCode,
      amount_vnd: paymentOrders.amountVnd,
      status: paymentOrders.status,
      submitted_at: paymentOrders.submittedAt,
      created_at: paymentOrders.createdAt,
    })
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.userId, userId),
        ne(paymentOrders.id, currentOrderId)
      )
    );

  return rows.map((row) => ({
    uuid: row.uuid,
    order_code: resolveOrderCode(row.transfer_note, row.uuid),
    package_code: row.package_code,
    offer_code: row.offer_code,
    amount_vnd: row.amount_vnd,
    status: row.status,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
  }));
}

async function fetchDuplicateBankRefOrders(
  db: DbClient,
  bankTxnRef: string | null,
  currentOrderId: number
) {
  if (!bankTxnRef || bankTxnRef.trim().length === 0) {
    return [];
  }

  const duplicates = await db
    .select({
      uuid: paymentOrders.uuid,
      transferNote: paymentOrders.transferNote,
      status: paymentOrders.status,
      submittedAt: paymentOrders.submittedAt,
      userEmail: users.email,
    })
    .from(paymentOrders)
    .innerJoin(users, eq(paymentOrders.userId, users.id))
    .where(
      and(
        eq(paymentOrders.bankTxnRef, bankTxnRef),
        ne(paymentOrders.id, currentOrderId)
      )
    );

  return duplicates.map((dup) => ({
    uuid: dup.uuid,
    order_code: resolveOrderCode(dup.transferNote, dup.uuid),
    status: dup.status,
    submitted_at: dup.submittedAt,
    user_email: dup.userEmail,
  }));
}

async function fetchReviewedByManager(
  db: DbClient,
  managerId: number | null
): Promise<{ uuid: string; email: string; display_name: string } | null> {
  if (!managerId) {
    return null;
  }
  const [mgr] = await db
    .select({
      uuid: managers.uuid,
      email: managers.email,
      display_name: managers.displayName,
    })
    .from(managers)
    .where(eq(managers.id, managerId))
    .limit(1);

  return mgr ?? null;
}

interface OrderWithUserRow {
  order: typeof paymentOrders.$inferSelect;
  userUuid: string;
  userEmail: string;
  userDisplayName: string;
  userStatus: string;
  userCreatedAt: Date;
}

function buildOrderDetailPayload(
  row: OrderWithUserRow,
  childProfilesCount: number,
  priorOrders: Awaited<ReturnType<typeof fetchPriorOrdersForUser>>,
  duplicateOrders: Awaited<ReturnType<typeof fetchDuplicateBankRefOrders>>,
  reviewedBy: Awaited<ReturnType<typeof fetchReviewedByManager>>
) {
  const { order } = row;
  const pkg = PACKAGE_CATALOG[order.packageCode];
  const offer = pkg?.offers.find((item) => item.offer_code === order.offerCode);
  const hasProof = Boolean(order.proofPath);
  const orderCode = resolveOrderCode(order.transferNote, order.uuid);
  const userHasPriorRejection = priorOrders.some(
    (o) => o.status === "rejected"
  );

  return {
    order: {
      uuid: order.uuid,
      order_code: orderCode,
      package_code: order.packageCode,
      package_name_vi: pkg?.name ?? order.packageCode,
      offer_code: order.offerCode,
      duration_days: offer?.duration_days ?? 365,
      amount_vnd: order.amountVnd,
      currency: order.currency,
      status: order.status,
      transfer_note: order.transferNote ?? orderCode,
      bank_txn_ref: order.bankTxnRef,
      has_proof: hasProof,
      has_proof_image: hasProof,
      transferred_at: order.submittedAt,
      submitted_at: order.submittedAt,
      reviewed_at: order.reviewedAt,
      reviewed_by_manager_id: order.reviewedByManagerId,
      reviewed_by: reviewedBy,
      rejection_reason: order.status === "rejected" ? order.adminNote : null,
      admin_note: order.adminNote,
      expires_at: order.expiresAt,
      created_at: order.createdAt,
    },
    user: {
      id: order.userId,
      uuid: row.userUuid,
      email: row.userEmail,
      display_name: row.userDisplayName,
      status: row.userStatus,
      created_at: row.userCreatedAt,
      child_profiles_count: childProfilesCount,
      prior_orders: priorOrders,
    },
    flags: {
      duplicate_bank_txn_ref: duplicateOrders.length > 0,
      user_has_prior_rejected_order: userHasPriorRejection,
    },
    duplicate_orders: duplicateOrders,
    prior_orders: priorOrders,
  };
}

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  const db = getDb();
  const [row] = await db
    .select({
      order: paymentOrders,
      userUuid: users.uuid,
      userEmail: users.email,
      userDisplayName: users.displayName,
      userStatus: users.status,
      userCreatedAt: users.createdAt,
    })
    .from(paymentOrders)
    .innerJoin(users, eq(paymentOrders.userId, users.id))
    .where(eq(paymentOrders.uuid, orderUuid))
    .limit(1);

  if (!row) {
    throw new NotFoundError();
  }

  const { order } = row;
  const [childCountRes, priorOrders, duplicateOrders, reviewedBy] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(childProfiles)
        .where(eq(childProfiles.userId, order.userId)),
      fetchPriorOrdersForUser(db, order.userId, order.id),
      fetchDuplicateBankRefOrders(db, order.bankTxnRef, order.id),
      fetchReviewedByManager(db, order.reviewedByManagerId),
    ]);

  return buildOrderDetailPayload(
    row,
    Number(childCountRes[0]?.count || 0),
    priorOrders,
    duplicateOrders,
    reviewedBy
  );
});
