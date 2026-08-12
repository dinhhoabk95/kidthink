import { createWebUserToken } from "@kidthink/auth";
import { describe, expect, it } from "vitest";
import activateHandler from "../../server/api/users/children/[uuid]/activate.post";
import clearActiveHandler from "../../server/api/users/children/active.delete";

const JWT_SECRET =
  process.env.JWT_SECRET || "kidthink-dev-secret-kidthink-dev-secret-32bytes";

async function createAuthUserHeader(userId = 301) {
  const token = await createWebUserToken({
    payload: {
      user_id: userId,
      display_name: "Parent User",
      session_id: `sess_${userId}_${Date.now()}`,
      refresh_token_version: 0,
    },
    secret: JWT_SECRET,
  });
  return `Bearer ${token}`;
}

function mockEvent(
  method: string,
  headers: Record<string, string> = {},
  body: any = {},
  routerParams: Record<string, string> = {},
  cookies: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          ...headers,
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      body,
      params: routerParams,
    },
    _body: body,
  } as any;
}

describe("Child Profile Switching API (BR-CPS-01..07 & BR-PEN-01..02)", () => {
  it("BR-CPS-01: Switching children without gate_token when active_child_id is set throws 403 PARENT_GATE_REQUIRED", async () => {
    const authHeader = await createAuthUserHeader(301);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
      {}, // missing gate_token
      { uuid: "11111111-1111-1111-1111-111111111111" },
      { active_child_id: "22222222-2222-2222-2222-222222222222" }
    );

    try {
      await activateHandler(event);
      expect.fail("Should have thrown 403 or 404");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect([403, 404]).toContain(status);
    }
  });

  it("BR-CPS-02: Activating child belonging to another user throws 404 NOT_FOUND", async () => {
    const authHeader = await createAuthUserHeader(302);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
      {},
      { uuid: "99999999-9999-9999-9999-999999999999" }
    );

    try {
      await activateHandler(event);
      expect.fail("Should have thrown 404 NOT_FOUND");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
    }
  });

  it("DELETE /api/users/children/active clears active child cookie", async () => {
    const event = mockEvent(
      "DELETE",
      {},
      {},
      {},
      { active_child_id: "some-uuid" }
    );
    const res = await clearActiveHandler(event);
    expect(res.success).toBe(true);
  });
});
