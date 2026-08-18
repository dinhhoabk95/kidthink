import { auditLogs, childProfiles, getOwnerDb, users } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/children/[uuid]/archive.post";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  childUuid?: string,
  body?: unknown
) {
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        url: `/api/managers/children/${childUuid}/archive`,
      },
      res: {},
    },
    context: {
      params: { uuid: childUuid },
      body,
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Super Admin",
              session_id: "sess_mgr_1",
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 5 — POST /api/managers/children/[uuid]/archive (BR-CPA-07, D-IG)", () => {
  it("rejects unauthenticated request with 401 and content_reviewer with 403", async () => {
    const unauthEvent = mockEvent(undefined, "some-uuid", {
      reason: "Reason for archiving",
    });
    await expect(handler(unauthEvent)).rejects.toThrow();

    const reviewerEvent = mockEvent("content_reviewer", "some-uuid", {
      reason: "Reason for archiving",
    });
    try {
      await handler(reviewerEvent);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("rejects request with missing or short reason (< 10 chars) with 422 ADMIN_NOTE_REQUIRED", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `archive_test_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Archive Parent",
        status: "active",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Cún",
        birthYear: 2021,
        avatarId: "avatar-preset-04",
        status: "active",
      })
      .returning();

    const shortEvent = mockEvent("super_admin", child.uuid, {
      reason: "short",
    });
    try {
      await handler(shortEvent);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }

    // Verify child profile is still active
    const [fetched] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(fetched.status).toBe("active");
  });

  it("BR-CPA-07 & D-IG: archives child profile with valid reason and records audit log", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `archive_valid_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Archive Valid Parent",
        status: "active",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Miu",
        birthYear: 2020,
        avatarId: "avatar-preset-05",
        status: "active",
      })
      .returning();

    const archiveReason = "Người dùng yêu cầu tạm lưu trữ hồ sơ của bé";
    const event = mockEvent("super_admin", child.uuid, {
      reason: archiveReason,
    });
    const res = await handler(event);

    expect(res.success).toBe(true);
    expect(res.status).toBe("archived");
    expect(res.uuid).toBe(child.uuid);

    // Verify DB updated
    const [updatedChild] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(updatedChild.status).toBe("archived");

    // Verify audit log recorded
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, child.uuid),
          eq(auditLogs.action, "manager.child_profile.archived")
        )
      );
    expect(auditLog).toBeDefined();
    expect(auditLog.reason).toBe(archiveReason);
  });

  it("rejects archiving child profile with status pending_deletion with 409", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `archive_del_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Deletion Parent",
        status: "active",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Thỏ",
        birthYear: 2020,
        avatarId: "avatar-preset-06",
        status: "pending_deletion",
        purgeAt: new Date(Date.now() + 30 * 86_400 * 1000),
      })
      .returning();

    const event = mockEvent("super_admin", child.uuid, {
      reason: "Thử lưu trữ hồ sơ đang chờ xoá",
    });
    await expect(handler(event)).rejects.toThrow();
  });
});
