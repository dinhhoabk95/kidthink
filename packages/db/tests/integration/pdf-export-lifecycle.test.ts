import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  exportJobs,
  getExportJobByUuid,
  getOwnerDb,
  getUserMonthlyExportCount,
  lessonPlanItems,
  lessonPlans,
  MONTHLY_PDF_EXPORT_QUOTA,
  processPdfRenderJob,
  requestExportJob,
  runPdfCleanupJob,
  users,
} from "../../src/index.ts";

describe("Task P4.2 — PDF Export Lifecycle Integration Tests (BR-PDF-01..09)", () => {
  const db = getOwnerDb();
  let testUserId: number;
  let testPlanUuid: string;

  beforeEach(async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `teacher-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        passwordHash: "hash123",
        displayName: "Cô Giáo Lifecycle",
      })
      .returning();
    testUserId = user.id;

    const [plan] = await db
      .insert(lessonPlans)
      .values({
        userId: testUserId,
        title: "Bài học đếm quả táo và phân loại hình",
        targetAge: 4,
        estimatedMinutes: 30,
        notes: "Ghi chú chuẩn bị đồ dùng",
        version: 1,
      })
      .returning();
    testPlanUuid = plan.uuid;

    await db.insert(lessonPlanItems).values([
      {
        lessonPlanId: plan.id,
        position: 0,
        itemType: "activity",
        itemCode: "ACT-COUNT",
        snapshot: {
          title: "Hoạt động khởi động",
          duration_minutes: 15,
          description: "Giáo viên hướng dẫn trẻ đếm 1-5",
          child_prompts: ["Có mấy quả táo?"],
        },
      },
      {
        lessonPlanId: plan.id,
        position: 1,
        itemType: "game_level",
        itemCode: "GL-01",
        snapshot: {
          title: "Trò chơi tư duy",
          duration_minutes: 15,
          description: "Ghép hình tương ứng",
        },
      },
    ]);
  });

  it("[BR-PDF-01] Khởi tạo yêu cầu xuất PDF trả về 202 queued và ghi nhận job", async () => {
    const res = await requestExportJob(
      testUserId,
      "lesson_plan",
      testPlanUuid,
      {
        userEntitlements: ["export_pdf", "create_lesson_plan"],
      }
    );

    expect(res.job_uuid).toBeDefined();
    expect(res.status).toBe("queued");

    const [jobInDb] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.uuid, res.job_uuid));

    expect(jobInDb).toBeDefined();
    expect(jobInDb.status).toBe("queued");
    expect(jobInDb.userId).toBe(testUserId);
    expect(jobInDb.refId).toBe(testPlanUuid);
  });

  it("[BR-PDF-02] Từ chối khi thiếu entitlement export_pdf", async () => {
    let error: any;
    try {
      await requestExportJob(testUserId, "lesson_plan", testPlanUuid, {
        userEntitlements: ["create_lesson_plan"], // missing export_pdf
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe("ENTITLEMENT_REQUIRED");
  });

  it("[BR-PDF-02] Kiểm soát quota tối đa 20 lượt xuất trong tháng", async () => {
    // Seed 20 completed jobs in current month
    for (let i = 0; i < MONTHLY_PDF_EXPORT_QUOTA; i++) {
      await db.insert(exportJobs).values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: testPlanUuid,
        status: "done",
        pageCount: 2,
        createdAt: new Date(),
      });
    }

    const currentUsage = await getUserMonthlyExportCount(testUserId, db);
    expect(currentUsage).toBe(20);

    // 21st attempt must throw QUOTA_EXCEEDED
    let error: any;
    try {
      await requestExportJob(testUserId, "lesson_plan", testPlanUuid, {
        userEntitlements: ["export_pdf"],
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe("QUOTA_EXCEEDED");
  });

  it("[BR-PDF-01, 03, 08] Worker render hoàn tất cập nhật status done, số trang, signed URL và hạn 7 ngày", async () => {
    const initRes = await requestExportJob(
      testUserId,
      "lesson_plan",
      testPlanUuid,
      {
        userEntitlements: ["export_pdf"],
      }
    );

    // Run worker process
    const renderRes = await processPdfRenderJob(initRes.job_uuid);
    expect(renderRes.success).toBe(true);
    expect(renderRes.pageCount).toBeGreaterThanOrEqual(1);
    expect(renderRes.pageCount).toBeLessThanOrEqual(20);
    expect(renderRes.filePath).toContain(
      `exports/${testUserId}/${initRes.job_uuid}.pdf`
    );

    // Query status via getExportJobByUuid
    const jobStatus = await getExportJobByUuid(testUserId, initRes.job_uuid);
    expect(jobStatus.status).toBe("done");
    expect(jobStatus.page_count).toBe(renderRes.pageCount);
    expect(jobStatus.download_url).toBeDefined();
    expect(jobStatus.download_url).toContain("/private/exports%2F");
    expect(jobStatus.download_url).toContain("expires=");
    expect(jobStatus.download_url).toContain("signature=");

    // Check retention is 7 days in future (BR-PDF-08)
    const sevenDaysFromNow = Date.now() + 6.9 * 24 * 60 * 60 * 1000;
    expect(jobStatus.expires_at?.getTime()).toBeGreaterThan(sevenDaysFromNow);
  });

  it("[BR-PDF-09] Khi render thất bại, cập nhật status failed và tự động hoàn quota", async () => {
    // Insert a job pointing to a non-existent plan refId
    const [brokenJob] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "99999999-9999-9999-9999-999999999999",
        status: "queued",
      })
      .returning();

    // Worker fails to process
    await expect(processPdfRenderJob(brokenJob.uuid)).rejects.toThrow();

    const [updatedJob] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, brokenJob.id));

    expect(updatedJob.status).toBe("failed");
    expect(updatedJob.error).toBeDefined();

    // Verify failed jobs do not count towards monthly quota (BR-PDF-09 / refund)
    const usage = await getUserMonthlyExportCount(testUserId, db);
    expect(usage).toBe(0);
  });

  it("[BR-PDF-08] runPdfCleanupJob dọn dẹp các file PDF đã hết hạn", async () => {
    // Insert an expired job (created 8 days ago, expired yesterday)
    const pastDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const expiredAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const [expiredJob] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: testPlanUuid,
        status: "done",
        filePath: `exports/${testUserId}/expired-job.pdf`,
        pageCount: 2,
        createdAt: pastDate,
        expiresAt: expiredAt,
      })
      .returning();

    const cleanupRes = await runPdfCleanupJob();
    expect(cleanupRes.cleanedCount).toBeGreaterThanOrEqual(1);

    const [cleanedJob] = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, expiredJob.id));

    expect(cleanedJob.filePath).toBeNull();
  });
});
