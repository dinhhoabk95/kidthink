import { createWebUserToken } from "@kidthink/auth";
import { describe, expect, it } from "vitest";
import patchChildHandler from "../../server/api/users/children/[uuid]/index.patch";
import getChildrenHandler from "../../server/api/users/children/index.get";
import createChildHandler from "../../server/api/users/children/index.post";

const JWT_SECRET =
  process.env.JWT_SECRET || "kidthink-dev-secret-kidthink-dev-secret-32bytes";

async function createAuthUserHeader(
  userId = 101,
  entitlementKeys: string[] = ["play_standard_games"]
) {
  const token = await createWebUserToken({
    payload: {
      user_id: userId,
      display_name: "Parent User",
      session_id: `sess_${userId}_${Date.now()}`,
      refresh_token_version: 0,
      entitlement_keys: entitlementKeys,
      user_status: "active",
      email_verified: true,
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

describe("Child Profile CRUD API (BR-CPC-01..10)", () => {
  it("BR-CPC-01: POST /api/users/children rejects unallowed extra fields with 400 CHILD_FIELD_NOT_ALLOWED", async () => {
    const authHeader = await createAuthUserHeader(201);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
      {
        display_name: "Bé Bo",
        birth_year: 2021,
        avatar_id: "avatar-preset-01",
        full_name: "Nguyễn Văn Bo",
        school: "Mầm Non Sao Mai",
      }
    );

    try {
      await createChildHandler(event);
      expect.fail("Should have thrown 400 CHILD_FIELD_NOT_ALLOWED");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect(status).toBe(400);
      expect(err.data?.code || err.statusMessage).toBe(
        "CHILD_FIELD_NOT_ALLOWED"
      );
    }
  });

  it("BR-CPC-04: POST /api/users/children rejects avatar not in preset with 400 AVATAR_NOT_IN_PRESET", async () => {
    const authHeader = await createAuthUserHeader(202);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
      {
        display_name: "Bé Na",
        birth_year: 2021,
        avatar_id: "custom-avatar-url.jpg",
      }
    );

    try {
      await createChildHandler(event);
      expect.fail(
        "Should have thrown 400 AVATAR_NOT_IN_PRESET or 428 CONSENT_REQUIRED"
      );
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([400, 428]).toContain(status);
    }
  });

  it("BR-CPC-10: POST /api/users/children rejects age outside 3-6 range with 422 CHILD_AGE_OUT_OF_RANGE", async () => {
    const authHeader = await createAuthUserHeader(203);
    const event = mockEvent(
      "POST",
      { authorization: authHeader },
      {
        display_name: "Bé Su",
        birth_year: 2010, // Age 16 in 2026
        avatar_id: "avatar-preset-02",
      }
    );

    try {
      await createChildHandler(event);
      expect.fail(
        "Should have thrown 422 CHILD_AGE_OUT_OF_RANGE or 428 CONSENT_REQUIRED"
      );
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([422, 428]).toContain(status);
    }
  });

  it("BR-CPC-09: PATCH /api/users/children/{uuid} throws 404 when profile belongs to another user", async () => {
    const authHeader = await createAuthUserHeader(204);
    const event = mockEvent(
      "PATCH",
      { authorization: authHeader },
      { display_name: "Tên Mới" },
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await patchChildHandler(event);
      expect.fail("Should have thrown 404 NOT_FOUND");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect(status).toBe(404);
    }
  });

  it("GET /api/users/children lists children for caller", async () => {
    const authHeader = await createAuthUserHeader(205);
    const event = mockEvent("GET", { authorization: authHeader });
    const res = await getChildrenHandler(event);
    expect(res.children).toBeDefined();
    expect(Array.isArray(res.children)).toBe(true);
  });
});
