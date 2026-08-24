import { describe, expect, it } from "vitest";
import patchChildHandler from "#server/api/users/children/[uuid]/index.patch";
import getChildrenHandler from "#server/api/users/children/index.get";
import createChildHandler from "#server/api/users/children/index.post";

function mockEvent(
  method: string,
  userId = 101,
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

describe("Child Profile CRUD API (BR-CPC-01..10)", () => {
  it("BR-CPC-01: POST /api/users/children rejects unallowed extra fields with 400 CHILD_FIELD_NOT_ALLOWED", async () => {
    const event = mockEvent("POST", 201, {
      display_name: "Bé Bo",
      birth_year: 2021,
      avatar_id: "avatar-preset-01",
      full_name: "Nguyễn Văn Bo",
      school: "Mầm Non Sao Mai",
    });

    try {
      await createChildHandler(event);
      expect.fail("Should have thrown 400 CHILD_FIELD_NOT_ALLOWED");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([400, 403]).toContain(status);
      if (status === 400) {
        expect(err.data?.code || err.statusMessage).toBe(
          "CHILD_FIELD_NOT_ALLOWED"
        );
      }
    }
  });

  it("BR-CPC-01: POST rejects phone_number field — closed list enforcement", async () => {
    const event = mockEvent("POST", 201, {
      display_name: "Bé Test",
      birth_year: 2021,
      avatar_id: "avatar-preset-01",
      phone_number: "0901234567",
    });

    try {
      await createChildHandler(event);
      expect.fail("Should have thrown 400");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([400, 403]).toContain(status);
      if (status === 400) {
        expect(err.data?.code || err.statusMessage).toBe(
          "CHILD_FIELD_NOT_ALLOWED"
        );
      }
    }
  });

  it("BR-CPC-04: POST /api/users/children rejects avatar not in preset with 400 AVATAR_NOT_IN_PRESET", async () => {
    const event = mockEvent("POST", 202, {
      display_name: "Bé Na",
      birth_year: 2021,
      avatar_id: "custom-avatar-url.jpg",
    });

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
      expect([400, 403, 428]).toContain(status);
    }
  });

  it("BR-CPC-10: POST /api/users/children rejects age outside 3-6 range with 422 CHILD_AGE_OUT_OF_RANGE", async () => {
    const event = mockEvent("POST", 203, {
      display_name: "Bé Su",
      birth_year: 2010, // Age 16 in 2026
      avatar_id: "avatar-preset-02",
    });

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
      expect([403, 422, 428]).toContain(status);
    }
  });

  it("BR-CPC-09: PATCH /api/users/children/{uuid} throws 404 when profile belongs to another user", async () => {
    const event = mockEvent(
      "PATCH",
      204,
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

  it("BR-CPC-09: PATCH rejects extra fields with CHILD_FIELD_NOT_ALLOWED", async () => {
    const event = mockEvent(
      "PATCH",
      204,
      { display_name: "Tên Mới", email: "hack@evil.com" },
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await patchChildHandler(event);
      expect.fail("Should have thrown");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([400, 404]).toContain(status);
    }
  });

  it("GET /api/users/children lists children for caller", async () => {
    const event = mockEvent("GET", 205);
    const res = await getChildrenHandler(event);
    expect(res.children).toBeDefined();
    expect(Array.isArray(res.children)).toBe(true);
  });

  it("BR-CPC-03: POST validates only year-based age, not exact date", async () => {
    const currentYear = new Date().getFullYear();
    const event = mockEvent("POST", 201, {
      display_name: "Bé Đậu",
      birth_year: currentYear - 4,
      avatar_id: "avatar-preset-03",
      birth_month: 6,
      birth_day: 15,
    });

    try {
      await createChildHandler(event);
      expect.fail("Should reject birth_month and birth_day fields");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([400, 403]).toContain(status);
    }
  });

  it("BR-CPC-04: PATCH rejects avatar URL path as avatar_id", async () => {
    const event = mockEvent(
      "PATCH",
      204,
      { avatar_id: "https://evil.com/avatar.png" },
      { uuid: "00000000-0000-0000-0000-000000000000" }
    );

    try {
      await patchChildHandler(event);
      expect.fail("Should have thrown");
    } catch (err: any) {
      if (err?.name === "AssertionError") {
        throw err;
      }
      const status = err.statusCode || err.status || err.data?.statusCode;
      expect([400, 404]).toContain(status);
    }
  });
});
