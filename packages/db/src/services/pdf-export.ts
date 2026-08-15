import { appError } from "@kidthink/auth";
import { enqueue } from "@kidthink/queue";
import { storage } from "@kidthink/storage";
import { and, count, eq, gte, isNotNull, lte, ne } from "drizzle-orm";
import { getDb } from "../client.ts";
import { exportJobs } from "../schema/exports.ts";
import { notificationDeliveries, notifications } from "../schema/ops.ts";
import { writeAudit } from "./audit.ts";
import { getLessonPlanByUuid } from "./lesson-plan.ts";
import {
  type LessonPlanExportDTO,
  renderLessonPlanPdf,
} from "./pdf-renderer.ts";

export const MONTHLY_PDF_EXPORT_QUOTA = 20;

export interface RequestExportJobOptions {
  userEntitlements?: string[];
}

export interface ExportJobResultDTO {
  uuid: string;
  kind: "lesson_plan" | "worksheet" | "curriculum_plan";
  ref_id: string;
  status: "queued" | "processing" | "done" | "failed";
  file_path: string | null;
  page_count: number | null;
  download_url: string | null;
  expires_at: Date | null;
  error: string | null;
  created_at: Date;
}

/**
 * Returns the start of the current month in ICT timezone (UTC+7).
 */
export function getIctMonthStart(date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const ictDate = new Date(utc + 7 * 3_600_000);
  const startOfMonthIct = new Date(
    Date.UTC(ictDate.getUTCFullYear(), ictDate.getUTCMonth(), 1, 0, 0, 0)
  );
  // Convert back to UTC timestamp corresponding to 00:00 ICT
  return new Date(startOfMonthIct.getTime() - 7 * 3_600_000);
}

/**
 * Counts successful or in-progress export jobs for this user in the current month (BR-PDF-02).
 */
export async function getUserMonthlyExportCount(
  userId: number,
  db = getDb()
): Promise<number> {
  const monthStart = getIctMonthStart();

  const [result] = await db
    .select({
      total: count(exportJobs.id),
    })
    .from(exportJobs)
    .where(
      and(
        eq(exportJobs.userId, userId),
        ne(exportJobs.status, "failed"),
        gte(exportJobs.createdAt, monthStart)
      )
    );

  return result?.total ?? 0;
}

/**
 * Initiates an export job and enqueues background processing (BR-PDF-01, BR-PDF-02).
 */
export async function requestExportJob(
  userId: number,
  kind: "lesson_plan" | "worksheet" | "curriculum_plan",
  refId: string,
  options?: RequestExportJobOptions
): Promise<{ job_uuid: string; status: "queued" }> {
  const db = getDb();
  const entitlements = options?.userEntitlements ?? [
    "create_lesson_plan",
    "export_pdf",
  ];

  // 1. Entitlement check
  if (!entitlements.includes("export_pdf")) {
    throw appError("ENTITLEMENT_REQUIRED", {
      required_entitlement: "export_pdf",
      message: "Tài khoản cần có quyền xuất PDF (add-on).",
    });
  }

  // 2. Monthly Quota check (BR-PDF-02)
  const currentUsage = await getUserMonthlyExportCount(userId, db);
  if (currentUsage >= MONTHLY_PDF_EXPORT_QUOTA) {
    throw appError("QUOTA_EXCEEDED", {
      quota_key: "pdf_exports_per_month",
      current_usage: currentUsage,
      limit: MONTHLY_PDF_EXPORT_QUOTA,
      message: `Đã đạt giới hạn tối đa ${MONTHLY_PDF_EXPORT_QUOTA} lượt xuất PDF trong tháng này.`,
    });
  }

  // 3. Verify refId exists and belongs to user (for lesson_plan)
  if (kind === "lesson_plan") {
    // Throws NOT_FOUND if not found or belongs to another user
    await getLessonPlanByUuid(userId, refId);
  }

  // 4. Reserve quota & insert queued export job
  const [createdJob] = await db
    .insert(exportJobs)
    .values({
      userId,
      kind,
      refId,
      status: "queued",
    })
    .returning();

  if (!createdJob) {
    throw new Error("Không thể khởi tạo tiến trình xuất PDF.");
  }

  // 5. Enqueue background job (BR-PDF-01)
  try {
    await enqueue(
      "pdf:render",
      {
        exportJobUuid: createdJob.uuid,
        userId,
        kind,
        refId,
      },
      {
        jobId: `pdf:render:${createdJob.uuid}`,
      }
    );
  } catch (error) {
    // If enqueue fails, mark job failed immediately so quota is refunded (BR-PDF-09)
    await db
      .update(exportJobs)
      .set({
        status: "failed",
        error: "Không thể đưa job vào hàng đợi xử lý.",
        updatedAt: new Date(),
      })
      .where(eq(exportJobs.id, createdJob.id));
    throw error;
  }

  return {
    job_uuid: createdJob.uuid,
    status: "queued",
  };
}

/**
 * Retrieves export job status and generates a signed URL if completed (BR-PDF-03).
 */
