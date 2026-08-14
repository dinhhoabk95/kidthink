import { auditLogs, getOwnerDb } from "@kidthink/db";
import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/audit-logs.get";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  url = "/api/managers/audit-logs"
) {
  return {
    method: "GET",
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
              manager_id: 1,
              display_name: "Manager Name",
              session_id: "sess_manager_123",
              refresh_token_version: 1,
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

    try {
      await handler(event);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("permits super_admin and returns audit log items with filters", async () => {
    const db = getOwnerDb();
    const testEntityId = `TEST_AUDIT_LOG_QUERY_${Date.now()}`;

    // Insert test row directly
    await db.insert(auditLogs).values({
      actorType: "system",
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
});
