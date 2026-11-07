import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, resolveTouchFloor } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";
import {
  FIRST_OPTION_SLOT,
  SOURCE_SLOT,
  STRIP_SLOT,
  UNIT_MAX_PX,
  UNIT_MIN_PX,
} from "#src/templates/GT-030/zone-layout";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

/**
 * GT-030 dải đo liền (`BR-E030-08`, `BR-E030-09`): một vùng chạm, một hàng ở
 * mọi khung, vật đo dài đúng bằng dải; thả tự do dọc dải và bám mép.
 */
const VIEWPORTS = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "điện thoại ngang 610x350", cssW: 610, cssH: 350 },
  { name: "máy tính 964x628", cssW: 964, cssH: 628 },
] as const;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const ROD_FIXTURE = GT030_FIXTURES.find(
  (f) => f.content.representation === "number-rod"
);

function open(
  index: number,
  cssW = 964,
  cssH = 628,
  band: AgeBand = "5-6"
): GT030Session {
  const f = GT030_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT030Session(f.content, f.difficulty, 0);
  const space = deriveLogicSpace(cssW, cssH);
  const cssPerLogic = Math.min(cssW / space.w, cssH / space.h);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    band,
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  return session;
}

function dropOnStrip(session: GT030Session, dx: number) {
  const source = session.slots[SOURCE_SLOT];
  const next = session.getNextCellCenter();
  if (!(source && next)) {
    throw new Error("Thiếu slot");
  }
  return session.dispatch({
    type: "drop",
    fromX: source.x,
    fromY: source.y,
    toX: next.x + dx,
    toY: next.y,
    timeMs: 10,
  });
}

describe("GT-030 dải đo liền một hàng (BR-E030-08)", () => {
  it("có fixture number-rod để kiểm BR-E030-09", () => {
    expect(ROD_FIXTURE).toBeDefined();
  });

  for (const viewport of VIEWPORTS) {
    for (const band of BANDS) {
      it(`${viewport.name} band ${band}: dải đo là một slot, cạnh đơn vị trong khoảng, vật đo dài bằng dải, cao ≥ sàn chạm`, () => {
        GT030_FIXTURES.forEach((f, i) => {
          const session = open(i, viewport.cssW, viewport.cssH, band);
          const n = f.content.object.length_in_units;
          const strip = session.slots[STRIP_SLOT];
          const object = session.slots[0];
          expect(strip).toBeDefined();
          expect(object?.w).toBe(strip?.w);
          const unit = (strip?.w ?? 0) / n;
          expect(unit).toBeGreaterThanOrEqual(UNIT_MIN_PX);
          expect(unit).toBeLessThanOrEqual(UNIT_MAX_PX);
          expect(Number.isInteger(unit)).toBe(true);
          const floor = resolveTouchFloor(
            band,
            Math.min(
              viewport.cssW / deriveLogicSpace(viewport.cssW, viewport.cssH).w,
              viewport.cssH / deriveLogicSpace(viewport.cssW, viewport.cssH).h
            )
          );
          expect(strip?.hitH).toBeGreaterThanOrEqual(floor);
          expect(session.slots.length).toBe(
            FIRST_OPTION_SLOT + f.content.answer_options.length
          );
        });
      });
    }
  }

  it("view có đúng một thực thể dải đo", () => {
    const session = open(0);
    const strips = session
      .getView()
      .entities.filter((e) => e.id === "measure_strip");
    expect(strips).toHaveLength(1);
    expect(strips[0]?.slotIndex).toBe(STRIP_SLOT);
  });
});

describe("GT-030 thả tự do và bám mép (BR-E030-06, BR-E030-08)", () => {
  it("thả ở bất kỳ chỗ nào trong dung sai quanh mép kế đều bám", () => {
    const session = open(0);
    const strip = session.slots[STRIP_SLOT];
    const unit = (strip?.w ?? 0) / 4;
    const verdict = dropOnStrip(session, unit * 0.05);
    expect(verdict?.valid).toBe(true);
    expect(session.getPlacedUnitsCount()).toBe(1);
  });

  it("thả hở quá dung sai thì không bám và có khe; chồng thì có chồng", () => {
    const session = open(0);
    const unit = (session.slots[STRIP_SLOT]?.w ?? 0) / 4;
    expect(dropOnStrip(session, unit * 0.7)?.valid).toBe(false);
    expect(session.getGapFlash()?.kind).toBe("gap");
    expect(session.getPlacedUnitsCount()).toBe(0);
    dropOnStrip(session, 0);
    dropOnStrip(session, -unit * 0.7);
    expect(session.getGapFlash()?.kind).toBe("overlap");
    expect(session.getPlacedUnitsCount()).toBe(1);
  });

  it("thả ngoài dải (hàng đáp án) không phải một lần đặt", () => {
    const session = open(0);
    const source = session.slots[SOURCE_SLOT];
    const option = session.slots[FIRST_OPTION_SLOT];
    if (!(source && option)) {
      throw new Error("Thiếu slot");
    }
    expect(
      session.toAction({
        type: "drop",
        fromX: source.x,
        fromY: source.y,
        toX: option.x,
        toY: option.y,
        timeMs: 1,
      })
    ).toBeNull();
  });

  it("chạm phần đã đặt gỡ đơn vị cuối; chạm phần trống đặt tiếp", () => {
    const session = open(0);
    const strip = session.slots[STRIP_SLOT];
    if (!strip) {
      throw new Error("Thiếu dải");
    }
    const unit = strip.w / 4;
    const left = strip.x - strip.w / 2;
    session.dispatch({
      type: "tap",
      x: left + 3.5 * unit,
      y: strip.y,
      timeMs: 1,
    });
    expect(session.getPlacedUnitsCount()).toBe(1);
    session.dispatch({
      type: "tap",
      x: left + 0.5 * unit,
      y: strip.y,
      timeMs: 2,
    });
    expect(session.getPlacedUnitsCount()).toBe(0);
  });

  it("gợi ý: khay nguồn rồi dải đo, sau khi đủ thì đáp án đúng", () => {
    const session = open(0);
    expect(session.getHintTargetIndex()).toBe(SOURCE_SLOT);
    expect(session.getHintDestinationIndex()).toBe(STRIP_SLOT);
    for (let i = 0; i < 4; i++) {
      dropOnStrip(session, 0);
    }
    expect(session.getHintDestinationIndex()).toBeNull();
    expect(session.getHintTargetIndex()).toBe(FIRST_OPTION_SLOT + 1);
  });
});

describe("GT-030 number-rod hiện khe và chồng (BR-E030-09)", () => {
  it("thanh số vẽ khi đã đặt và vạch chéo vẫn hiện khi thả lệch", () => {
    const index = GT030_FIXTURES.findIndex(
      (f) => f.content.representation === "number-rod"
    );
    const session = open(index);
    dropOnStrip(session, 0);
    const unit = (session.slots[STRIP_SLOT]?.w ?? 0) / 10;
    dropOnStrip(session, unit * 0.7);
    expect(session.getGapFlash()?.kind).toBe("gap");
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    expect(ctx).not.toBeNull();
    if (!ctx) {
      return;
    }
    const lines = vi.spyOn(ctx, "lineTo");
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    expect(lines).toHaveBeenCalled();
    expect(session.getPlacedUnitsCount()).toBe(1);
  });
});