export async function getExportJobByUuid(
  userId: number,
  jobUuid: string
): Promise<ExportJobResultDTO> {
  const db = getDb();
  const [job] = await db
    .select()
    .from(exportJobs)
    .where(and(eq(exportJobs.uuid, jobUuid), eq(exportJobs.userId, userId)))
    .limit(1);

  if (!job) {
    // IDOR protection: returns 404 if not found or not owner
    throw appError("NOT_FOUND", "Không tìm thấy yêu cầu xuất file.");
  }

  let downloadUrl: string | null = null;
  if (job.status === "done" && job.filePath) {
    // Check expiration (BR-PDF-08)
    if (job.expiresAt && new Date() > job.expiresAt) {
      throw appError(
        "TOKEN_EXPIRED",
        "File xuất PDF đã hết hạn lưu trữ (7 ngày)."
      );
    }
    // Generate signed URL with TTL 60 minutes (3600 seconds) (BR-PDF-03)
    downloadUrl = storage.signedUrl(job.filePath, 3600);
  }

  return {
    uuid: job.uuid,
    kind: job.kind as "lesson_plan" | "worksheet" | "curriculum_plan",
    ref_id: job.refId,
    status: job.status as "queued" | "processing" | "done" | "failed",
    file_path: job.filePath,
    page_count: job.pageCount,
    download_url: downloadUrl,
    expires_at: job.expiresAt,
    error: job.error,
    created_at: job.createdAt,
  };
}

/**
 * Worker processor for rendering and storing the PDF (BR-PDF-01..09).
 */
export async function processPdfRenderJob(
  jobUuid: string
): Promise<{ success: boolean; filePath?: string; pageCount?: number }> {
  const db = getDb();
  const [job] = await db
    .select()
    .from(exportJobs)
    .where(eq(exportJobs.uuid, jobUuid))
    .limit(1);

  if (!job) {
    return { success: false };
  }

  // Idempotency: skip if already terminal state
  if (job.status === "done") {
    return {
      success: true,
      filePath: job.filePath ?? undefined,
      pageCount: job.pageCount ?? undefined,
    };
  }
  if (job.status === "failed") {
    return { success: false };
  }

  // Set processing
  await db
    .update(exportJobs)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(exportJobs.id, job.id));

  try {
    let pdfBuffer: Buffer;
    let pageCount: number;
    let documentTitle = "Tài liệu";

    if (job.kind === "lesson_plan") {
      const planDetail = await getLessonPlanByUuid(job.userId, job.refId);
      documentTitle = planDetail.title;

      const renderResult = renderLessonPlanPdf(
        planDetail as unknown as LessonPlanExportDTO
      );
      pdfBuffer = renderResult.pdfBuffer;
      pageCount = renderResult.pageCount;
    } else {
      throw new Error(`Loại xuất ${job.kind} chưa được hỗ trợ renderer.`);
    }

    // Upload to private storage
    const storageKey = `exports/${job.userId}/${job.uuid}.pdf`;
    const uploadResult = await storage.uploadPrivateAsset({
      key: storageKey,
      body: pdfBuffer,
      contentType: "application/pdf",
    });

    // 7 days retention (BR-PDF-08)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      await tx
        .update(exportJobs)
        .set({
          status: "done",
          filePath: uploadResult.path,
          pageCount,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(exportJobs.id, job.id));

      // In-app Notification (BR-PDF-09)
      const [notif] = await tx
        .insert(notifications)
        .values({
          recipientType: "user",
          recipientId: job.userId,
          templateCode: "pdf_export_ready",
          payload: {
            title: documentTitle,
            job_uuid: job.uuid,
            page_count: pageCount,
          },
        })
        .returning();

      if (notif) {
        await tx.insert(notificationDeliveries).values({
          notificationId: notif.id,
          channel: "in_app",
          status: "dispatched",
        });
      }

      await writeAudit(tx, {
        actor_type: "user",
        actor_id: job.userId,
        action: "content_created",
        entity_type: "export_job",
        entity_id: job.uuid,
        after_data: {
          job_uuid: job.uuid,
          kind: job.kind,
          page_count: pageCount,
          file_path: uploadResult.path,
        },
        reason: "Xuất file PDF thành công",
      });
    });

    return {
      success: true,
      filePath: uploadResult.path,
      pageCount,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi trong quá trình xuất PDF.";

    await db.transaction(async (tx) => {
      // Mark failed -> this automatically refunds the quota for user (BR-PDF-02, BR-PDF-09)
      await tx
        .update(exportJobs)
        .set({
          status: "failed",
          error: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(exportJobs.id, job.id));

      const [notif] = await tx
        .insert(notifications)
        .values({
          recipientType: "user",
          recipientId: job.userId,
          templateCode: "pdf_export_failed",
          payload: {
            title: "Giáo án",
            error: errorMessage,
            job_uuid: job.uuid,
          },
        })
        .returning();

      if (notif) {
        await tx.insert(notificationDeliveries).values({
          notificationId: notif.id,
          channel: "in_app",
          status: "dispatched",
        });
      }

      await writeAudit(tx, {
        actor_type: "user",
        actor_id: job.userId,
        action: "data_exported",
        entity_type: "export_job",
        entity_id: job.uuid,
        after_data: {
          job_uuid: job.uuid,
          status: "failed",
          error: errorMessage,
        },
        reason: "Xuất PDF thất bại và hoàn quota",
      });
    });

    throw error;
  }
}

/**
 * Sweeper job to clean up expired PDF export files after 7 days (BR-PDF-08).
 */
export async function runPdfCleanupJob(): Promise<{
  cleanedCount: number;
}> {
  const db = getDb();
  const now = new Date();

  const expiredJobs = await db
    .select()
    .from(exportJobs)
    .where(
      and(
        lte(exportJobs.expiresAt, now),
        isNotNull(exportJobs.filePath),
        ne(exportJobs.filePath, "")
      )
    );

  let cleanedCount = 0;

  for (const job of expiredJobs) {
    if (job.filePath) {
      storage.deletePrivateAsset(job.filePath);
      await db
        .update(exportJobs)
        .set({
          filePath: null,
          updatedAt: new Date(),
        })
        .where(eq(exportJobs.id, job.id));
      cleanedCount++;
    }
  }

  return { cleanedCount };
}
