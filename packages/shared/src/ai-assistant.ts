import { z } from "zod";

export const DEFAULT_COMPLETION_MODEL = "claude-3-5-sonnet-20241022";
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_DIMENSION = 1536;

export const PROMPT_VERSIONS = {
  report_summary: "v1.0",
  report_explanation: "v1.0",
  content_recommendation: "v1.0",
  instruction_rewrite: "v1.0",
  "summarize-report": "v1.0",
  "explain-report": "v1.0",
  "suggest-content": "v1.0",
  "rewrite-guide": "v1.0",
} as const;

export const AI_SUGGESTION_LABEL = "Gợi ý";

export const aiEgressReportSkillSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  mastery_label: z.string().min(1),
  attempts: z.number().int().min(0),
});

export const aiEgressReportTotalsSchema = z.object({
  sessions: z.number().int().min(0),
  minutes: z.number().int().min(0),
  completion_rate: z.number().min(0).max(1),
});

/**
 * Closed allow-list schema for AI report egress payload (BR-AIA-01, BR-AIA-02, BR-CDC-06).
 * NEVER includes child_uuid, display_name, birth_year, user_id, or raw telemetry.
 */
export const aiEgressReportPayloadSchema = z.object({
  age_band: z.enum(["3-4", "4-5", "5-6"]),
  skills: z.array(aiEgressReportSkillSchema).min(1),
  period_days: z.number().int().min(1).max(365),
  totals: aiEgressReportTotalsSchema,
});

export type AiEgressReportSkill = z.infer<typeof aiEgressReportSkillSchema>;
export type AiEgressReportTotals = z.infer<typeof aiEgressReportTotalsSchema>;
export type AiEgressReportPayload = z.infer<typeof aiEgressReportPayloadSchema>;

export const summarizeReportInputSchema = z.object({
  child_uuid: z.string().uuid("child_uuid phải là định dạng UUID hợp lệ."),
  period_days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type SummarizeReportInput = z.infer<typeof summarizeReportInputSchema>;

export const explainReportInputSchema = z.object({
  child_uuid: z.string().uuid("child_uuid phải là định dạng UUID hợp lệ."),
  period_days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type ExplainReportInput = z.infer<typeof explainReportInputSchema>;

export const suggestContentInputSchema = z.object({
  child_uuid: z
    .string()
    .uuid("child_uuid phải là định dạng UUID hợp lệ.")
    .optional(),
  target_skill_code: z.string().optional(),
  content_type: z.enum(["game", "lesson"]).optional().default("game"),
  limit: z.coerce.number().int().min(1).max(10).optional().default(5),
});

export type SuggestContentInput = z.infer<typeof suggestContentInputSchema>;

export const rewriteGuideInputSchema = z.object({
  guide_text: z
    .string({ required_error: "Văn bản hướng dẫn là bắt buộc." })
    .min(10, "Văn bản hướng dẫn phải có tối thiểu 10 ký tự.")
    .max(3000, "Văn bản hướng dẫn không được vượt quá 3000 ký tự."),
  target_audience: z.enum(["parent", "teacher"]).optional().default("parent"),
});

export type RewriteGuideInput = z.infer<typeof rewriteGuideInputSchema>;

export interface AiCompletionResult {
  text: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costUsdMicros: number;
}
