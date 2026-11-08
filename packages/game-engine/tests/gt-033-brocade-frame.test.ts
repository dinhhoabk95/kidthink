import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  BROCADE_BAND_PX,
  BROCADE_MIN_BAND_PX,
  brocadeFrame,
  drawBrocadeFrame,
} from "#src/render/craft-shapes";
import { boxFromSlots } from "#src/render/shared-render-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures.js";
import { GT033Session } from "#src/templates/GT-033/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawBrocadeFrame: vi.fn(actual.drawBrocadeFrame) };
});

/** Khung hoa văn thổ cẩm quanh lưới dệt, ngoài ô và trong sân khấu (`BR-E033-06`). */
const VIEWPORTS = [
  { cssW: 330, cssH: 697 },
  { cssW: 390, cssH: 844 },
  { cssW: 610, cssH: 350 },
  { cssW: 844, cssH: 390 },
  { cssW: 1024, cssH: 640 },
  { cssW: 960, cssH: 540 },
] as const;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

describe("brocadeFrame (hàm thuần)", () => {
  const grid = { x: 100, y: 100, w: 200, h: 200 };
  it("đủ chỗ: dày BROCADE_BAND_PX; chật: co lại; quá chật: null", () => {
    expect(brocadeFrame(grid, { x: 0, y: 0, w: 400, h: 400 })?.band).toBe(
      BROCADE_BAND_PX
    );
    expect(brocadeFrame(grid, { x: 92, y: 0, w: 216, h: 400 })?.band).toBe(8);
    expect(
      brocadeFrame(grid, {
        x: 100 - BROCADE_MIN_BAND_PX + 1,
        y: 0,
        w: 400,
        h: 400,
      })
    ).toBeNull();
  });
});

describe("GT-033: khung thổ cẩm (BR-E033-06)", () => {
  for (const [index, f] of GT033_FIXTURES.entries()) {
    it(`fixture ${index}: ở mọi khung và band, dải nằm ngoài lưới, trong sân khấu, slots không đổi`, () => {
      for (const viewport of VIEWPORTS) {
        for (const band of BANDS) {
          const session = new GT033Session(f.content, f.difficulty, 0);
          const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
          const cssPerLogic = Math.min(
            viewport.cssW / space.w,
            viewport.cssH / space.h
          );
          const zones = computeStageZones({
            logicW: space.w,
            logicH: space.h,
            ageBand: band,
            cssPerLogic,
            needsTray: session.needsTray,
            trayItems: session.trayItemCount,
            trayLabels: session.trayHasLabels,
            stageRows: session.stageRowCount,
            needsCommit: session.needsCommit,
          });
          session.prepareRound(
            band,
            space,
            zones.stage,
            zones.tray ?? undefined,
            cssPerLogic
          );
          const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
          vi.mocked(drawBrocadeFrame).mockClear();
          const ctx = createFakeCanvas(960, 540).getContext("2d");
          if (!ctx) {
            throw new Error("Không lấy được context");
          }
          session.render(
            ctx as CanvasRenderingContext2D,
            new RenderSystem(),
            0
          );
          const calls = vi.mocked(drawBrocadeFrame).mock.calls;
          expect(calls.length).toBeLessThanOrEqual(1);
          const frame = calls[0]?.[1];
          if (frame) {
            const cells = session.slots.slice(
              0,
              f.content.grid.rows * f.content.grid.cols
            );
            const grid = boxFromSlots(cells);
            expect(frame.inner).toEqual(grid);
            const st = zones.stage;
            expect(frame.inner.x - frame.band).toBeGreaterThanOrEqual(
              st.x - 0.5
            );
            expect(frame.inner.y - frame.band).toBeGreaterThanOrEqual(
              st.y - 0.5
            );
            expect(
              frame.inner.x + frame.inner.w + frame.band
            ).toBeLessThanOrEqual(st.x + st.w + 0.5);
            expect(
              frame.inner.y + frame.inner.h + frame.band
            ).toBeLessThanOrEqual(st.y + st.h + 0.5);
          }
          expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
            before
          );
        }
      }
    });
  }

  it("ở khung mặc định 960x540 band 5-6 mọi fixture có dải", () => {
    for (const f of GT033_FIXTURES) {
      const session = new GT033Session(f.content, f.difficulty, 0);
      const space = deriveLogicSpace(960, 540);
      const zones = computeStageZones({
        logicW: space.w,
        logicH: space.h,
        ageBand: "5-6",
        cssPerLogic: 1,
        needsTray: session.needsTray,
        trayItems: session.trayItemCount,
        trayLabels: session.trayHasLabels,
        stageRows: session.stageRowCount,
        needsCommit: session.needsCommit,
      });
      session.prepareRound(
        "5-6",
        space,
        zones.stage,
        zones.tray ?? undefined,
        1
      );
      vi.mocked(drawBrocadeFrame).mockClear();
      const ctx = createFakeCanvas(960, 540).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
      expect(vi.mocked(drawBrocadeFrame)).toHaveBeenCalledTimes(1);
    }
  });
});
