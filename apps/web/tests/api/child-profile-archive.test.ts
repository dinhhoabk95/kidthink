import { createWebUserToken } from "@kidthink/auth";
import { describe, expect, it } from "vitest";
import archiveHandler from "../../server/api/users/children/[uuid]/archive.post";
import cancelDeleteHandler from "../../server/api/users/children/[uuid]/delete/cancel.post";
import deleteChildHandler from "../../server/api/users/children/[uuid]/index.delete";
import restoreHandler from "../../server/api/users/children/[uuid]/restore.post";

const JWT_SECRET =
  process.env.JWT_SECRET || "kidthink-dev-secret-kidthink-dev-secret-32bytes";

async function createAuthUserHeader(userId = 401) {
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
  routerParams: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method,
    node: {
      req: { headers, url: "/", originalUrl: "/" },
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

describe("Child Profile Archive and Delete API (BR-CPR-01..08)", () => {
  it("BR-CPR-08: DELETE /api/users/children/{uuid} throws 404 for non-existent profile", async () => {
    const authHeader = await createAuthUserHeader(401);
    const event = mockEvent(
      "DELETE",
      { authorization: authHeader },
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
    const authHeader = await createAuthUserHeader(402);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
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
    const authHeader = await createAuthUserHeader(403);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
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
    const authHeader = await createAuthUserHeader(404);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
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
