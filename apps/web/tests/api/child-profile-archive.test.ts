import { describe, expect, it } from "vitest";
import archiveHandler from "#server/api/users/children/[uuid]/archive.post";
import cancelDeleteHandler from "#server/api/users/children/[uuid]/delete/cancel.post";
import deleteChildHandler from "#server/api/users/children/[uuid]/index.delete";
import restoreHandler from "#server/api/users/children/[uuid]/restore.post";

function mockEvent(
  method: string,
  userId = 401,
  body: any = {},
  routerParams: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
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

describe("Child Profile Archive and Delete API (BR-CPR-01..08)", () => {
  it("BR-CPR-08: DELETE /api/users/children/{uuid} throws 404 for non-existent profile", async () => {
    const event = mockEvent(
      "DELETE",
      401,
      { password: "Password123!", confirm_name: "Bé Bo" },
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await deleteChildHandler(event);
      expect.fail("Should have thrown 404 NOT_FOUND");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
    }
  });

  it("POST /api/users/children/{uuid}/archive throws 404 for non-existent profile", async () => {
    const event = mockEvent(
      "POST",
      402,
      {},
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await archiveHandler(event);
      expect.fail("Should have thrown 404 NOT_FOUND");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
    }
  });

  it("POST /api/users/children/{uuid}/restore throws 404 for non-existent profile", async () => {
    const event = mockEvent(
      "POST",
      403,
      {},
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await restoreHandler(event);
      expect.fail("Should have thrown 404 NOT_FOUND");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
    }
  });

  it("POST /api/users/children/{uuid}/delete/cancel throws 404 for non-existent profile", async () => {
    const event = mockEvent(
      "POST",
      404,
      {},
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await cancelDeleteHandler(event);
      expect.fail("Should have thrown 404 NOT_FOUND");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
    }
  });
});
