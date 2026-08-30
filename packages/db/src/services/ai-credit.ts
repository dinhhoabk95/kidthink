/**
 * Spec sở hữu: docs/specs/07-addon/ai-credit-ledger.md
 * Business rules: BR-ACL-01..09
 */

import { appError } from "@mindkid/auth";
import {
  type AiCreditReason,
  LOW_CREDIT_WARNING_THRESHOLD_PERCENT,
  type ManualGrantCreditsInput,
  MIN_MANUAL_GRANT_REASON_LENGTH,
} from "@mindkid/shared";
import { desc, eq, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { getDb } from "#src/client";
import {
  type AiCreditBalance,
  type AiCreditLedgerEntry,
  aiCreditBalance,
  aiCreditLedger,
} from "#src/schema/ai-credit";
import { users } from "#src/schema/identity";
import { notifications } from "#src/schema/ops";
import { writeAudit } from "./audit.ts";

export interface GrantCreditsParams {
  userId: number;
  delta: number;
  reason: AiCreditReason;
  refType?: string;
  refId?: string;
  feature?: string;
  grantedByManagerId?: number;
  grantReason?: string;
  idempotencyKey?: string;
  notifyUser?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx?: PgTransaction<any, any, any>;
}

export interface DebitCreditsParams {
  userId: number;
  cost: number;
  feature: string;
  refType?: string;
  refId?: string;
  idempotencyKey?: string;
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx?: PgTransaction<any, any, any>;
}

export interface RefundCreditsParams {
  userId: number;
  cost: number;
  debitRefId?: string;
  reason?: string;
  idempotencyKey?: string;
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx?: PgTransaction<any, any, any>;
}

export interface ManualGrantParams {
  managerId: number;
  userUuid: string;
  input: ManualGrantCreditsInput;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Gets credit balance info for a user (BR-ACL-01).
 */
export async function getCreditBalance(
  userId: number,
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx?: PgTransaction<any, any, any>
): Promise<AiCreditBalance> {
  const runner = tx ?? getDb();
  const [row] = await runner
    .select()
    .from(aiCreditBalance)
    .where(eq(aiCreditBalance.userId, userId))
    .limit(1);

  if (!row) {
    // Chưa có hàng ví: trả số dư rỗng, chưa ghi DB. `id: 0` là chỗ giữ chỗ cho
    // hàng chưa tồn tại — chỉ dùng để đọc, không bao giờ ghi ngược lại.
    return {
      id: 0,
      userId,
      balance: 0,
      totalGranted: 0,
      totalUsed: 0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return row;
}

async function findExistingByIdempotency(
  // biome-ignore lint/suspicious/noExplicitAny: generic transaction
  activeTx: PgTransaction<any, any, any>,
  idempotencyKey?: string
): Promise<AiCreditLedgerEntry | null> {
  if (!idempotencyKey) {
    return null;
  }
  const [existing] = await activeTx
    .select()
    .from(aiCreditLedger)
    .where(eq(aiCreditLedger.idempotencyKey, idempotencyKey))
    .limit(1);
  return existing ?? null;
}

async function checkAndSendLowBalanceWarning(
  // biome-ignore lint/suspicious/noExplicitAny: generic transaction
  activeTx: PgTransaction<any, any, any>,
  userId: number,
  prevBalance: number,
  newBalance: number,
  totalGranted: number
): Promise<void> {
  const threshold = Math.max(
    10,
    Math.floor(totalGranted * LOW_CREDIT_WARNING_THRESHOLD_PERCENT)
  );

  if (prevBalance >= threshold && newBalance < threshold) {
    await activeTx.insert(notifications).values({
      recipientType: "user",
      recipientId: userId,
      templateCode: "ai_credits_low",
      payload: {
        remaining_credits: newBalance,
        threshold,
      },
    });
  }
}

/**
 * Grants AI credits to a user (append-only ledger + cache projection) (BR-ACL-01, BR-ACL-07).
 */
async function applyCreditGrantBalance(
  // biome-ignore lint/suspicious/noExplicitAny: generic transaction
  activeTx: PgTransaction<any, any, any>,
  userId: number,
  delta: number,
  reason: string,
  now: Date
): Promise<number> {
  const [existingBal] = await activeTx
    .select()
    .from(aiCreditBalance)
    .where(eq(aiCreditBalance.userId, userId))
    .for("update");

  if (existingBal) {
    const updatedBalance = existingBal.balance + delta;
    await activeTx
      .update(aiCreditBalance)
      .set({
        balance: updatedBalance,
        totalGranted:
          existingBal.totalGranted + (reason === "refund" ? 0 : delta),
        version: existingBal.version + 1,
        updatedAt: now,
      })
      .where(eq(aiCreditBalance.userId, userId));
    return updatedBalance;
  }

  await activeTx.insert(aiCreditBalance).values({
    userId,
    balance: delta,
    totalGranted: delta,
    totalUsed: 0,
    version: 1,
    updatedAt: now,
  });
  return delta;
}

export async function grantCredits(
  params: GrantCreditsParams
): Promise<{ ledgerEntry: AiCreditLedgerEntry; balance: number }> {
  const db = getDb();
  const now = new Date();

  const executeInTransaction = async (
    // biome-ignore lint/suspicious/noExplicitAny: generic transaction
    activeTx: PgTransaction<any, any, any>
  ) => {
    const existing = await findExistingByIdempotency(
      activeTx,
      params.idempotencyKey
    );
    if (existing) {
      const bal = await getCreditBalance(params.userId, activeTx);
      return { ledgerEntry: existing, balance: bal.balance };
    }

    const [ledgerEntry] = await activeTx
      .insert(aiCreditLedger)
      .values({
        userId: params.userId,
        delta: params.delta,
        reason: params.reason,
        refType: params.refType ?? null,
        refId: params.refId ?? null,
        feature: params.feature ?? null,
        grantedByManagerId: params.grantedByManagerId ?? null,
        grantReason: params.grantReason ?? null,
        idempotencyKey: params.idempotencyKey ?? null,
      })
      .returning();

    if (!ledgerEntry) {
      throw new Error("Failed to create ledger entry");
    }

    const updatedBalance = await applyCreditGrantBalance(
      activeTx,
      params.userId,
      params.delta,
      params.reason,
      now
    );

    if (params.notifyUser) {
      await activeTx.insert(notifications).values({
        recipientType: "user",
        recipientId: params.userId,
        templateCode: "ai_credits_granted",
        payload: {
          credits: params.delta,
          reason: params.reason,
        },
      });
    }

    return { ledgerEntry, balance: updatedBalance };
  };

  if (params.tx) {
    return await executeInTransaction(params.tx);
  }
  return await db.transaction(executeInTransaction);
}

/**
 * Debits AI credits atomically before LLM invocation (BR-ACL-02, BR-ACL-03, BR-ACL-05, BR-ACL-09).
 */
export async function debitCredits(params: DebitCreditsParams): Promise<{
  success: boolean;
  newBalance: number;
  ledgerEntry: AiCreditLedgerEntry;
}> {
  const db = getDb();
  const now = new Date();

  const executeInTransaction = async (
    // biome-ignore lint/suspicious/noExplicitAny: generic transaction
    activeTx: PgTransaction<any, any, any>
  ) => {
    const existing = await findExistingByIdempotency(
      activeTx,
      params.idempotencyKey
    );
    if (existing) {
      const bal = await getCreditBalance(params.userId, activeTx);
      return {
        success: true,
        newBalance: bal.balance,
        ledgerEntry: existing,
      };
    }

    const [existingBal] = await activeTx
      .select()
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.userId, params.userId))
      .for("update");

    const currentBalance = existingBal?.balance ?? 0;
    if (currentBalance < params.cost) {
      throw appError("INSUFFICIENT_CREDITS", {
        required: params.cost,
        current: currentBalance,
        message: `Số dư AI credit không đủ. Bạn cần ${params.cost} credit nhưng hiện chỉ còn ${currentBalance} credit.`,
      });
    }

    const [ledgerEntry] = await activeTx
      .insert(aiCreditLedger)
      .values({
        userId: params.userId,
        delta: -params.cost,
        reason: "usage",
        feature: params.feature,
        refType: params.refType ?? null,
        refId: params.refId ?? null,
        idempotencyKey: params.idempotencyKey ?? null,
      })
      .returning();

    if (!ledgerEntry) {
      throw new Error("Failed to create ledger entry");
    }

    const newBalance = currentBalance - params.cost;
    const newTotalUsed = (existingBal?.totalUsed ?? 0) + params.cost;

    await activeTx
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        totalUsed: newTotalUsed,
        version: (existingBal?.version ?? 1) + 1,
        updatedAt: now,
      })
      .where(eq(aiCreditBalance.userId, params.userId));

    await checkAndSendLowBalanceWarning(
      activeTx,
      params.userId,
      currentBalance,
      newBalance,
      existingBal?.totalGranted ?? 100
    );

    return {
      success: true,
      newBalance,
      ledgerEntry,
    };
  };

  if (params.tx) {
    return await executeInTransaction(params.tx);
  }
  return await db.transaction(executeInTransaction);
}

