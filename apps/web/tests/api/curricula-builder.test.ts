import { curricula, getOwnerDb, managers } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import getCurriculaHandler from "#server/api/managers/curricula/index.get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testManagerId = 1;

beforeEach(async () => {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "curriculum-tester@mindkid.edu.vn"));

  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "curriculum-tester@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Curriculum Tester",
        role: "super_admin",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: managers.email,
        set: { displayName: "Curriculum Tester" },
      })
      .returning({ id: managers.id });
  }
  if (mgr) {
    testManagerId = mgr.id;
  }
});

function mockEvent(
  method: string,
  managerRole?: "super_admin" | "content_reviewer",
  params: Record<string, string> = {},
  body?: Record<string, string>,
  query: Record<string, string> = {}
) {
  const headersMap: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        setHeader: (k: string, v: string) => {
          headersMap[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headersMap[k.toLowerCase()],
      },
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              id: testManagerId,
              manager_id: testManagerId,
              display_name: "Manager Tester",
              session_id: "sess_manager_123",
              role: managerRole,
            },
          }
        : {}),
      params,
      body,
    },
    query,
    _body: body,
  };
}

describe("Curriculum Catalog API Endpoints", () => {
  it("rejects unauthenticated requests", async () => {
    const event = mockEvent("GET");
    await expect(
      getCurriculaHandler(event as Parameters<typeof getCurriculaHandler>[0])
    ).rejects.toThrow();
  });

  it("GET /api/managers/curricula lists and filters curricula", async () => {
    const db = getOwnerDb();
    const code = `CUR-TEST-${String(Date.now()).slice(-6)}`;
    await db
      .insert(curricula)
      .values({
        code,
        title: "Chương Trình Test API",
        programType: "age_based",
        targetAgeMin: 3,
        targetAgeMax: 4,
        durationWeeks: 8,
        sessionsPerWeek: 3,
        accessTier: "standard",
      })
      .onConflictDoNothing();

    const listEvent = mockEvent("GET", "content_reviewer", {}, undefined, {
      search: "Chương Trình Test",
      page: "1",
      limit: "10",
    });

    const res = await getCurriculaHandler(
      listEvent as Parameters<typeof getCurriculaHandler>[0]
    );
    expect(res.items).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(1);
  });
});
