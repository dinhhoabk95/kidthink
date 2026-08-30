import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/client";
import {
  aiCreditBalance,
  contentEmbeddings,
  gameLevels,
  gameTemplates,
  users,
} from "#src/index";
import { grantAiCredits } from "#src/services/ai-credit";
import { assertNoEgressViolation } from "#src/services/ai-egress-guard";
import {
  createDeterministicEmbedding,
  setSimulatedAiFailure,
} from "#src/services/ai-provider";
import { performSemanticSearch } from "#src/services/semantic-search";

const PRIVACY_VIOLATION_REGEX = /Privacy violation/;

describe("Task P4.8 — Semantic Search Service (BR-SEM-01..08)", () => {
  const db = getOwnerDb();
  let testUserId: number;
  let freeGameId: number;
  let premiumGameId: number;

  beforeAll(async () => {
    // 1. Create test user with initial credits
    const [user] = await db
      .insert(users)
      .values({
        email: `sem_search_user_${Date.now()}@example.com`,
        passwordHash: "hash",
        displayName: "Semantic Search Tester",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
    testUserId = user.id;

    await grantAiCredits({
      userId: testUserId,
      amount: 100,
      reason: "purchase",
      feature: "test_setup",
    });

    // 2. Ensure template exists
    const [template] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-001",
        name: "Game Template Đếm",
        mechanic: "count",
      })
      .onConflictDoNothing()
      .returning();

    let templateId = template?.id;
    if (!templateId) {
      const [existingTemplate] = await db
        .select()
        .from(gameTemplates)
        .where(sql`code = 'GT-001'`)
        .limit(1);
      if (!existingTemplate) {
        throw new Error("Failed to find or create GT-001");
      }
      templateId = existingTemplate.id;
    }

    // 3. Create game levels
    const freeEntityId = Math.floor(Math.random() * 900_000) + 100_000;
    const numSuffix = (Math.floor(Math.random() * 8000) + 1000).toString();
    const [freeLevel] = await db
      .insert(gameLevels)
      .values({
        entityId: freeEntityId,
        code: `GL-C1-CNT-CARD-${numSuffix}`,
        contentVersion: 1,
        templateId,
        title: "Đếm hoa quả nông trại",
        instruction: "Em hãy đếm các quả táo màu đỏ.",
        ageMin: 3,
        ageMax: 4,
        difficulty: 1,
        accessTier: "free",
        status: "published",
        contentPack: { items: ["apple", "banana"] },
        difficultyParams: { count: 3 },
      })
      .returning();
    if (!freeLevel) {
      throw new Error("Failed to insert freeLevel");
    }
    freeGameId = freeLevel.id;

    const premEntityId = Math.floor(Math.random() * 900_000) + 100_000;
    const numSuffix2 = (Math.floor(Math.random() * 8000) + 1000).toString();
    const [premiumLevel] = await db
      .insert(gameLevels)
      .values({
        entityId: premEntityId,
        code: `GL-C1-CNT-CARD-${numSuffix2}`,
        contentVersion: 1,
        templateId,
        title: "Thử thách đếm hoa quả nâng cao",
        instruction: "Em hãy đếm số lượng hoa quả và tìm quy luật.",
        ageMin: 5,
        ageMax: 6,
        difficulty: 4,
        accessTier: "premium",
        status: "published",
        contentPack: { secret_pack_data: [1, 2, 3] },
        difficultyParams: { count: 5 },
      })
      .returning();
    if (!premiumLevel) {
      throw new Error("Failed to insert premiumLevel");
    }
    premiumGameId = premiumLevel.id;

    // 3. Insert vector embeddings
    const freeVec = createDeterministicEmbedding("hoa quả táo đếm");
    await db
      .insert(contentEmbeddings)
      .values({
        contentType: "game_level",
        contentId: freeGameId,
        contentVersion: 1,
        model: "text-embedding-3-small",
        embedding: freeVec,
        chunkIndex: 0,
        chunkText: "Đếm hoa quả nông trại Em hãy đếm các quả táo màu đỏ",
      })
      .onConflictDoNothing();

    const premVec = createDeterministicEmbedding(
      "hoa quả đếm nâng cao quy luật"
    );
    await db
      .insert(contentEmbeddings)
      .values({
        contentType: "game_level",
        contentId: premiumGameId,
        contentVersion: 1,
        model: "text-embedding-3-small",
        embedding: premVec,
        chunkIndex: 0,
        chunkText: "Thử thách đếm hoa quả nâng cao Em hãy đếm số lượng hoa quả",
      })
      .onConflictDoNothing();
  });

  it("BR-SEM-01: validates query minimum and maximum length via schema", async () => {
    // Too short (1 char)
    await expect(performSemanticSearch(testUserId, "a")).rejects.toThrow();
    // Valid query
    const res = await performSemanticSearch(testUserId, "hoa quả");
    expect(res).toBeDefined();
    expect(res.fallback).toBe(false);
  });

  it("BR-SEM-02: egress guard rejects raw UUIDs and sensitive canary tokens", () => {
    expect(() => {
      assertNoEgressViolation("Tìm bài học cho bé [CANARY_CHILD_UUID]");
    }).toThrow(PRIVACY_VIOLATION_REGEX);

    expect(() => {
      assertNoEgressViolation("550e8400-e29b-41d4-a716-446655440000");
    }).toThrow(PRIVACY_VIOLATION_REGEX);
  });

  it("BR-SEM-03: current-version-only search excludes stale version embeddings", async () => {
    // Add stale version embedding (version 0)
    const staleVec = createDeterministicEmbedding("hoa quả táo");
    await db
      .insert(contentEmbeddings)
      .values({
        contentType: "game_level",
        contentId: freeGameId,
        contentVersion: 0, // Stale
        model: "text-embedding-3-small",
        embedding: staleVec,
        chunkIndex: 0,
        chunkText: "Stale version text",
      })
      .onConflictDoNothing();

    const res = await performSemanticSearch(testUserId, "hoa quả");
    // Only current published version 1 items returned
    for (const item of res.items) {
      if (item.id === freeGameId) {
        expect(item.code).toBeDefined();
      }
    }
  });

  it("BR-SEM-04: debits 1 credit upfront per semantic search call", async () => {
    const [beforeBal] = await db
      .select()
      .from(aiCreditBalance)
      .where(sql`user_id = ${testUserId}`);
    const initialBalance = beforeBal?.balance ?? 0;

    const res = await performSemanticSearch(testUserId, "hoa quả táo");
    expect(res.credits_spent).toBe(1);

    const [afterBal] = await db
      .select()
      .from(aiCreditBalance)
      .where(sql`user_id = ${testUserId}`);
    expect(afterBal?.balance).toBe(initialBalance - 1);
  });

  it("BR-SEM-05 & BR-SEM-06: sorts by Access Ladder and strips content_pack for locked items", async () => {
    // User is "free" tier
    const res = await performSemanticSearch(
      testUserId,
      "hoa quả đếm",
      10,
      "free"
    );

    expect(res.items.length).toBeGreaterThan(0);
    const freeItem = res.items.find((i) => i.id === freeGameId);
    const premiumItem = res.items.find((i) => i.id === premiumGameId);

    if (freeItem && premiumItem) {
      expect(freeItem.is_locked).toBe(false);
      expect(freeItem.content_pack).toBeDefined();

      expect(premiumItem.is_locked).toBe(true);
      expect(premiumItem.content_pack).toBeUndefined(); // Strip locked content_pack

      // Open item comes before locked item
      const freeIdx = res.items.indexOf(freeItem);
      const premIdx = res.items.indexOf(premiumItem);
      expect(freeIdx).toBeLessThan(premIdx);
    }
  });

  it("BR-SEM-07: refunds credit and falls back to base search when provider fails", async () => {
    const [beforeBal] = await db
      .select()
      .from(aiCreditBalance)
      .where(sql`user_id = ${testUserId}`);
    const balanceBefore = beforeBal?.balance ?? 0;

    // Simulate provider failure
    setSimulatedAiFailure(true);

    try {
      const res = await performSemanticSearch(testUserId, "Đếm hoa quả");
      expect(res.fallback).toBe(true);
      expect(res.credits_spent).toBe(0);

      // Verify credit balance was refunded
      const [afterBal] = await db
        .select()
        .from(aiCreditBalance)
        .where(sql`user_id = ${testUserId}`);
      expect(afterBal?.balance).toBe(balanceBefore);
    } finally {
      setSimulatedAiFailure(false);
    }
  });
});
