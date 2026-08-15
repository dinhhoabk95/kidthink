import { z } from "zod";

export const ExportJobKindSchema = z.enum([
  "lesson_plan",
  "worksheet",
  "curriculum_plan",
]);

export type ExportJobKind = z.infer<typeof ExportJobKindSchema>;

export const ExportJobStatusSchema = z.enum([
  "queued",
  "processing",
  "done",
  "failed",
]);

export type ExportJobStatus = z.infer<typeof ExportJobStatusSchema>;

export const RequestExportSchema = z.object({
  kind: ExportJobKindSchema,
  ref_id: z.string().min(1, "Thiếu mã định danh tài liệu cần xuất."),
});

export type RequestExportInput = z.infer<typeof RequestExportSchema>;
