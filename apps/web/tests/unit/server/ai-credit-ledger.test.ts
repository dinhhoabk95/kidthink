import {
  auditLogs,
  debitCredits,
  getCreditBalance,
  getOwnerDb,
  grantCredits,
  listCreditTransactions,
  managers,
  manualGrantCredits,
  notifications,
  reconcileCreditBalance,
  refundCredits,
  users,
} from "@mindkid/db";
import { AI_FEATURE_COSTS } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("AI Credit Ledger Integration Tests (BR-ACL-01..09)", () => {
  it("BR-ACL-01: records append-only ledger entries and maintains cached balance projection matching SUM(delta)", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl01-${uid}@example.com`,
        displayName: "Parent Credit Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    // Initial balance is 0
    const initialBal = await getCreditBalance(user.id);
    expect(initialBal.balance).toBe(0);

    // 1. Grant 50 credits (purchase)
    await grantCredits({
      userId: user.id,
      delta: 50,
      reason: "purchase",
      refType: "payment_order",
      refId: `order-${uid}-1`,
    });

    // 2. Grant 20 credits (manual_grant)
    await grantCredits({
      userId: user.id,
      delta: 20,
      reason: "manual_grant",
      grantReason: "Cấp bù sự cố hệ thống kiểm tra số dư",
    });

    // 3. Debit 5 credits (usage)
    await debitCredits({
      userId: user.id,
      cost: 5,
      feature: "report_summary",
    });

    // Check balance cache
    const bal = await getCreditBalance(user.id);
    expect(bal.balance).toBe(65);
    expect(bal.totalGranted).toBe(70);
    expect(bal.totalUsed).toBe(5);

    // Verify SUM(delta) matches cached balance exactly
    const reconcile = await reconcileCreditBalance(user.id);
    expect(reconcile.isMatched).toBe(true);
    expect(reconcile.computedSum).toBe(65);
    expect(reconcile.cachedBalance).toBe(65);
    expect(reconcile.diff).toBe(0);

    // Verify transaction list pagination
    const list = await listCreditTransactions(user.id, {
      limit: 10,
      offset: 0,
    });
    expect(list.total).toBe(3);
    expect(list.items.length).toBe(3);
  });

  it("BR-ACL-02: debits credit before LLM call and refunds via inverse transaction if LLM provider fails", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl02-${uid}@example.com`,
        displayName: "Parent Refund Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await grantCredits({
      userId: user.id,
      delta: 10,
      reason: "purchase",
    });

    // Debit 2 credits before LLM call
    const cost = AI_FEATURE_COSTS.instruction_rewrite; // 2 credits
    const debitRes = await debitCredits({
      userId: user.id,
      cost,
      feature: "instruction_rewrite",
      refType: "ai_usage_log",
      refId: `log-${uid}-mock`,
    });

    expect(debitRes.success).toBe(true);
    expect(debitRes.newBalance).toBe(8);

    // Simulate provider failure -> call refundCredits
    const refundRes = await refundCredits({
      userId: user.id,
      cost,
      debitRefId: debitRes.ledgerEntry.uuid,
      reason: "LLM provider timeout 10000ms",
    });

    expect(refundRes.success).toBe(true);
    expect(refundRes.newBalance).toBe(10);

    // Check ledger has both debit and refund rows (append-only)
    const txs = await listCreditTransactions(user.id);
    expect(txs.total).toBe(3);
    expect(txs.items[0]?.reason).toBe("refund");
    expect(txs.items[0]?.delta).toBe(2);
    expect(txs.items[1]?.reason).toBe("usage");
    expect(txs.items[1]?.delta).toBe(-2);
  });

  it("BR-ACL-03: throws 402 INSUFFICIENT_CREDITS and prevents negative balance when balance is depleted", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl03-${uid}@example.com`,
        displayName: "Parent Depleted Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await grantCredits({
      userId: user.id,
      delta: 1,
      reason: "purchase",
    });

    // Try debiting 2 credits when user only has 1
    await expect(
      debitCredits({
        userId: user.id,
        cost: 2,
        feature: "instruction_rewrite",
      })
    ).rejects.toThrow();

    try {
      await debitCredits({
        userId: user.id,
        cost: 2,
        feature: "instruction_rewrite",
      });
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        code?: string;
        details?: { required?: number; current?: number };
      };
      expect(error.status).toBe(402);
      expect(error.code).toBe("INSUFFICIENT_CREDITS");
      expect(error.details?.required).toBe(2);
      expect(error.details?.current).toBe(1);
    }

    // Verify balance remains non-negative (still 1)
    const bal = await getCreditBalance(user.id);
    expect(bal.balance).toBe(1);
  });

  it("BR-ACL-04: credits do not have an expiration date in v1 schema", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl04-${uid}@example.com`,
        displayName: "Parent No Expiry Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const { ledgerEntry } = await grantCredits({
      userId: user.id,
      delta: 100,
      reason: "purchase",
    });

    expect(ledgerEntry.createdAt).toBeDefined();
    // Verify ledger table schema has no expires_at column
    expect((ledgerEntry as Record<string, unknown>).expiresAt).toBeUndefined();
  });

  it("BR-ACL-05: atomic debit with row locking prevents race condition on concurrent requests", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl05-${uid}@example.com`,
        displayName: "Parent Concurrency Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    // User has exactly 1 credit
    await grantCredits({
      userId: user.id,
      delta: 1,
      reason: "purchase",
    });

    // Fire 2 concurrent debit requests for 1 credit each
    const req1 = debitCredits({
      userId: user.id,
      cost: 1,
      feature: "semantic_search",
      idempotencyKey: `concurrent-${uid}-1`,
    });
    const req2 = debitCredits({
      userId: user.id,
      cost: 1,
      feature: "semantic_search",
      idempotencyKey: `concurrent-${uid}-2`,
    });

    const results = await Promise.allSettled([req1, req2]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly 1 must succeed, exactly 1 must fail with 402
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const bal = await getCreditBalance(user.id);
    expect(bal.balance).toBe(0);
  });

  it("BR-ACL-06: AI credit balance never grants access to content_tier (BR-ENT-08)", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl06-${uid}@example.com`,
        displayName: "Parent Tier Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await grantCredits({
      userId: user.id,
      delta: 500,
      reason: "purchase",
    });

    const bal = await getCreditBalance(user.id);
    expect(bal.balance).toBe(500);

    // AI credit is completely isolated from content entitlements
    expect((bal as Record<string, unknown>).accessTier).toBeUndefined();
    expect((bal as Record<string, unknown>).entitlements).toBeUndefined();
  });

  it("BR-ACL-07: manual grant by Super Admin requires reason >= 20 chars and logs audit entry", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [manager] = await db
      .insert(managers)
      .values({
        email: `sa-credit-${uid}@mindkid.edu.vn`,
        displayName: "Super Admin Tester",
        role: "super_admin",
        passwordHash: "hash-mock",
      })
      .returning();
    if (!manager) {
      throw new Error("Failed to insert manager");
    }

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl07-${uid}@example.com`,
        displayName: "Parent Manual Grant Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    // 1. Reject if reason is too short (< 20 chars)
    await expect(
      manualGrantCredits({
        managerId: manager.id,
        userUuid: user.uuid,
        input: {
          credits: 50,
          grant_reason: "Lý do ngắn",
        },
      })
    ).rejects.toThrow();

    // 2. Success with valid reason >= 20 chars
    const grantRes = await manualGrantCredits({
      managerId: manager.id,
      userUuid: user.uuid,
      input: {
        credits: 50,
        grant_reason:
          "Cấp bù credit theo yêu cầu hỗ trợ người dùng qua hotline",
        notify_user: true,
      },
      ip: "127.0.0.1",
      userAgent: "Vitest Agent",
    });

    expect(grantRes.credits_granted).toBe(50);
    expect(grantRes.new_balance).toBe(50);

    // Check audit log was written
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, user.uuid))
      .orderBy(eq(auditLogs.id, auditLogs.id));

    expect(auditLog).toBeDefined();
    expect(auditLog?.action).toBe("entitlement_granted");
    expect(auditLog?.actorType).toBe("manager");
    expect(auditLog?.actorId).toBe(manager.id);
  });

  it("BR-ACL-08: real USD cost is recorded separately from credit ledger (ledger contains only integer credits)", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl08-${uid}@example.com`,
        displayName: "Parent Usd Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const { ledgerEntry } = await grantCredits({
      userId: user.id,
      delta: 100,
      reason: "purchase",
    });

    expect(typeof ledgerEntry.delta).toBe("number");
    expect(Number.isInteger(ledgerEntry.delta)).toBe(true);
    expect((ledgerEntry as Record<string, unknown>).costUsd).toBeUndefined();
    expect(
      (ledgerEntry as Record<string, unknown>).costUsdMicros
    ).toBeUndefined();
  });

  it("BR-ACL-09: triggers low-credit warning notification when balance drops below 20%", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-acl09-${uid}@example.com`,
        displayName: "Parent Low Warning Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    // User is granted 100 credits -> 20% threshold is 20
    await grantCredits({
      userId: user.id,
      delta: 100,
      reason: "purchase",
    });

    // Debit from 100 to 25 -> above threshold, no notification
    await debitCredits({
      userId: user.id,
      cost: 75,
      feature: "report_summary",
    });

    let notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(
      notifs.filter((n) => n.templateCode === "ai_credits_low").length
    ).toBe(0);

    // Debit from 25 to 15 -> crosses 20% threshold, triggers notification
    await debitCredits({
      userId: user.id,
      cost: 10,
      feature: "report_summary",
    });

    notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    const lowCreditNotifs = notifs.filter(
      (n) => n.templateCode === "ai_credits_low"
    );
    expect(lowCreditNotifs.length).toBe(1);
    expect(
      (lowCreditNotifs[0]?.payload as Record<string, unknown>)
        ?.remaining_credits
    ).toBe(15);
  });

  it("Idempotency: repeated calls with identical idempotencyKey return cached result without double charging", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-credit-idemp-${uid}@example.com`,
        displayName: "Parent Idempotency Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const idempKey = `grant-idemp-${uid}`;

    // First grant
    const grant1 = await grantCredits({
      userId: user.id,
      delta: 50,
      reason: "purchase",
      idempotencyKey: idempKey,
    });
    expect(grant1.balance).toBe(50);

    // Duplicate grant with same idempotencyKey
    const grant2 = await grantCredits({
      userId: user.id,
      delta: 50,
      reason: "purchase",
      idempotencyKey: idempKey,
    });
    expect(grant2.balance).toBe(50);
    expect(grant2.ledgerEntry.uuid).toBe(grant1.ledgerEntry.uuid);

    // Verify balance is still 50, not 100
    const bal = await getCreditBalance(user.id);
    expect(bal.balance).toBe(50);
  });
});
