import { appError } from "@kidthink/auth";
import { childProfiles, getDb, paymentOrders, users } from "@kidthink/db";
import { and, count, eq, ne } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import {
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.ts";

export default defineEventHandler(async (event) => {
  try {
    requireSuperAdminSession(event);
    const orderUuid = getRouterParam(event, "uuid");
    if (!orderUuid) {
      throw appError("VALIDATION_FAILED", "Order UUID is required");
    }

    const db = getDb();
    const [row] = await db
      .select({
        order: paymentOrders,
        userEmail: users.email,
        userDisplayName: users.displayName,
        userCreatedAt: users.createdAt,
      })
      .from(paymentOrders)
      .innerJoin(users, eq(paymentOrders.userId, users.id))
      .where(eq(paymentOrders.uuid, orderUuid))
      .limit(1);

    if (!row) {
      throw appError("NOT_FOUND");
    }

    const { order } = row;

    // Count child profiles (BR-PQU-05, D-JF: no child PII)
    const [childCountRes] = await db
      .select({ count: count() })
      .from(childProfiles)
      .where(eq(childProfiles.userId, order.userId));

    const childProfilesCount = Number(childCountRes?.count || 0);

    // Prior orders for this user
    const priorOrders = await db
      .select({
        uuid: paymentOrders.uuid,
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
          eq(paymentOrders.userId, order.userId),
          ne(paymentOrders.id, order.id)
        )
      );

    const userHasPriorRejection = priorOrders.some(
      (o) => o.status === "rejected"
    );

    // Check for duplicate bank_txn_ref across other orders (BR-PQU-04)
    let duplicateOrders: Array<{
      uuid: string;
      status: string;
      submitted_at: Date | null;
      user_email: string;
    }> = [];

    if (order.bankTxnRef && order.bankTxnRef.trim().length > 0) {
      const duplicates = await db
        .select({
          uuid: paymentOrders.uuid,
          status: paymentOrders.status,
          submittedAt: paymentOrders.submittedAt,
          userEmail: users.email,
        })
        .from(paymentOrders)
        .innerJoin(users, eq(paymentOrders.userId, users.id))
        .where(
          and(
            eq(paymentOrders.bankTxnRef, order.bankTxnRef),
            ne(paymentOrders.id, order.id)
          )
        );

      duplicateOrders = duplicates.map((d) => ({
        uuid: d.uuid,
        status: d.status,
        submitted_at: d.submittedAt,
        user_email: d.userEmail,
      }));
    }

    return {
      order: {
        uuid: order.uuid,
        package_code: order.packageCode,
        offer_code: order.offerCode,
        amount_vnd: order.amountVnd,
        currency: order.currency,
        status: order.status,
        transfer_note: order.transferNote,
        bank_txn_ref: order.bankTxnRef,
        has_proof: Boolean(order.proofPath),
        submitted_at: order.submittedAt,
        reviewed_at: order.reviewedAt,
        reviewed_by_manager_id: order.reviewedByManagerId,
        admin_note: order.adminNote,
        expires_at: order.expiresAt,
        created_at: order.createdAt,
      },
      user: {
        id: order.userId,
        email: row.userEmail,
        display_name: row.userDisplayName,
        created_at: row.userCreatedAt,
        child_profiles_count: childProfilesCount,
      },
      flags: {
        duplicate_bank_txn_ref: duplicateOrders.length > 0,
        user_has_prior_rejected_order: userHasPriorRejection,
      },
      duplicate_orders: duplicateOrders,
      prior_orders: priorOrders,
    };
  } catch (error) {
    respondToManagerAuthError(event, error);
  }
});
