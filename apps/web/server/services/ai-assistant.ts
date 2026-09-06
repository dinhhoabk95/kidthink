/**
 * Spec sở hữu: docs/specs/07-addon/ai-assistant.md
 * Business rules: BR-AIA-01..11
 */

import {
  aiUsageLog,
  childProfiles,
  gameLevels,
  getDb,
  lessons,
  masteryState,
  playSessions,
  skills,
} from "@mindkid/db";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import { ModerationBlockedError } from "@mindkid/errors/content";
import { moderateText } from "@mindkid/moderation";
import {
  type AccessTier,
  AI_SUGGESTION_LABEL,
  allowedTiers,
} from "@mindkid/shared";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { debitCredits, refundCredits } from "./ai-credit.ts";
import { validateAiReportEgress } from "./ai-egress-guard.ts";
import { aiProvider } from "./ai-provider.ts";

const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\bchẩn đoán\b/i,
  /\btự kỷ\b/i,
  /\badhd\b/i,
  /\bchậm phát triển\b/i,
  /\brối loạn\b/i,
  /\bkhuyết tật\b/i,
  /\by khoa\b/i,
  /\bbệnh lý\b/i,
];

function checkMedicalDiagnosisProhibition(text: string): boolean {
  for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
    if (pattern.test(text)) {
      return false; // Prohibited by BR-AIA-04
    }
  }
  return true;
}

export class AiAssistantService {
  /**
   * Helper to verify child ownership (IDOR protection, returns 404).
   */
  async getOwnedChild(userId: number, childUuid: string) {
    const db = getDb();
    const [child] = await db
      .select({
        id: childProfiles.id,
        uuid: childProfiles.uuid,
        birthYear: childProfiles.birthYear,
      })
      .from(childProfiles)
      .where(
        and(eq(childProfiles.uuid, childUuid), eq(childProfiles.userId, userId))
      )
      .limit(1);

    if (!child) {
      throw new ChildNotFoundError(childUuid);
    }

    return child;
  }