/**
 * Refunds credits via an inverse positive transaction entry when LLM provider fails (BR-ACL-02).
 */
export async function refundCredits(params: RefundCreditsParams): Promise<{
  success: boolean;
  newBalance: number;
  ledgerEntry: AiCreditLedgerEntry;
}> {
  const db = getDb();
  const now = new Date();

  const executeInTransaction = async (
    // biome-ignore lint/suspicious/noExplicitAny: generic transaction
    activeTx: PgTransaction<any, any, any>
  ) => {
    const existing = await findExistingByIdempotency(
      activeTx,
      params.idempotencyKey
    );
    if (existing) {
      const bal = await getCreditBalance(params.userId, activeTx);
      return {
        success: true,
        newBalance: bal.balance,
        ledgerEntry: existing,
      };
    }

    const [ledgerEntry] = await activeTx
      .insert(aiCreditLedger)
      .values({
        userId: params.userId,
        delta: params.cost,
        reason: "refund",
        refType: "refund",
        refId: params.debitRefId ?? null,
        grantReason: params.reason ?? "Hoàn trả do lỗi hệ thống AI",
        idempotencyKey: params.idempotencyKey ?? null,
      })
      .returning();

    if (!ledgerEntry) {
      throw new Error("Failed to create ledger entry");
    }

    const [existingBal] = await activeTx
      .select()
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.userId, params.userId))
      .for("update");

    const currentBalance = existingBal?.balance ?? 0;
    const newBalance = currentBalance + params.cost;
    const currentTotalUsed = existingBal?.totalUsed ?? 0;

    await activeTx
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        totalUsed: Math.max(0, currentTotalUsed - params.cost),
        version: (existingBal?.version ?? 1) + 1,
        updatedAt: now,
      })
      .where(eq(aiCreditBalance.userId, params.userId));

    return {
      success: true,
      newBalance,
      ledgerEntry,
    };
  };

  if (params.tx) {
    return await executeInTransaction(params.tx);
  }
  return await db.transaction(executeInTransaction);
}

