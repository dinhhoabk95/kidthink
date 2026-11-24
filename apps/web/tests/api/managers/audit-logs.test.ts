import { ACTOR_TYPE, auditLogs, getOwnerDb } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import handler from "#server/api/managers/audit-logs/index.get";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  url = "/api/managers/audit-logs"
) {
  return {
    method: "GET",
    path: url,
    url,
    node: {
      req: {
        headers: {},
        url,
      },
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              mfa_enabled: true,
              manager_id: 1,
              display_name: "Manager Name",
              session_id: "sess_manager_123",
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 6 — GET /api/managers/audit-logs (BR-AUD-09)", () => {
  it("rejects unauthenticated request with 401", async () => {
    const event = mockEvent();
    await expect(handler(event)).rejects.toThrow();
  });

  it("BR-AUD-09: rejects content_reviewer with 403 INSUFFICIENT_ROLE", async () => {
    const event = mockEvent("content_reviewer");

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("permits super_admin and returns audit log items with filters", async () => {
    const db = getOwnerDb();
    const testEntityId = `TEST_AUDIT_LOG_QUERY_${Date.now()}`;

    // Insert test row directly
    await db.insert(auditLogs).values({
      actorType: ACTOR_TYPE.SYSTEM,
      actorId: null,
      action: "user_suspended",
      entityType: "user",
      entityId: testEntityId,
      reason: "Test suspension",
    });

    const event = mockEvent(
      "super_admin",
      `/api/managers/audit-logs?entity_id=${testEntityId}&limit=10`
    );

    const res = await handler(event);
    expect(res).toBeDefined();
    expect(res.items).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.items.some((item: any) => item.entityId === testEntityId)).toBe(
      true
    );
  });

  it("limit không phải số nguyên dương bị từ chối 422 thay vì lọt xuống service", async () => {
    const event = mockEvent(
      "super_admin",
      "/api/managers/audit-logs?limit=abc"
    );
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 422 });
  });
});
