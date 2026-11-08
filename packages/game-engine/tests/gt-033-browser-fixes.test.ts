import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  BROCADE_BAND_PX,
  BROCADE_MIN_BAND_PX,
  brocadeFrame,
  drawYarnBall,
  yarnFillColor,
} from "#src/render/craft-shapes";
import { boxFromSlots } from "#src/render/shared-render-shapes";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures.js";
import { GT033Session } from "#src/templates/GT-033/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawYarnBall: vi.fn(actual.drawYarnBall) };
});

/** Bốn lỗi bắt được khi xem trên trình duyệt (`BR-E033-08`). */
const VIEWPORTS = [
  { cssW: 390, cssH: 844 },
  { cssW: 844, cssH: 390 },
  { cssW: 1024, cssH: 640 },
  { cssW: 960, cssH: 540 },
  { cssW: 330, cssH: 697 },
  { cssW: 610, cssH: 350 },
  { cssW: 964, cssH: 628 },
  { cssW: 1280, cssH: 800 },
  { cssW: 568, cssH: 320 },
] as const;
// GT-033 chỉ có band `5-6` (`BR-E033-04`).
const BANDS: readonly AgeBand[] = ["5-6"];

function open(
  index: number,
  viewport: { cssW: number; cssH: number } = { cssW: 960, cssH: 540 },
  band: AgeBand = "5-6"
) {
  const f = GT033_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
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
  return { session, zones, f };
}

describe("GT-033: chưa cầm màu thì không đặt gì (BR-E033-08)", () => {
  for (const [index, f] of GT033_FIXTURES.entries()) {
    it(`fixture ${index}: mở vòng chưa chọn màu; chạm ô trống không đặt, không sự kiện, không lượt sai`, () => {
      const { session } = open(index);
      expect(session.getSelectedColorId()).toBeNull();
      const before = [...session.getPlacedCells()];
      const eventsBefore = session.getTelemetry().events.length;
      for (const [i, cell] of f.content.cells.entries()) {
        const slot = session.slots[i];
        if (cell !== null || !slot) {
          continue;
        }
        const verdict = session.dispatch({
          type: "tap",
          x: slot.x,
          y: slot.y,
          timeMs: 0,
        });
        expect(verdict?.valid).toBeFalsy();
      }
      expect(session.getPlacedCells()).toEqual(before);
      expect(session.getTelemetry().events).toHaveLength(eventsBefore);
      expect(session.takeSfxCues()).toEqual([]);
      expect(session.mascotMood()).toBeNull();
      expect(session.checkWinCondition()).toBe(false);
    });
  }

  it("chọn màu rồi chạm ô vẫn đặt như cũ", () => {
    const { session } = open(0);
    const total = 4;
    const palette = session.slots[total];
    const cell = session.slots[3];
    if (!(palette && cell)) {
      throw new Error("Thiếu slot");
    }
    session.dispatch({ type: "tap", x: palette.x, y: palette.y, timeMs: 0 });
    expect(session.getSelectedColorId()).toBe("red");
    session.dispatch({ type: "tap", x: cell.x, y: cell.y, timeMs: 1 });
    expect(session.getPlacedCells()[3]).toBe("red");
  });
});

describe("GT-033: cuộn len vector tô đúng màu (BR-E033-08)", () => {
  it("mỗi cuộn trong khay vẽ bằng drawYarnBall với màu của nó, không còn emoji", () => {
    for (const [index, f] of GT033_FIXTURES.entries()) {
      const { session } = open(index);
      vi.mocked(drawYarnBall).mockClear();
      const ctx = createFakeCanvas(960, 540).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
      const drawn = vi.mocked(drawYarnBall).mock.calls.map((c) => c[1]);
      expect(drawn).toHaveLength(f.content.palette.length);
      const fills = drawn.map((id) => yarnFillColor(id));
      expect(new Set(fills).size).toBe(fills.length);
    }
  });
});

describe("GT-033: xanh dương là xanh dương (BR-E033-08)", () => {
  it("blue/sky dùng token xanh dương, không phải xanh ngọc brand", () => {
    expect(yarnFillColor("blue")).toBe(designTokens.colors.scene.blue[500]);
    expect(yarnFillColor("sky")).toBe(designTokens.colors.scene.blue[500]);
    expect(yarnFillColor("blue")).not.toBe(designTokens.colors.brand[500]);
  });

  it("các màu của palette mẫu khác nhau từng đôi", () => {
    const ids = ["red", "blue", "yellow", "green", "purple", "orange"];
    expect(new Set(ids.map(yarnFillColor)).size).toBe(ids.length);
  });
});

describe("GT-033: ô dệt nằm gọn trong khung hoa văn (BR-E033-08)", () => {
  for (const [index] of GT033_FIXTURES.entries()) {
    it(`fixture ${index}: dải thổ cẩm đủ dày BROCADE_BAND_PX và vùng chạm ô nằm trong sân khấu`, () => {
      for (const viewport of VIEWPORTS) {
        for (const band of BANDS) {
          const { session, zones, f } = open(index, viewport, band);
          const label = `${viewport.cssW}x${viewport.cssH} ${band}`;
          const total = f.content.grid.rows * f.content.grid.cols;
          const cells = session.slots.slice(0, total);
          const grid = boxFromSlots(cells);
          const frame = grid ? brocadeFrame(grid, zones.stage) : null;
          // Lề sân khấu của lưới (`STAGE_PADDING_PX` = 16) đã rộng hơn dải 14 px.
          expect(frame?.band, label).toBe(BROCADE_BAND_PX);
          expect(frame?.band ?? 0, label).toBeGreaterThanOrEqual(
            BROCADE_MIN_BAND_PX
          );
          for (const slot of cells) {
            expect(slot.x - slot.hitW / 2, label).toBeGreaterThanOrEqual(
              zones.stage.x - 0.5
            );
            expect(slot.x + slot.hitW / 2, label).toBeLessThanOrEqual(
              zones.stage.x + zones.stage.w + 0.5
            );
            expect(slot.y - slot.hitH / 2, label).toBeGreaterThanOrEqual(
              zones.stage.y - 0.5
            );
            expect(slot.y + slot.hitH / 2, label).toBeLessThanOrEqual(
              zones.stage.y + zones.stage.h + 0.5
            );
          }
        }
      }
    });
  }
});