  /**
   * Builds closed allow-list aggregate payload (BR-AIA-01, BR-AIA-02, BR-CDC-06).
   * Strips all PII and constructs strictly aggregated data.
   */
  async buildReportPayload(
    childId: number,
    birthYear: number,
    periodDays: number
  ) {
    const db = getDb();
    const currentYear = new Date().getFullYear();
    const age = Math.max(3, Math.min(6, currentYear - birthYear));
    let ageBand: "3-4" | "4-5" | "5-6" = "3-4";
    if (age === 5) {
      ageBand = "4-5";
    } else if (age >= 6) {
      ageBand = "5-6";
    }
    const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Fetch aggregate sessions
    const [sessionStats] = await db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        totalMinutes: sql<number>`coalesce(sum(${playSessions.durationSeconds}), 0)::int / 60`,
        completedSessions: sql<number>`coalesce(sum(case when ${playSessions.completionStatus} = 'completed' then 1 else 0 end), 0)::int`,
      })
      .from(playSessions)
      .where(
        and(
          eq(playSessions.childProfileId, childId),
          gte(playSessions.startedAt, sinceDate)
        )
      );

    const sessions = sessionStats?.totalSessions ?? 0;
    const minutes = sessionStats?.totalMinutes ?? 0;
    const completionRate =
      sessions > 0 ? (sessionStats?.completedSessions ?? 0) / sessions : 1.0;

    // Fetch child's recent mastery skills
    const masteryRows = await db
      .select({
        skillCode: skills.code,
        skillName: skills.name,
        pLearn: masteryState.pLearn,
        attempts: masteryState.attemptsTotal,
      })
      .from(masteryState)
      .innerJoin(skills, eq(masteryState.skillId, skills.id))
      .where(eq(masteryState.childProfileId, childId))
      .limit(5);

    const formattedSkills = masteryRows.map((m) => {
      const p = Number(m.pLearn ?? 0);
      let masteryLabel = "Cần hỗ trợ";
      if (p >= 0.8) {
        masteryLabel = "Đã thành thạo";
      } else if (p >= 0.4) {
        masteryLabel = "Đang phát triển";
      }
      return {
        code: m.skillCode,
        name: m.skillName,
        mastery_label: masteryLabel,
        attempts: Number(m.attempts ?? 0),
      };
    });

    if (formattedSkills.length === 0) {
      formattedSkills.push({
        code: "C1.CNT.01",
        name: "Đếm số lượng trong phạm vi 5",
        mastery_label: "Đang làm quen",
        attempts: 1,
      });
    }

    const rawPayload = {
      age_band: ageBand,
      skills: formattedSkills,
      period_days: periodDays,
      totals: {
        sessions: Math.max(1, sessions),
        minutes: Math.max(5, minutes),
        completion_rate: Number(completionRate.toFixed(2)),
      },
    };

    // Deep-scan validate allow-list payload (BR-AIA-01)
    return validateAiReportEgress(rawPayload);
  }

  /**
   * Summarize child learning progress report (BR-AIA-01..04, BR-AIA-07..11).
   */
  async summarizeReport(userId: number, childUuid: string, periodDays = 30) {
    const db = getDb();
    const child = await this.getOwnedChild(userId, childUuid);
    const payload = await this.buildReportPayload(
      child.id,
      child.birthYear,
      periodDays
    );

    const idempotencyKey = `sum-rep:${userId}:${childUuid}:${Date.now()}`;
    const debit = await debitCredits({
      userId,
      cost: 1,
      feature: "report_summary",
      refType: "ai_usage_log",
      idempotencyKey,
    });

    let completion: Awaited<ReturnType<typeof aiProvider.summarizeReport>>;
    try {
      completion = await aiProvider.summarizeReport(payload);
    } catch {
      await refundCredits({
        userId,
        cost: 1,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Lỗi kết nối nhà cung cấp AI",
        idempotencyKey: `refund-sum:${debit.ledgerEntry.id}`,
      });
      throw new ServiceUnavailableError(
        "Dịch vụ trợ lý AI tạm thời không khả dụng. Credit đã được hoàn trả."
      );
    }

    // Moderation & Medical Diagnosis gate (BR-AIA-04, BR-AIA-09)
    const modResult = moderateText(completion.text);
    const medicalPassed = checkMedicalDiagnosisProhibition(completion.text);

    if (!(modResult.passed && medicalPassed)) {
      await refundCredits({
        userId,
        cost: 1,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Nội dung AI không qua kiểm duyệt an toàn",
        idempotencyKey: `refund-sum-mod:${debit.ledgerEntry.id}`,
      });

      await db.insert(aiUsageLog).values({
        userId,
        feature: "report_summary",
        creditsSpent: 0,
        model: completion.model,
        promptVersion: completion.promptVersion,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        costUsdMicros: completion.costUsdMicros,
        moderationPassed: false,
      });

      throw new ModerationBlockedError(
        "Nội dung từ trợ lý AI không qua được bộ lọc kiểm duyệt an toàn. Credit đã được hoàn lại."
      );
    }

    // Usage log (BR-AIA-07, BR-AIA-11)
    await db.insert(aiUsageLog).values({
      userId,
      feature: "report_summary",
      creditsSpent: 1,
      model: completion.model,
      promptVersion: completion.promptVersion,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      costUsdMicros: completion.costUsdMicros,
      moderationPassed: true,
    });

    return {
      summary: completion.text,
      label: AI_SUGGESTION_LABEL, // BR-AIA-03
      credits_spent: 1,
      remaining_balance: debit.newBalance,
    };
  }

  /**
   * Explain child learning report in plain language for parents (BR-AIA-01..04, BR-AIA-07..11).
   */
  async explainReport(userId: number, childUuid: string, periodDays = 30) {
    const db = getDb();
    const child = await this.getOwnedChild(userId, childUuid);
    const payload = await this.buildReportPayload(
      child.id,
      child.birthYear,
      periodDays
    );

    const idempotencyKey = `exp-rep:${userId}:${childUuid}:${Date.now()}`;
    const debit = await debitCredits({
      userId,
      cost: 1,
      feature: "report_explanation",
      refType: "ai_usage_log",
      idempotencyKey,
    });

    let completion: Awaited<ReturnType<typeof aiProvider.explainReport>>;
    try {
      completion = await aiProvider.explainReport(payload);
    } catch {
      await refundCredits({
        userId,
        cost: 1,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Lỗi kết nối nhà cung cấp AI",
        idempotencyKey: `refund-exp:${debit.ledgerEntry.id}`,
      });
      throw new ServiceUnavailableError(
        "Dịch vụ trợ lý AI tạm thời không khả dụng. Credit đã được hoàn trả."
      );
    }

    const modResult = moderateText(completion.text);
    const medicalPassed = checkMedicalDiagnosisProhibition(completion.text);

    if (!(modResult.passed && medicalPassed)) {
      await refundCredits({
        userId,
        cost: 1,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Nội dung AI không qua kiểm duyệt an toàn",
        idempotencyKey: `refund-exp-mod:${debit.ledgerEntry.id}`,
      });

      await db.insert(aiUsageLog).values({
        userId,
        feature: "report_explanation",
        creditsSpent: 0,
        model: completion.model,
        promptVersion: completion.promptVersion,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        costUsdMicros: completion.costUsdMicros,
        moderationPassed: false,
      });

      throw new ModerationBlockedError(
        "Nội dung từ trợ lý AI không qua được bộ lọc kiểm duyệt an toàn. Credit đã được hoàn lại."
      );
    }

    await db.insert(aiUsageLog).values({
      userId,
      feature: "report_explanation",
      creditsSpent: 1,
      model: completion.model,
      promptVersion: completion.promptVersion,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      costUsdMicros: completion.costUsdMicros,
      moderationPassed: true,
    });

    return {
      explanation: completion.text,
      label: AI_SUGGESTION_LABEL, // BR-AIA-03
      credits_spent: 1,
      remaining_balance: debit.newBalance,
    };
  }

  /**
   * Suggests published games or lessons from library (BR-AIA-05, BR-AIA-06, BR-AIA-10).
   * Read-only against catalog; NEVER mutates curriculum enrollments or authors new content.
   */
  async suggestContent(
    userId: number,
    options: {
      childUuid?: string;
      targetSkillCode?: string;
      contentType?: "game" | "lesson";
      limit?: number;
    } = {}
  ) {
    const db = getDb();
    if (options.childUuid) {
      await this.getOwnedChild(userId, options.childUuid);
    }

    const idempotencyKey = `sug-cnt:${userId}:${Date.now()}`;
    const debit = await debitCredits({
      userId,
      cost: 1,
      feature: "content_recommendation",
      refType: "ai_usage_log",
      idempotencyKey,
    });

    const safeLimit = Math.min(Math.max(1, options.limit ?? 5), 10);
    const allowed = await allowedTiers({ kind: "user", user_id: "user" }, [
      "play_login_games",
      "play_standard_games",
    ]);

    if (options.contentType === "lesson") {
      const lessonRows = await db
        .select({
          code: lessons.code,
          title: lessons.title,
          accessTier: lessons.accessTier,
        })
        .from(lessons)
        .where(eq(lessons.status, "published"))
        .orderBy(desc(lessons.id))
        .limit(safeLimit);

      const suggestions = lessonRows.map((item) => ({
        code: item.code,
        title: item.title,
        type: "lesson",
        access_tier: item.accessTier,
        locked: !allowed.includes(item.accessTier as AccessTier),
      }));

      await db.insert(aiUsageLog).values({
        userId,
        feature: "content_recommendation",
        creditsSpent: 1,
        model: "system-recommender",
        promptVersion: "v1.0",
        inputTokens: 40,
        outputTokens: 40,
        costUsdMicros: 0,
        moderationPassed: true,
      });

      return {
        suggestions,
        label: AI_SUGGESTION_LABEL, // BR-AIA-03
        credits_spent: 1,
        remaining_balance: debit.newBalance,
      };
    }

    // Default to game levels
    const levels = await db
      .select({
        code: gameLevels.code,
        title: gameLevels.title,
        thumbnailEmoji: gameLevels.thumbnailEmoji,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(eq(gameLevels.status, "published"))
      .orderBy(desc(gameLevels.id))
      .limit(safeLimit);

    const suggestions = levels.map((lvl) => ({
      code: lvl.code,
      title: lvl.title,
      type: "game",
      thumbnail_emoji: lvl.thumbnailEmoji ?? "🎮",
      access_tier: lvl.accessTier,
      locked: !allowed.includes(lvl.accessTier as AccessTier),
    }));

    await db.insert(aiUsageLog).values({
      userId,
      feature: "content_recommendation",
      creditsSpent: 1,
      model: "system-recommender",
      promptVersion: "v1.0",
      inputTokens: 50,
      outputTokens: 50,
      costUsdMicros: 0,
      moderationPassed: true,
    });

    return {
      suggestions,
      label: AI_SUGGESTION_LABEL, // BR-AIA-03
      credits_spent: 1,
      remaining_balance: debit.newBalance,
    };
  }

  /**
   * Rewrites an activity or lesson guide in clear, friendly language (BR-AIA-05, BR-AIA-07..11).
   */
  async rewriteGuide(
    userId: number,
    guideText: string,
    targetAudience: "home" | "class" = "home"
  ) {
    const db = getDb();
    const idempotencyKey = `rew-gd:${userId}:${Date.now()}`;
    const debit = await debitCredits({
      userId,
      cost: 2, // 2 credits for rewrite guide (table 7.1)
      feature: "instruction_rewrite",
      refType: "ai_usage_log",
      idempotencyKey,
    });

    let completion: Awaited<ReturnType<typeof aiProvider.rewriteGuide>>;
    try {
      completion = await aiProvider.rewriteGuide(guideText, targetAudience);
    } catch {
      await refundCredits({
        userId,
        cost: 2,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Lỗi kết nối nhà cung cấp AI",
        idempotencyKey: `refund-rew:${debit.ledgerEntry.id}`,
      });
      throw new ServiceUnavailableError(
        "Dịch vụ trợ lý AI tạm thời không khả dụng. Credit đã được hoàn trả."
      );
    }

    const modResult = moderateText(completion.text);
    const medicalPassed = checkMedicalDiagnosisProhibition(completion.text);

    if (!(modResult.passed && medicalPassed)) {
      await refundCredits({
        userId,
        cost: 2,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Nội dung AI không qua kiểm duyệt an toàn",
        idempotencyKey: `refund-rew-mod:${debit.ledgerEntry.id}`,
      });

      await db.insert(aiUsageLog).values({
        userId,
        feature: "instruction_rewrite",
        creditsSpent: 0,
        model: completion.model,
        promptVersion: completion.promptVersion,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        costUsdMicros: completion.costUsdMicros,
        moderationPassed: false,
      });

      throw new ModerationBlockedError(
        "Nội dung từ trợ lý AI không qua được bộ lọc kiểm duyệt an toàn. Credit đã được hoàn lại."
      );
    }

    await db.insert(aiUsageLog).values({
      userId,
      feature: "instruction_rewrite",
      creditsSpent: 2,
      model: completion.model,
      promptVersion: completion.promptVersion,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      costUsdMicros: completion.costUsdMicros,
      moderationPassed: true,
    });

    return {
      rewritten_guide: completion.text,
      label: AI_SUGGESTION_LABEL, // BR-AIA-03
      credits_spent: 2,
      remaining_balance: debit.newBalance,
    };
  }
}

export const aiAssistantService = new AiAssistantService();

export const summarizeReport = (
  userId: number,
  childUuid: string,
  periodDays?: number
) => aiAssistantService.summarizeReport(userId, childUuid, periodDays);

export const explainReport = (
  userId: number,
  childUuid: string,
  periodDays?: number
) => aiAssistantService.explainReport(userId, childUuid, periodDays);

export const suggestContent = (
  userId: number,
  options?: Parameters<AiAssistantService["suggestContent"]>[1]
) => aiAssistantService.suggestContent(userId, options);

export const rewriteGuide = (
  userId: number,
  guideText: string,
  targetAudience?: "home" | "class"
) => aiAssistantService.rewriteGuide(userId, guideText, targetAudience);
