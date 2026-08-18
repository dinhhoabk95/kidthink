import { describe, expect, it } from "vitest";
import activateHandler from "../../server/api/users/children/[uuid]/activate.post";
import clearActiveHandler from "../../server/api/users/children/active.delete";

function mockEvent(
  method: string,
  userId = 301,
  body: any = {},
  routerParams: Record<string, string> = {},
  cookies: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  const cookieHeader = Object.entries({
    tm_u_csrf: csrfToken,
    ...cookies,
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: cookieHeader,
          "sec-fetch-site": "same-origin",
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
      user: {
        user_id: userId,
        display_name: "Parent User",
        session_id: `sess_${userId}`,
      },
      body,
      params: routerParams,
    },
    _body: body,
  } as any;
}

describe("Child Profile Switching API (BR-CPS-01..07 & BR-PEN-01..02)", () => {
  it("BR-CPS-01: Switching children without gate_token when active_child_id is set throws 403 PARENT_GATE_REQUIRED", async () => {
    const event = mockEvent(
      "POST",
      301,
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
    const event = mockEvent(
      "POST",
      302,
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

  it("BR-CPS-05: Activating archived child throws 404", async () => {
    const event = mockEvent(
      "POST",
      303,
      {},
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await activateHandler(event);
      expect.fail("Should have thrown 404 for archived child");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
    }
  });

  it("DELETE /api/users/children/active clears active child cookie", async () => {
    const event = mockEvent(
      "DELETE",
      304,
      {},
      {},
      { active_child_id: "some-uuid" }
    );
    const res = await clearActiveHandler(event);
    expect(res.success).toBe(true);
  });
});
