import { z } from "zod";

export const AI_FEATURE_COSTS = {
  report_summary: 1,
  report_explanation: 1,
  content_recommendation: 1,
  semantic_search: 1,
  instruction_rewrite: 2,
  lesson_plan_generation: 2,
} as const;

export const CREDIT_COST_MAP = AI_FEATURE_COSTS;

export type AiFeatureKey = keyof typeof AI_FEATURE_COSTS;

export const AI_CREDIT_REASONS = [
  "purchase",
  "usage",
  "manual_grant",
  "refund",
] as const;

export type AiCreditReason = (typeof AI_CREDIT_REASONS)[number];

export const LOW_CREDIT_WARNING_THRESHOLD_PERCENT = 0.2; // 20%
export const MIN_MANUAL_GRANT_REASON_LENGTH = 20;

export const manualGrantCreditsSchema = z
  .object({
    credits: z
      .number({ required_error: "Số lượng credit là bắt buộc." })
      .int("Số lượng credit phải là số nguyên.")
      .min(1, "Số lượng credit tối thiểu là 1.")
      .max(10_000, "Số lượng credit tối đa là 10.000 mỗi lần cấp."),
    grant_reason: z
      .string({ required_error: "Lý do cấp bù là bắt buộc." })
      .min(
        MIN_MANUAL_GRANT_REASON_LENGTH,
        `Lý do cấp bù bắt buộc tối thiểu ${MIN_MANUAL_GRANT_REASON_LENGTH} ký tự (BR-ACL-07).`
      ),
    notify_user: z.boolean().optional().default(true),
  })
  .strict();

export type ManualGrantCreditsInput = z.input<typeof manualGrantCreditsSchema>;

export const listCreditsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListCreditsQueryInput = z.infer<typeof listCreditsQuerySchema>;

export interface AiCreditTransactionItem {
  uuid: string;
  delta: number;
  reason: AiCreditReason;
  feature: string | null;
  created_at: string;
}

export interface AiCreditBalanceResponse {
  balance: number;
  total_granted: number;
  total_used: number;
  recent_transactions: AiCreditTransactionItem[];
}
