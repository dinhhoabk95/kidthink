import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  assertExportJobPageCount,
  EXPORT_JOB_KIND,
  EXPORT_JOB_STATUS,
  exportJobs,
  getOwnerDb,
  users,
} from "#src/index";

describe("Task P4.2 — Database Schema & Invariants Integration Tests (BR-PDF-01..09)", () => {
  const db = getOwnerDb();
  let testUserId: number;

  beforeEach(async () => {
    await db.delete(exportJobs);

    const [user] = await db
      .insert(users)
      .values({
        email: `teacher-pdf-${crypto.randomUUID()}@example.com`,
        passwordHash: "hash123",
        displayName: "Người Dùng PDF",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
    testUserId = user.id;
  });

  it("creates export_jobs row with default queued status, uuid, and user FK", async () => {
    const [job] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: EXPORT_JOB_KIND.CURRICULUM_PLAN,
        refId: "plan-uuid-12345",
      })
      .returning();

    expect(job?.id).toBeDefined();
    expect(job?.uuid).toBeDefined();
    expect(job?.userId).toBe(testUserId);
    expect(job?.kind).toBe(EXPORT_JOB_KIND.CURRICULUM_PLAN);
    expect(job?.refId).toBe("plan-uuid-12345");
    expect(job?.status).toBe(EXPORT_JOB_STATUS.QUEUED);
    expect(job?.filePath).toBeNull();
    expect(job?.pageCount).toBeNull();
    expect(job?.expiresAt).toBeNull();
    expect(job?.error).toBeNull();
  });

  it("[BR-PDF-05] enforces pageCount constraint (1 <= pageCount <= 20)", async () => {
    // Valid pageCount = 1
    const [jobValidMin] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: EXPORT_JOB_KIND.CURRICULUM_PLAN,
        refId: "plan-1",
        pageCount: 1,
      })
      .returning();
    expect(jobValidMin?.pageCount).toBe(1);

    // Valid pageCount = 20
    const [jobValidMax] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: EXPORT_JOB_KIND.CURRICULUM_PLAN,
        refId: "plan-20",
        pageCount: 20,
      })
      .returning();
    expect(jobValidMax?.pageCount).toBe(20);

    // Invalid pageCount = 0 or 21 -> throws domain validator error (BR-DM-14)
    expect(() => assertExportJobPageCount(0)).toThrow();
    expect(() => assertExportJobPageCount(21)).toThrow();
    expect(() => assertExportJobPageCount(1)).not.toThrow();
    expect(() => assertExportJobPageCount(20)).not.toThrow();
  });

  it("cascades deletion of export_jobs when user is deleted", async () => {
    const [job] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: EXPORT_JOB_KIND.CURRICULUM_PLAN,
        refId: "plan-del",
      })
      .returning();
    if (!job) {
      throw new Error("Failed to insert job");
    }

    expect(job.id).toBeDefined();

    // Delete user
    await db.delete(users).where(eq(users.id, testUserId));

    const remainingJobs = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, job.id));
    expect(remainingJobs.length).toBe(0);
  });
});
