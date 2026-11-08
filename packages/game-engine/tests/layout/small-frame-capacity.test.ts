import { beforeAll, describe, expect, it } from "vitest";
import { preloadGameSession } from "#src/index";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import {
  GT009ContentSchema,
  GT009DifficultySchema,
} from "#src/templates/GT-009/template";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import {
  GT013_MAX_COLS,
  GT013_MAX_ROWS,
  GT013ContentSchema,
} from "#src/templates/GT-013/template";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import {
  GT035_MAX_GRID_ROWS,
  GT035ContentSchema,
} from "#src/templates/GT-035/template";
import { FIXTURES_BY_CODE } from "../fixtures-map.ts";
import {
  canvasBoxOf,
  configFor,
  createSession,
  overflowReasons,
  placeRound,
  SHELL_VIEWPORTS,
} from "./helpers/shell-frame.ts";

/**
 * Phase 25 (`BR-LAY-12`): contract chặn level vượt sức chứa khung nhỏ nhất
 * 360x640 ở sàn chạm — `BR-E009-09` (ứng viên GT-009) và `BR-E035-17` (hàng
 * lưới GT-035). Bậc thang đo thật nằm ở `action-clear.test.ts`.
 */
describe("contract giữ level vừa khung 360x640 (BR-LAY-12)", () => {
  it("GT-009 từ chối 7 ứng viên, nhận 6 (BR-E009-09)", () => {
    const base = GT009_FIXTURES.find((f) => f.content.candidates.length === 6);
    if (!base) {
      throw new Error("Thiếu fixture GT-009 sáu ứng viên");
    }
    expect(GT009ContentSchema.safeParse(base.content).success).toBe(true);
    const extra = {
      candidate_id: "c7",
      value: 7,
    };
    const seven = {
      ...base.content,
      candidates: [...base.content.candidates, extra],
    };
    expect(GT009ContentSchema.safeParse(seven).success).toBe(false);
    expect(
      GT009DifficultySchema.safeParse({ ...base.difficulty, item_count: 7 })
        .success
    ).toBe(false);
  });

  it("GT-035 từ chối lưới 4 hàng, nhận 3 hàng (BR-E035-17)", () => {
    const base = GT035_FIXTURES[0];
    if (!base) {
      throw new Error("Thiếu fixture GT-035");
    }
    expect(GT035ContentSchema.safeParse(base.content).success).toBe(true);
    const tall = {
      ...base.content,
      grid: { rows: GT035_MAX_GRID_ROWS + 1, cols: base.content.grid.cols },
    };
    expect(GT035ContentSchema.safeParse(tall).success).toBe(false);
  });

  it("mọi fixture GT-035 có tối đa 3 hàng", () => {
    for (const f of GT035_FIXTURES) {
      expect(f.content.grid.rows, f.id).toBeLessThanOrEqual(
        GT035_MAX_GRID_ROWS
      );
    }
  });
});

describe("contract mê cung GT-013 vừa khung 360x640 (BR-E013-12)", () => {
  it("từ chối lưới 4 cột và 5 hàng, nhận 3 cột x 4 hàng", () => {
    const base = GT013_FIXTURES[0];
    if (!base) {
      throw new Error("Thiếu fixture GT-013");
    }
    const withGrid = (rows: number, cols: number) => ({
      ...base.content,
      grid: { ...base.content.grid, rows, cols },
    });
    expect(
      GT013ContentSchema.safeParse(withGrid(GT013_MAX_ROWS, GT013_MAX_COLS))
        .success
    ).toBe(true);
    expect(
      GT013ContentSchema.safeParse(withGrid(3, GT013_MAX_COLS + 1)).success
    ).toBe(false);
    expect(
      GT013ContentSchema.safeParse(withGrid(GT013_MAX_ROWS + 1, 3)).success
    ).toBe(false);
  });

  it("lưới 4x3 vừa mọi band và mọi viewport ở bề mặt preview", async () => {
    await preloadGameSession("GT-013");
    const base = FIXTURES_BY_CODE["GT-013"]?.[0];
    if (!base) {
      throw new Error("Thiếu fixture GT-013");
    }
    const content = {
      ...base.content,
      grid: {
        rows: GT013_MAX_ROWS,
        cols: GT013_MAX_COLS,
        walls: [],
        start: { row: 0, col: 0 },
        goal: { row: GT013_MAX_ROWS - 1, col: GT013_MAX_COLS - 1 },
      },
      required_cells: [],
    };
    for (const band of ["3-4", "4-5", "5-6"] as const) {
      for (const viewport of SHELL_VIEWPORTS) {
        const session = createSession(
          "GT-013",
          configFor("GT-013", band, content, base.difficulty)
        );
        if (!session) {
          throw new Error("GT-013 không phải TemplateGameSession");
        }
        const round = placeRound(
          session,
          band,
          canvasBoxOf(viewport, band, "preview")
        );
        expect(
          overflowReasons(round, session.needsCommit),
          `${band} ${viewport.name}`
        ).toEqual([]);
      }
    }
  });
});

describe("ca âm: helper bắt ô ra ngoài canvas (BR-LAY-13)", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-035");
  });

  it("GT-035 ở band 3-4 (sàn 96 px) tràn đáy và đè nút ở 360x640", () => {
    const fixture = FIXTURES_BY_CODE["GT-035"]?.[0];
    const small = SHELL_VIEWPORTS[0];
    if (!(fixture && small)) {
      throw new Error("Thiếu fixture GT-035 hoặc viewport");
    }
    const session = createSession(
      "GT-035",
      configFor("GT-035", "3-4", fixture.content, fixture.difficulty)
    );
    if (!session) {
      throw new Error("GT-035 không phải TemplateGameSession");
    }
    const round = placeRound(
      session,
      "3-4",
      canvasBoxOf(small, "3-4", "preview")
    );
    const reasons = overflowReasons(round, session.needsCommit);
    expect(reasons).toContain("ngoài canvas");
    expect(reasons).toContain("đè nút hành động");
  });
});
