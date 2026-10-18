import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { createEvent, type H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getQuery: vi.fn<() => Record<string, string>>(),
  getRouterParam: vi.fn<() => string | undefined>(),
  setHeader: vi.fn(),
  dbWhere:
    vi.fn<() => Promise<{ id?: number; code: string; tier: string }[]>>(),
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: <T>(handler: T): T => handler,
    setHeader: mocks.setHeader,
    setResponseStatus: vi.fn(),
    getQuery: mocks.getQuery,
    getRouterParam: mocks.getRouterParam,
    createError: <T>(opts: T): T => opts,
  };
});

vi.mock("@mindkid/db", () => ({
  getOwnerDb: () => ({
    select: () => ({
      from: () => ({
        where: mocks.dbWhere,
      }),
    }),
  }),
  skills: { status: "status", code: "code", id: "id" },
  strands: {},
  learningObjectives: { skillId: "skillId" },
}));

import taxonomyIndexHandler from "#server/api/guest/taxonomy/index.get";
import skillDetailHandler from "#server/api/guest/taxonomy/skills/[code].get";

function makeMockEvent(): H3Event {
  const req = new IncomingMessage(new Socket());
  req.method = "GET";
  req.url = "/api/guest/taxonomy";
  const res = new ServerResponse(req);
  return createEvent(req, res);
}

describe("Guest Taxonomy API & Performance (BR-TAX-06 & BR-TAX-10)", () => {
  let mockEvent: H3Event;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = makeMockEvent();
  });

  it("GET /api/guest/taxonomy returns tree and sets Cache-Control (BR-TAX-10)", async () => {
    mocks.getQuery.mockReturnValue({ depth: "skill" });
    mocks.dbWhere.mockResolvedValue([{ code: "C1.CNT.01", tier: "basic" }]);

    const response = await taxonomyIndexHandler(mockEvent);

    expect(response).toHaveProperty("competencies");
    expect(mocks.setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "public, max-age=3600"
    );
  });

  it("GET /api/guest/taxonomy/skills/:code returns skill and LOs", async () => {
    mocks.getRouterParam.mockReturnValue("C1.CNT.01");
    mocks.dbWhere.mockResolvedValue([
      { id: 1, code: "C1.CNT.01", tier: "basic" },
    ]);

    const response = await skillDetailHandler(mockEvent);

    expect(response).toHaveProperty("skill");
    expect(response.skill.code).toBe("C1.CNT.01");
    expect(mocks.setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "public, max-age=3600"
    );
  });

  it("Ca âm: GET /api/guest/taxonomy/skills/INVALID returns 400 INVALID_CODE_FORMAT", async () => {
    mocks.getRouterParam.mockReturnValue("INVALID_CODE");

    await expect(skillDetailHandler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "INVALID_CODE_FORMAT",
    });
  });

  it("Ca âm: GET /api/guest/taxonomy/skills/C1.CNT.99 returns 404 NOT_FOUND for unseeded skill", async () => {
    mocks.getRouterParam.mockReturnValue("C1.CNT.99");
    mocks.dbWhere.mockResolvedValue([]);

    await expect(skillDetailHandler(mockEvent)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
    });
  });

  it("BR-TAX-10 benchmark: 100 queries respond with P95 < 100ms", async () => {
    mocks.getQuery.mockReturnValue({ depth: "skill" });
    mocks.dbWhere.mockResolvedValue([{ code: "C1.CNT.01", tier: "basic" }]);

    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now();
      await taxonomyIndexHandler(mockEvent);
      latencies.push(performance.now() - t0);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[94];
    expect(p95).toBeLessThan(100);
  });
});
