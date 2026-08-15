import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/client.ts";
import { aiUsageLog, contentEmbeddings, users } from "../../src/index.ts";
import { createDeterministicEmbedding } from "../../src/services/ai-provider.ts";

describe("Task P4.8 — Semantic Schema & pgvector (BR-SEM-01, BR-SEM-03, BR-SEM-08)", () => {
  const db = getOwnerDb();
  let testUserId: number;

  beforeAll(async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `semantic_schema_${Date.now()}@example.com`,
        passwordHash: "hash",
        displayName: "Semantic Schema User",
      })
      .returning();
    testUserId = user.id;
  });

  const uniqueContentId = Math.floor(Math.random() * 900_000) + 100_000;

  it("creates vector extension and stores 1536-dimensional embeddings", async () => {
    const dummyVector = createDeterministicEmbedding(
      "Bé học đếm số từ một đến mười"
    );
    expect(dummyVector.length).toBe(1536);

    const [inserted] = await db
      .insert(contentEmbeddings)
      .values({
        contentType: "game_level",
        contentId: uniqueContentId,
        contentVersion: 1,
        model: "text-embedding-3-small",
        embedding: dummyVector,
        chunkIndex: 0,
        chunkText: "Bé học đếm số từ một đến mười",
      })
      .returning();

    expect(inserted.id).toBeDefined();
    expect(inserted.contentType).toBe("game_level");
    expect(inserted.contentVersion).toBe(1);

    // Test pgvector cosine distance calculation
    const vectorStr = `[${dummyVector.join(",")}]`;
    const res = await db.execute<{ cosine_dist: number }>(
      sql`SELECT (embedding <=> ${vectorStr}::vector) as cosine_dist FROM content_embeddings WHERE id = ${inserted.id}`
    );

    expect(res.length).toBe(1);
    // Cosine distance of identical vector should be ~0.0
    expect(Number(res[0].cosine_dist)).toBeLessThan(0.001);
  });

  it("enforces unique constraint on (content_type, content_id, content_version, model, chunk_index)", async () => {
    const vector = createDeterministicEmbedding("Duplicate test");

    await expect(
      db.insert(contentEmbeddings).values({
        contentType: "game_level",
        contentId: uniqueContentId,
        contentVersion: 1,
        model: "text-embedding-3-small",
        embedding: vector,
        chunkIndex: 0,
        chunkText: "Duplicate",
      })
    ).rejects.toThrow();
  });

  it("logs AI usage records in ai_usage_log table", async () => {
    const [log] = await db
      .insert(aiUsageLog)
      .values({
        userId: testUserId,
        feature: "semantic_search",
        creditsSpent: 1,
        model: "text-embedding-3-small",
        promptVersion: "v1.0",
        inputTokens: 10,
        outputTokens: 0,
        costUsdMicros: 10,
        moderationPassed: true,
      })
      .returning();

    expect(log.id).toBeDefined();
    expect(log.uuid).toBeDefined();
    expect(log.userId).toBe(testUserId);
    expect(log.feature).toBe("semantic_search");
    expect(log.creditsSpent).toBe(1);
  });
});
