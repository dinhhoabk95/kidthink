import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawCircleOutline } from "#src/render/slot-decor";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/slot-decor", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/slot-decor")>();
  return { ...actual, drawCircleOutline: vi.fn(actual.drawCircleOutline) };
});

/** Viền ô trung tính, không theo thuộc tính phân loại (`BR-E027-07`). */
const COLOUR_TOKENS: readonly string[] = [
  designTokens.colors.montessori.coral,
  designTokens.colors.brand[500],
  designTokens.colors.montessori.amber,
  designTokens.colors.semantic.success[500],
  designTokens.colors.montessori.indigo,
  designTokens.colors.cta[500],
];

describe("GT-027: viền ô trung tính (BR-E027-07)", () => {
  it("không vẽ viền theo màu của vật ở bất kỳ fixture nào", () => {
    for (const fixture of GT027_FIXTURES) {
      vi.mocked(drawCircleOutline).mockClear();
      const session = new GT027Session(fixture.content, fixture.difficulty, 0);
      const zones = computeStageZones({
        logicW: DEFAULT_LOGIC_SPACE.w,
        logicH: DEFAULT_LOGIC_SPACE.h,
        ageBand: "5-6",
        cssPerLogic: 1,
        needsTray: false,
        needsCommit: false,
      });
      session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);
      const ctx = createFakeCanvas(960, 540).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
      const colours = vi
        .mocked(drawCircleOutline)
        .mock.calls.map((call) => call[2]);
      expect(colours.filter((c) => COLOUR_TOKENS.includes(c))).toEqual([]);
    }
  });
});
