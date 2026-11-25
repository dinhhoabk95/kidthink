import { describe, expect, it, vi } from "vitest";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawWaypointPath } from "#src/render/board-shapes";
import {
  ANT_HALF_PX,
  antNestPoint,
  antPerchPoint,
  drawAntNest,
  drawCrawlingAnt,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import { gt024WaypointBaseRadius } from "#src/templates/GT-024/layout";
import { GT024Session } from "#src/templates/GT-024/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawAntNest: vi.fn(actual.drawAntNest),
    drawCrawlingAnt: vi.fn(actual.drawCrawlingAnt),
  };
});

function fakeCtx(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  return ctx as CanvasRenderingContext2D;
}

describe("GT-024: nhãn điểm mốc (BR-E024-07)", () => {
  it("vẽ nhãn thật của fixture, điểm khép kín trùng toạ độ không vẽ lần hai", () => {
    const fixture = GT024_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const ctx = fakeCtx();
    const fillText = vi.fn();
    ctx.fillText = fillText;
    drawWaypointPath(ctx, fixture.content.waypoints, 0);
    const labels = fillText.mock.calls.map((c) => c[0]);
    expect(labels).toEqual(["1", "2", "3"]);
  });

  it("nhãn khác số thứ tự thì vẽ nhãn, không vẽ chỉ số mảng", () => {
    const ctx = fakeCtx();
    const fillText = vi.fn();
    ctx.fillText = fillText;
    drawWaypointPath(
      ctx,
      [
        { x: 10, y: 10, order: 0, label: "A" },
        { x: 100, y: 10, order: 1, label: "B" },
      ],
      0
    );
    expect(fillText.mock.calls.map((c) => c[0])).toEqual(["A", "B"]);
  });

  it("không có nhãn thì dùng số thứ tự", () => {
    const ctx = fakeCtx();
    const fillText = vi.fn();
    ctx.fillText = fillText;
    drawWaypointPath(
      ctx,
      [
        { x: 10, y: 10, order: 0 },
        { x: 100, y: 10, order: 1 },
      ],
      0
    );
    expect(fillText.mock.calls.map((c) => c[0])).toEqual(["1", "2"]);
  });
});

interface Box {
  readonly x: number;
  readonly y: number;
  readonly halfW: number;
  readonly halfH: number;
}

function overlaps(a: Box, b: Box): boolean {
  return (
    Math.abs(a.x - b.x) < a.halfW + b.halfW &&
    Math.abs(a.y - b.y) < a.halfH + b.halfH
  );
}

/** Hộp có chứa điểm nào trên các đoạn nối liền các điểm mốc không (lấy mẫu mỗi 2 px). */
function crossesGuide(
  box: Box,
  points: readonly { readonly x: number; readonly y: number }[]
): boolean {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!(a && b)) {
      continue;
    }
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
    for (let k = 0; k <= steps; k++) {
      const x = a.x + ((b.x - a.x) * k) / steps;
      const y = a.y + ((b.y - a.y) * k) / steps;
      if (Math.abs(x - box.x) < box.halfW && Math.abs(y - box.y) < box.halfH) {
        return true;
      }
    }
  }
  return false;
}

