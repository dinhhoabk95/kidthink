import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("h3", () => ({
  defineEventHandler: (handler: any) => handler,
  setHeader: vi.fn(),
  setResponseStatus: vi.fn(),
  getQuery: vi.fn(),
  getRouterParam: vi.fn(),
  createError: (opts: any) => opts,
}));

vi.mock("@kidthink/db", () => ({
  getOwnerDb: vi.fn(),
  skills: { status: "status", code: "code", id: "id" },
  strands: {},
  learningObjectives: { skillId: "skillId" },
}));

import { getOwnerDb } from "@kidthink/db";
import { getQuery, getRouterParam, setHeader } from "h3";
import taxonomyIndexHandler from "../../server/api/guest/taxonomy/index.get.ts";
import skillDetailHandler from "../../server/api/guest/taxonomy/skills/[code].get.ts";

describe("Guest Taxonomy API & Performance (BR-TAX-06 & BR-TAX-10)", () => {
  let mockEvent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {};
  });

  it("GET /api/guest/taxonomy returns tree and sets Cache-Control (BR-TAX-10)", async () => {
    (getQuery as any).mockReturnValue({ depth: "skill" });
    (getOwnerDb as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([{ code: "C1.CNT.01", status: "seeded" }]),
        }),
      }),
    });

    const response = await taxonomyIndexHandler(mockEvent);

    expect(response).toHaveProperty("competencies");
    expect(setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "public, max-age=3600"
    );
  });

  it("GET /api/guest/taxonomy/skills/:code returns skill and LOs", async () => {
    (getRouterParam as any).mockReturnValue("C1.CNT.01");
    (getOwnerDb as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([
              { id: 1, code: "C1.CNT.01", status: "seeded" },
            ]),
        }),
      }),
    });

    const response = await skillDetailHandler(mockEvent);

    expect(response).toHaveProperty("skill");
    expect(response.skill.code).toBe("C1.CNT.01");
    expect(setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "public, max-age=3600"
    );
  });

  it("Ca âm: GET /api/guest/taxonomy/skills/INVALID returns 400 INVALID_CODE_FORMAT", async () => {
    (getRouterParam as any).mockReturnValue("INVALID_CODE");

    await expect(skillDetailHandler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "INVALID_CODE_FORMAT",
    });
  });

  it("Ca âm: GET /api/guest/taxonomy/skills/C1.CNT.99 returns 404 NOT_FOUND for unseeded skill", async () => {
    (getRouterParam as any).mockReturnValue("C1.CNT.99");
    (getOwnerDb as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(skillDetailHandler(mockEvent)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
    });
  });

  it("BR-TAX-10 benchmark: 100 queries respond with P95 < 100ms", async () => {
    (getQuery as any).mockReturnValue({ depth: "skill" });
    (getOwnerDb as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([{ code: "C1.CNT.01", status: "seeded" }]),
        }),
      }),
    });

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
