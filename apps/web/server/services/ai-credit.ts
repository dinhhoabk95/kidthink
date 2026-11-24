/**
 * Spec sở hữu: docs/specs/07-addon/ai-credit-ledger.md
 * Business rules: BR-ACL-01..09
 */

import { writeAudit } from "@mindkid/audit";
import {
  AI_CREDIT_REASON_CODEC,
  type AiCreditBalanceEntity,
  type AiCreditLedgerEntity,
  type DbExecutor,
  RECIPIENT_TYPE,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { UserNotFoundError } from "@mindkid/errors/account";
import { InsufficientCreditsError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  type AiCreditReason,
  LOW_CREDIT_WARNING_THRESHOLD_PERCENT,
  type ManualGrantCreditsInput,
  MIN_MANUAL_GRANT_REASON_LENGTH,
} from "@mindkid/shared";
import { useRepositories } from "#server/utils/repositories";

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
  tx?: DbExecutor;
}

export interface DebitCreditsParams {
  userId: number;
  cost: number;
  feature: string;
  refType?: string;
  refId?: string;
  idempotencyKey?: string;
  tx?: DbExecutor;
}

export interface RefundCreditsParams {
  userId: number;
  cost: number;
  debitRefId?: string;
  reason?: string;
  idempotencyKey?: string;
  tx?: DbExecutor;
}

export interface ManualGrantParams {
  managerId: number;
  userUuid: string;
  input: ManualGrantCreditsInput;
  ip?: string | null;
  userAgent?: string | null;
}

function getRepos(tx?: DbExecutor): MindKidRepositories {
  return tx ? createRepositories(tx) : useRepositories();
}

/**
 * Gets credit balance info for a user (BR-ACL-01).
 */
export async function getCreditBalance(
  userId: number,
  tx?: DbExecutor
): Promise<AiCreditBalanceEntity> {
  const repos = getRepos(tx);
  const row = await repos.aiCredits.getBalance(userId);

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

/**
 * Grants AI credits to a user (append-only ledger + cache projection) (BR-ACL-01, BR-ACL-07).
 */
export async function grantCredits(
  params: GrantCreditsParams
): Promise<{ ledgerEntry: AiCreditLedgerEntity; balance: number }> {
  const repos = getRepos(params.tx);
  const res = await repos.aiCredits.grantCreditsAtomic({
    userId: params.userId,
    delta: params.delta,
    reason: AI_CREDIT_REASON_CODEC.toCode(params.reason),
    refType: params.refType ?? null,
    refId: params.refId ?? null,
    feature: params.feature ?? null,
    grantedByManagerId: params.grantedByManagerId ?? null,
    grantReason: params.grantReason ?? null,
    idempotencyKey: params.idempotencyKey ?? null,
  });

  if (params.notifyUser && !res.alreadyProcessed) {
    await repos.notifications.createInAppNotification({
      recipientType: RECIPIENT_TYPE.USER,
      recipientId: params.userId,
      templateCode: "ai_credits_granted",
      payload: {
        credits: params.delta,
        reason: params.reason,
      },
    });
  }

  return { ledgerEntry: res.ledgerEntry, balance: res.balance };
}

/**
 * Debits AI credits atomically before LLM invocation (BR-ACL-02, BR-ACL-03, BR-ACL-05, BR-ACL-09).
 */
export async function debitCredits(params: DebitCreditsParams): Promise<{
  success: boolean;
  newBalance: number;
  ledgerEntry: AiCreditLedgerEntity;
}> {
  const repos = getRepos(params.tx);
  const res = await repos.aiCredits.debitCreditsAtomic({
    userId: params.userId,
    cost: params.cost,
    feature: params.feature,
    refType: params.refType ?? null,
    refId: params.refId ?? null,
    idempotencyKey: params.idempotencyKey ?? null,
  });

  if (!res.ok) {
    throw new InsufficientCreditsError(
      `Số dư AI credit không đủ. Bạn cần ${params.cost} credit nhưng hiện chỉ còn ${res.currentBalance} credit.`,
      {
        cause: {
          required: params.cost,
          current: res.currentBalance,
        },
      }
    );
  }

  if (!res.alreadyProcessed) {
    const threshold = Math.max(
      10,
      Math.floor(res.totalGranted * LOW_CREDIT_WARNING_THRESHOLD_PERCENT)
    );
    if (res.prevBalance >= threshold && res.newBalance < threshold) {
      await repos.notifications.createInAppNotification({
        recipientType: RECIPIENT_TYPE.USER,
        recipientId: params.userId,
        templateCode: "ai_credits_low",
        payload: {
          remaining_credits: res.newBalance,
          threshold,
        },
      });
    }
  }

  return {
    success: true,
    newBalance: res.newBalance,
    ledgerEntry: res.ledgerEntry,
  };
}

/**
 * Refunds credits via an inverse positive transaction entry when LLM provider fails (BR-ACL-02).
 */
export async function refundCredits(params: RefundCreditsParams): Promise<{
  success: boolean;
  newBalance: number;
  ledgerEntry: AiCreditLedgerEntity;
}> {
  const repos = getRepos(params.tx);
  const res = await repos.aiCredits.refundCreditsAtomic({
    userId: params.userId,
    cost: params.cost,
    debitRefId: params.debitRefId ?? null,
    reason: params.reason ?? null,
    idempotencyKey: params.idempotencyKey ?? null,
  });

  return {
    success: true,
    newBalance: res.newBalance,
    ledgerEntry: res.ledgerEntry,
  };
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
  const repos = useRepositories();
  const [computedSum, balanceRow] = await Promise.all([
    repos.aiCredits.sumLedgerDeltaForUser(userId),
    getCreditBalance(userId),
  ]);

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
  const repos = useRepositories();

  if (
    params.input.grant_reason.trim().length < MIN_MANUAL_GRANT_REASON_LENGTH
  ) {
    throw new ValidationError(
      `Lý do cấp bù bắt buộc tối thiểu ${MIN_MANUAL_GRANT_REASON_LENGTH} ký tự (BR-ACL-07).`
    );
  }

  const user = await repos.users.findByUuid(params.userUuid);
  if (!user) {
    throw new UserNotFoundError(params.userUuid);
  }

  const result = await repos.aiCredits.transaction(async (tx) => {
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
): Promise<{ items: AiCreditLedgerEntity[]; total: number }> {
  const repos = useRepositories();
  const limit = Math.min(Math.max(1, options?.limit ?? 20), 100);
  const offset = Math.max(0, options?.offset ?? 0);

  const pageResult = await repos.aiCredits.listLedgerByUser(userId, {
    limit,
    offset,
  });

  return {
    items: [...pageResult.items],
    total: pageResult.total,
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