/**
 * Reconciles the cached balance against SUM(delta) of the append-only ledger (BR-ACL-01, D-P4W).
 */
export async function reconcileCreditBalance(userId: number): Promise<{
  isMatched: boolean;
  computedSum: number;
  cachedBalance: number;
  diff: number;
}> {
  const db = getDb();

  const [sumRow] = await db
    .select({
      totalDelta: sql<number>`COALESCE(SUM(${aiCreditLedger.delta}), 0)::int`,
    })
    .from(aiCreditLedger)
    .where(eq(aiCreditLedger.userId, userId));

  const computedSum = sumRow?.totalDelta ?? 0;
  const balanceRow = await getCreditBalance(userId);
  const cachedBalance = balanceRow.balance;
  const diff = computedSum - cachedBalance;
  const isMatched = diff === 0;

  if (!isMatched) {
    console.error(
      JSON.stringify({
        level: "ALERT",
        event: "alert.credit_reconcile_mismatch",
        userId,
        computedSum,
        cachedBalance,
        diff,
        message: `LỆCH SỔ CÁI AI CREDIT: user_id=${userId} có tổng delta=${computedSum} nhưng cache balance=${cachedBalance} (lệch ${diff}).`,
      })
    );
  }

  return {
    isMatched,
    computedSum,
    cachedBalance,
    diff,
  };
}

