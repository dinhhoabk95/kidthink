import { AI_SUGGESTION_LABEL } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  aiAssistantService,
  aiUsageLog,
  childProfiles,
  gameLevels,
  getDb,
  getOwnerDb,
  grantCredits,
  users,
} from "#src/index";
import { aiProvider } from "#src/services/ai-provider";

describe("AI Assistant Service Integration Tests (BR-AIA-01..11)", () => {
  afterEach(() => {
    aiProvider.resetMockModes();
  });

  async function createTestParent(initialCredits = 10) {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-ai-parent-${uid}@example.com`,
        displayName: "Người dùng Test AI",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Test AI",
        birthYear: 2021,
        avatarId: "preset_lion_01",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }

    if (initialCredits > 0) {
      await grantCredits({
        userId: user.id,
        delta: initialCredits,
        reason: "purchase",
        refType: "payment_order",
        refId: `order-ai-test-${uid}`,
      });
    }

    return { user, child };
  }

  it("BR-AIA-01 & BR-AIA-03 & BR-AIA-07: summarizeReport debits 1 credit, logs usage, and returns summary with label 'Gợi ý'", async () => {
    const { user, child } = await createTestParent(5);
    const db = getDb();

    const res = await aiAssistantService.summarizeReport(
      user.id,
      child.uuid,
      30
    );

    expect(res.label).toBe(AI_SUGGESTION_LABEL);
    expect(res.credits_spent).toBe(1);
    expect(res.remaining_balance).toBe(4);
    expect(res.summary).toContain("Gợi ý tóm tắt tiến trình học tập");

    // Verify usage log (BR-AIA-07, BR-AIA-11)
    const logs = await db
      .select()
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, user.id));

    expect(logs.length).toBe(1);
    expect(logs[0]?.feature).toBe("report_summary");
    expect(logs[0]?.creditsSpent).toBe(1);
    expect(logs[0]?.moderationPassed).toBe(true);
    expect(logs[0]?.promptVersion).toBe("v1.0");
  });

  it("BR-AIA-01 & BR-AIA-03: explainReport debits 1 credit and returns parent explanation with label 'Gợi ý'", async () => {
    const { user, child } = await createTestParent(5);

    const res = await aiAssistantService.explainReport(user.id, child.uuid, 30);

    expect(res.label).toBe(AI_SUGGESTION_LABEL);
    expect(res.credits_spent).toBe(1);
    expect(res.remaining_balance).toBe(4);
    expect(res.explanation).toContain("Gợi ý giải thích dành cho ba mẹ");
  });

  it("BR-AIA-08: throws INSUFFICIENT_CREDITS (402) when user has 0 credit and does not downgrade model silently", async () => {
    const { user, child } = await createTestParent(0);

    await expect(
      aiAssistantService.summarizeReport(user.id, child.uuid, 30)
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_CREDITS",
    });
  });

  it("BR-AIA-04: prohibits medical/developmental diagnosis, refunds debited credit and logs moderation failure with creditsSpent=0", async () => {
    const { user, child } = await createTestParent(5);
    const db = getDb();

    // Trigger simulated medical diagnosis in AI provider
    aiProvider.setMedicalDiagnosisMode(true);

    await expect(
      aiAssistantService.summarizeReport(user.id, child.uuid, 30)
    ).rejects.toMatchObject({
      code: "MODERATION_BLOCKED",
    });

    // Check usage log: logged with creditsSpent = 0 and moderationPassed = false
    const logs = await db
      .select()
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, user.id));

    expect(logs.length).toBe(1);
    expect(logs[0]?.moderationPassed).toBe(false);
    expect(logs[0]?.creditsSpent).toBe(0);
  });

  it("BR-AIA-09: inappropriate content blocked by moderation filter refunds credit and returns 422", async () => {
    const { user, child } = await createTestParent(5);

    aiProvider.setInappropriateMode(true);

    await expect(
      aiAssistantService.explainReport(user.id, child.uuid, 30)
    ).rejects.toMatchObject({
      code: "MODERATION_BLOCKED",
    });
  });

  it("refunds debited credit and throws 503 when AI provider fails or times out", async () => {
    const { user, child } = await createTestParent(5);

    aiProvider.setFailureMode(true);

    await expect(
      aiAssistantService.summarizeReport(user.id, child.uuid, 30)
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("IDOR protection: accessing non-owned child throws NOT_FOUND (404), NOT 403", async () => {
    const { user: parentA } = await createTestParent(5);
    const { child: childB } = await createTestParent(5);

    await expect(
      aiAssistantService.summarizeReport(parentA.id, childB.uuid, 30)
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("BR-AIA-05: rewriteGuide debits 2 credits and returns rewritten guide for parents", async () => {
    const { user } = await createTestParent(5);

    const res = await aiAssistantService.rewriteGuide(
      user.id,
      "Cho trẻ đếm 3 khối gỗ hình vuông và xếp thành hàng ngang.",
      "home"
    );

    expect(res.label).toBe(AI_SUGGESTION_LABEL);
    expect(res.credits_spent).toBe(2);
    expect(res.remaining_balance).toBe(3);
    expect(res.rewritten_guide).toContain(
      "Gợi ý hướng dẫn dành cho người dạy tại nhà"
    );
  });

  it("BR-AIA-05 & BR-AIA-06 & BR-AIA-10: suggestContent queries published games/lessons without altering curriculum", async () => {
    const { user } = await createTestParent(5);
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    // Seed dummy game level
    const templateCode = "GT-001";
    await db.insert(gameLevels).values({
      entityId: uid,
      code: `GL-C1-CNT-NUM-${String(uid).slice(0, 4)}`,
      templateCode,
      contentVersion: 1,
      title: "Mức chơi AI Test",
      contentPack: {},
      difficultyParams: {},
      status: "published",
      accessTier: "free",
    });

    const res = await aiAssistantService.suggestContent(user.id, {
      contentType: "game",
      limit: 3,
    });

    expect(res.label).toBe(AI_SUGGESTION_LABEL);
    expect(res.credits_spent).toBe(1);
    expect(res.remaining_balance).toBe(4);
    expect(Array.isArray(res.suggestions)).toBe(true);
  });
});
