import { createAdminManagerToken } from "@kidthink/auth";
import { describe, expect, it } from "vitest";
import guestTemplatesHandler from "../../server/api/guest/templates.get.js";
import managerContractHandler from "../../server/api/managers/templates/[code]/contract.get.js";
import createTemplateHandler from "../../server/api/managers/templates.post.js";

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

function mockEvent(
  method: string,
  headers: Record<string, string> = {},
  params: Record<string, string> = {}
) {
  return {
    method,
    node: {
      req: { headers },
      res: {},
    },
    context: {
      params,
    },
  } as any;
}

describe("Game Template API Endpoints (BR-GTC-04, spec §8)", () => {
  it("GET /api/guest/templates returns metadata without raw contracts for all 6 MVP templates", async () => {
    const event = mockEvent("GET");
    const res = (await guestTemplatesHandler(event)) as any;

    expect(res.templates).toBeDefined();
    expect(res.templates.length).toBe(6);
    expect(res.templates[0]).toHaveProperty("code");
    expect(res.templates[0]).toHaveProperty("name_vi");
    expect(res.templates[0]).toHaveProperty("mechanic");
    expect(res.templates[0]).not.toHaveProperty("content_contract");
  });

  it("POST /api/managers/templates returns 405 METHOD_NOT_ALLOWED (BR-GTC-04)", async () => {
    const event = mockEvent("POST");
    try {
      await createTemplateHandler(event);
      expect.fail("Should have thrown 405");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(405);
    }
  });

  it("GET /api/managers/templates/[code]/contract rejects unauthenticated request", async () => {
    const event = mockEvent("GET", {}, { code: "GT-001" });
    await expect(managerContractHandler(event)).rejects.toThrow();
  });

  it("GET /api/managers/templates/[code]/contract returns 422 for unknown code", async () => {
    const authHeader = await createAuthHeader("content_reviewer");
    const event = mockEvent(
      "GET",
      { authorization: authHeader },
      { code: "GT-999" }
    );

    try {
      await managerContractHandler(event);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("GET /api/managers/templates/[code]/contract returns exported contracts for manager", async () => {
    const authHeader = await createAuthHeader("content_reviewer");
    const event = mockEvent(
      "GET",
      { authorization: authHeader },
      { code: "GT-001" }
    );

    const res = (await managerContractHandler(event)) as any;
    expect(res.code).toBe("GT-001");
    expect(res.content_contract_json_schema).toBeDefined();
    expect(res.difficulty_contract_json_schema).toBeDefined();
    expect(res.limits).toBeDefined();
  });
});