describe("GT-024: kiến và tổ không đè điểm hay ô chạm (BR-E024-08)", () => {
  const frames = [
    { w: 960, h: 540, band: "5-6" as const },
    { w: 390, h: 844, band: "5-6" as const },
    { w: 844, h: 390, band: "5-6" as const },
  ];

  it("antNestPoint tránh các hộp cho trước, trong sân khấu", () => {
    const stage = { x: 0, y: 0, w: 600, h: 400 };
    const hit: Box = { x: 300, y: 100, halfW: 40, halfH: 40 };
    const avoid = [hit];
    const p = antNestPoint({ x: 300, y: 100 }, stage, avoid, {
      x: 300,
      y: 300,
    });
    expect(p).not.toBeNull();
    if (!p) {
      return;
    }
    expect(overlaps({ x: p.x, y: p.y + 6, halfW: 30, halfH: 20 }, hit)).toBe(
      false
    );
  });

  it("antNestPoint ưu tiên phía ngoài hình dù phía trong có chỗ gần hơn", () => {
    const stage = { x: 0, y: 0, w: 600, h: 400 };
    const last = { x: 300, y: 100 };
    const avoid = [{ x: 300, y: 100, halfW: 32, halfH: 32 }];
    // Tâm hình ở dưới: phía ngoài là phía trên điểm cuối.
    const p = antNestPoint(last, stage, avoid, { x: 300, y: 300 });
    expect(p).not.toBeNull();
    expect(p?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(last.y);
  });

  it("antPerchPoint tránh hộp chạm: không đè điểm nào", () => {
    const stage = { x: 0, y: 0, w: 600, h: 400 };
    const hit: Box = { x: 300, y: 100, halfW: 45, halfH: 45 };
    const avoid = [hit];
    const p = antPerchPoint(
      { x: 300, y: 100 },
      { x: 400, y: 100 },
      stage,
      avoid
    );
    expect(p).not.toBeNull();
    if (!p) {
      return;
    }
    expect(
      overlaps({ x: p.x, y: p.y, halfW: ANT_HALF_PX, halfH: ANT_HALF_PX }, hit)
    ).toBe(false);
  });

  it("mọi fixture x khung: kiến lúc đậu và tổ không đè hộp chạm của điểm nào", () => {
    for (const fixture of GT024_FIXTURES) {
      for (const f of frames) {
        const zones = computeStageZones({
          logicW: f.w,
          logicH: f.h,
          ageBand: f.band,
          cssPerLogic: 1,
          needsTray: false,
          needsCommit: false,
        });
        const session = new GT024Session(
          fixture.content,
          { ...fixture.difficulty, show_numbered_dots: true },
          0
        );
        session.prepareRound(f.band, { w: f.w, h: f.h }, zones.stage);
        vi.mocked(drawAntNest).mockClear();
        vi.mocked(drawCrawlingAnt).mockClear();
        const rs = new RenderSystem();
        session.render(fakeCtx(), rs, 0);
        const ant = vi.mocked(drawCrawlingAnt).mock.calls[0]?.[1];
        const nest = vi.mocked(drawAntNest).mock.calls[0];
        expect(
          nest,
          `${fixture.content.shape_name} ${f.w}x${f.h} có tổ`
        ).toBeDefined();
        expect(
          ant,
          `${fixture.content.shape_name} ${f.w}x${f.h} có kiến`
        ).toBeDefined();
        const half = session.hitHalfPx;
        const boxes: Box[] = session.traceSystem
          .getWaypoints()
          .map((w) => ({ x: w.x, y: w.y, halfW: half, halfH: half }));
        if (ant) {
          const a = {
            x: ant.x,
            y: ant.y,
            halfW: ANT_HALF_PX,
            halfH: ANT_HALF_PX,
          };
          for (const b of boxes) {
            expect(
              overlaps(a, b),
              `${fixture.content.shape_name} ${f.w}x${f.h} kiến`
            ).toBe(false);
          }
        }
        if (nest) {
          // Tổ ưu tiên phía ngoài hình (`BR-E024-08`): không lệch vào trong so với
          // hướng từ tâm hình ra điểm cuối, và không đè nét dẫn giữa các điểm.
          const wps = session.traceSystem.getWaypoints();
          const last = wps.at(-1);
          if (!last) {
            throw new Error("Thiếu điểm cuối");
          }
          const cx = wps.reduce((sum, w) => sum + w.x, 0) / wps.length;
          const cy = wps.reduce((sum, w) => sum + w.y, 0) / wps.length;
          const outward =
            (Number(nest[1]) - last.x) * (last.x - cx) +
            (Number(nest[2]) - last.y) * (last.y - cy);
          expect(
            outward,
            `${fixture.content.shape_name} ${f.w}x${f.h} tổ ở phía ngoài hình`
          ).toBeGreaterThanOrEqual(0);
          const nestBox = {
            x: Number(nest[1]),
            y: Number(nest[2]) + 6,
            halfW: 30,
            halfH: 20,
          };
          expect(
            crossesGuide(nestBox, wps),
            `${fixture.content.shape_name} ${f.w}x${f.h} tổ đè nét dẫn`
          ).toBe(false);
        }
        if (nest) {
          const n = {
            x: Number(nest[1]),
            y: Number(nest[2]) + 6,
            halfW: 30,
            halfH: 20,
          };
          for (const b of boxes) {
            expect(
              overlaps(n, b),
              `${fixture.content.shape_name} ${f.w}x${f.h} tổ`
            ).toBe(false);
          }
        }
      }
    }
  });
});

describe("GT-024: chấm vẽ không nhỏ hơn vùng chạm (phone 390x844)", () => {
  it("bán kính chấm >= nửa vùng chạm, và giữ sàn đọc được khi vùng chạm nhỏ", () => {
    expect(gt024WaypointBaseRadius(48)).toBeGreaterThanOrEqual(48);
    expect(gt024WaypointBaseRadius(4)).toBeGreaterThanOrEqual(16);
    expect(gt024WaypointBaseRadius(Number.NaN)).toBeGreaterThanOrEqual(16);
  });
});