/**
 * Super Admin manual grant with mandatory audit log and min 20 char reason (BR-ACL-07).
 */
export async function manualGrantCredits(params: ManualGrantParams): Promise<{
  user_uuid: string;
  credits_granted: number;
  new_balance: number;
}> {
  const db = getDb();

  if (
    params.input.grant_reason.trim().length < MIN_MANUAL_GRANT_REASON_LENGTH
  ) {
    throw appError("VALIDATION_FAILED", {
      grant_reason: `Lý do cấp bù bắt buộc tối thiểu ${MIN_MANUAL_GRANT_REASON_LENGTH} ký tự (BR-ACL-07).`,
    });
  }

  const [user] = await db
    .select({ id: users.id, uuid: users.uuid, email: users.email })
    .from(users)
    .where(eq(users.uuid, params.userUuid))
    .limit(1);

  if (!user) {
    throw appError("NOT_FOUND", "Không tìm thấy người dùng.");
  }

  const result = await db.transaction(async (tx) => {
    const granted = await grantCredits({
      userId: user.id,
      delta: params.input.credits,
      reason: "manual_grant",
      refType: "manual_grant",
      refId: `manager-${params.managerId}-${Date.now()}`,
      grantedByManagerId: params.managerId,
      grantReason: params.input.grant_reason,
      notifyUser: params.input.notify_user,
      tx,
    });

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: params.managerId,
      action: "entitlement_granted",
      entity_type: "user",
      entity_id: user.uuid,
      reason: params.input.grant_reason,
      after_data: {
        credits: params.input.credits,
        new_balance: granted.balance,
      },
      ip_address: params.ip ?? null,
      user_agent: params.userAgent ?? null,
    });

    return granted;
  });

  return {
    user_uuid: user.uuid,
    credits_granted: params.input.credits,
    new_balance: result.balance,
  };
}

/**
 * Lists credit transaction history with pagination for user view (BR-ACL-01, spec §8).
 */
export async function listCreditTransactions(
  userId: number,
  options?: { limit?: number; offset?: number }
): Promise<{ items: AiCreditLedgerEntry[]; total: number }> {
  const db = getDb();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const items = await db
    .select()
    .from(aiCreditLedger)
    .where(eq(aiCreditLedger.userId, userId))
    .orderBy(desc(aiCreditLedger.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiCreditLedger)
    .where(eq(aiCreditLedger.userId, userId));

  return {
    items,
    total: countRow?.count ?? 0,
  };
}

export const grantAiCredits = (params: {
  userId: number;
  amount: number;
  reason: AiCreditReason;
  feature?: string;
  refType?: string;
  refId?: string;
  grantReason?: string;
}) =>
  grantCredits({
    userId: params.userId,
    delta: params.amount,
    reason: params.reason,
    feature: params.feature,
    refType: params.refType,
    refId: params.refId,
    grantReason: params.grantReason,
  });

export const debitAiCredits = (params: {
  userId: number;
  amount: number;
  feature: string;
  refType?: string;
  refId?: string;
  idempotencyKey?: string;
}) =>
  debitCredits({
    userId: params.userId,
    cost: params.amount,
    feature: params.feature,
    refType: params.refType,
    refId: params.refId,
    idempotencyKey: params.idempotencyKey,
  });

export const refundAiCredits = (params: {
  userId: number;
  amount: number;
  refType?: string;
  refId?: string;
  grantReason?: string;
}) =>
  refundCredits({
    userId: params.userId,
    cost: params.amount,
    debitRefId: params.refId,
    reason: params.grantReason,
  });
