import { createAdminManagerToken } from "@kidthink/auth";
import { auditLogs, getOwnerDb } from "@kidthink/db";

import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/audit-logs.get";

async function createAuthHeader(
  role: "super_admin" | "content_reviewer",
  managerId = 1
) {
  const token = await createAdminManagerToken({
    payload: {
      manager_id: managerId,
      display_name: "Manager Name",
      session_id: "sess_manager_123",
      refresh_token_version: 1,
      role,
    },
    secret: "kidthink-dev-secret-kidthink-dev-secret-32bytes",
  });
  return `Bearer ${token}`;
}

describe("Task 6 — GET /api/managers/audit-logs (BR-AUD-09)", () => {
  it("rejects unauthenticated request with 401", async () => {
    const event = {
      method: "GET",
      node: { req: { headers: {} }, res: {} },
      context: {},
    } as any;

    await expect(handler(event)).rejects.toThrow();
  });

  it("BR-AUD-09: rejects content_reviewer with 403 INSUFFICIENT_ROLE", async () => {
    const authHeader = await createAuthHeader("content_reviewer");
    const event = {
      method: "GET",
      node: {
        req: {
          headers: { authorization: authHeader },
        },
        res: {},
      },
      context: {},
    } as any;

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

    const authHeader = await createAuthHeader("super_admin");
    const event = {
      method: "GET",
      node: {
        req: {
          headers: { authorization: authHeader },
          url: `/api/managers/audit-logs?entity_id=${testEntityId}&limit=10`,
        },
        res: {},
      },
      context: {},
    } as any;

    const res = await handler(event);
    expect(res).toBeDefined();
    expect(res.items).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.items.some((item: any) => item.entityId === testEntityId)).toBe(
      true
    );
  });
});
