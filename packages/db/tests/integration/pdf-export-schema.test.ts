import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { exportJobs, getOwnerDb, users } from "../../src/index.ts";

describe("Task P4.2 — Database Schema & Invariants Integration Tests (BR-PDF-01..09)", () => {
  const db = getOwnerDb();
  let testUserId: number;

  beforeEach(async () => {
    await db.delete(exportJobs);

    const [user] = await db
      .insert(users)
      .values({
        email: `teacher-pdf-${Date.now()}@example.com`,
        passwordHash: "hash123",
        displayName: "Người Dùng PDF",
      })
      .returning();
    testUserId = user.id;
  });

  it("creates export_jobs row with default queued status, uuid, and user FK", async () => {
    const [job] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "plan-uuid-12345",
      })
      .returning();

    expect(job.id).toBeDefined();
    expect(job.uuid).toBeDefined();
    expect(job.userId).toBe(testUserId);
    expect(job.kind).toBe("lesson_plan");
    expect(job.refId).toBe("plan-uuid-12345");
    expect(job.status).toBe("queued");
    expect(job.filePath).toBeNull();
    expect(job.pageCount).toBeNull();
    expect(job.expiresAt).toBeNull();
    expect(job.error).toBeNull();
  });

  it("[BR-PDF-05] enforces pageCount constraint (1 <= pageCount <= 20)", async () => {
    // Valid pageCount = 1
    const [jobValidMin] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "plan-1",
        pageCount: 1,
      })
      .returning();
    expect(jobValidMin.pageCount).toBe(1);

    // Valid pageCount = 20
    const [jobValidMax] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "plan-20",
        pageCount: 20,
      })
      .returning();
    expect(jobValidMax.pageCount).toBe(20);

    // Invalid pageCount = 0 -> throws check constraint violation
    await expect(
      db.insert(exportJobs).values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "plan-0",
        pageCount: 0,
      })
    ).rejects.toThrow();

    // Invalid pageCount = 21 -> throws check constraint violation
    await expect(
      db.insert(exportJobs).values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "plan-21",
        pageCount: 21,
      })
    ).rejects.toThrow();
  });

  it("cascades deletion of export_jobs when user is deleted", async () => {
    const [job] = await db
      .insert(exportJobs)
      .values({
        userId: testUserId,
        kind: "lesson_plan",
        refId: "plan-del",
      })
      .returning();

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
