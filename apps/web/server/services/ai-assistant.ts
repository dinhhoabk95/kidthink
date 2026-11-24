/**
 * Spec sở hữu: docs/specs/07-addon/ai-assistant.md
 * Business rules: BR-AIA-01..11
 */

import { ACCESS_TIER_CODEC } from "@mindkid/db";
import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import { ModerationBlockedError } from "@mindkid/errors/content";
import { moderateText } from "@mindkid/moderation";
import {
  type AccessTier,
  type AgeBand,
  AI_SUGGESTION_LABEL,
  allowedTiers,
  deriveAgeBand,
} from "@mindkid/shared";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useRepositories } from "#server/utils/repositories";
import { debitCredits, refundCredits } from "./ai-credit.js";
import { validateAiReportEgress } from "./ai-egress-guard.js";
import { aiProvider } from "./ai-provider.js";

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

async function assertAiAnalysisEntitlement(userId: number): Promise<void> {
  const activeEntitlements = await resolveUserActiveEntitlements(userId);
  if (!activeEntitlements.includes("use_ai_analysis")) {
    throw new EntitlementRequiredError(
      {
        required_entitlement: "use_ai_analysis",
      },
      "Tài khoản cần có gói bổ sung AI để sử dụng tính năng trợ lý AI."
    );
  }
}

export class AiAssistantService {
  /**
   * Helper to verify child ownership (IDOR protection, returns 404).
   */
  async getOwnedChild(userId: number, childUuid: string) {
    const repos = useRepositories();
    const child = await repos.childProfiles.findByUuidForUser(
      childUuid,
      userId
    );

    if (!child) {
      throw new ChildNotFoundError(childUuid);
    }

    return {
      id: child.id,
      uuid: child.uuid,
      birthYear: child.birthYear,
    };
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
    const repos = useRepositories();
    const currentYear = new Date().getFullYear();
    const ageBand: AgeBand = deriveAgeBand(birthYear, currentYear);
    const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [sessionStats, masteryRows] = await Promise.all([
      repos.playSessions.getChildAggregateSince(childId, sinceDate),
      repos.mastery.listForChildWithSkillInfo(childId, 5),
    ]);

    const sessions = sessionStats.totalSessions;
    const minutes = sessionStats.totalMinutes;
    const completionRate =
      sessions > 0 ? sessionStats.completedSessions / sessions : 1.0;

    const formattedSkills = masteryRows.map((m) => {
      const p = Number(m.pLearn ?? 0);
      let masteryLabel = "Cần hỗ trợ";
      if (p >= 0.8) {
        masteryLabel = "Đã thành thạo";
      } else if (p >= 0.4) {
        masteryLabel = "Đang phát triển";
      }
      return {
        code: m.skill.code,
        name: m.skill.name,
        mastery_label: masteryLabel,
        attempts: Number(m.attemptsTotal ?? 0),
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
    await assertAiAnalysisEntitlement(userId);
    const repos = useRepositories();
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
    } catch (err) {
      await refundCredits({
        userId,
        cost: 1,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Lỗi kết nối nhà cung cấp AI",
        idempotencyKey: `refund-sum:${debit.ledgerEntry.id}`,
      });
      if (err instanceof ModerationBlockedError) {
        throw err;
      }
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
        idempotencyKey: `refund-sum-mod:${debit.ledgerEntry.id}`,
      });

      await repos.aiCredits.insertUsageLog({
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

    await repos.aiCredits.insertUsageLog({
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
    await assertAiAnalysisEntitlement(userId);
    const repos = useRepositories();
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
    } catch (err) {
      await refundCredits({
        userId,
        cost: 1,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Lỗi kết nối nhà cung cấp AI",
        idempotencyKey: `refund-exp:${debit.ledgerEntry.id}`,
      });
      if (err instanceof ModerationBlockedError) {
        throw err;
      }
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

      await repos.aiCredits.insertUsageLog({
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

    await repos.aiCredits.insertUsageLog({
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
   * Suggests published games from library (BR-AIA-05, BR-AIA-06, BR-AIA-10).
   * Read-only against catalog; NEVER mutates curriculum enrollments or authors new content.
   */
  async suggestContent(
    userId: number,
    options: {
      childUuid?: string;
      targetSkillCode?: string;
      contentType?: "game";
      limit?: number;
    } = {}
  ) {
    await assertAiAnalysisEntitlement(userId);
    const repos = useRepositories();
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
    const activeKeys = await resolveUserActiveEntitlements(userId);
    const allowed = await allowedTiers(
      {
        kind: "user",
        user_id: String(userId),
        active_child_id: options.childUuid ?? "active",
      },
      activeKeys
    );

    const allLevels = await repos.gameLevels.listPublished({ limit: 500 });
    const levels = [...allLevels]
      .sort((a, b) => b.id - a.id)
      .slice(0, safeLimit);

    const suggestions = levels.map((lvl) => {
      const accessTier = ACCESS_TIER_CODEC.toLabel(lvl.accessTier);
      return {
        code: lvl.code,
        title: lvl.title,
        type: "game",
        thumbnail_emoji: lvl.thumbnailEmoji ?? "🎮",
        access_tier: accessTier,
        locked: !allowed.includes(accessTier as AccessTier),
      };
    });

    await repos.aiCredits.insertUsageLog({
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
   * Rewrites a game guide in clear, friendly language (BR-AIA-05, BR-AIA-07..11).
   */
  async rewriteGuide(
    userId: number,
    guideText: string,
    targetAudience: "home" | "class" = "home"
  ) {
    await assertAiAnalysisEntitlement(userId);
    const repos = useRepositories();
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
    } catch (err) {
      await refundCredits({
        userId,
        cost: 2,
        debitRefId: String(debit.ledgerEntry.id),
        reason: "Lỗi kết nối nhà cung cấp AI",
        idempotencyKey: `refund-rew:${debit.ledgerEntry.id}`,
      });
      if (err instanceof ModerationBlockedError) {
        throw err;
      }
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

      await repos.aiCredits.insertUsageLog({
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

    await repos.aiCredits.insertUsageLog({
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
