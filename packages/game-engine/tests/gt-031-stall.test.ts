import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { drawMarketStall, marketStallGeometry } from "#src/render/craft-shapes";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures";
import { GT031Session } from "#src/templates/GT-031/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/**
 * GT-031 xem bằng mắt (Phase 24, `BR-E031-13`): sọc mái đủ tương phản với nền
 * (mái đọc ra là một mái, không ba cục rời) và thanh quầy không đè giá.
 */
const m = designTokens.colors.montessori;
const STRIPE_COLORS = new Set<string>([m.coral, m.paper, m.amberLight]);
const FONT_PX = /(\d+(?:\.\d+)?)px/;
const FRAMES = [
  { name: "390x844", w: 390, h: 844 },
  { name: "360x640", w: 360, h: 640 },
  { name: "964x628", w: 964, h: 628 },
  { name: "610x350", w: 610, h: 350 },
] as const;

interface FillRect {
  readonly color: string;
  readonly y: number;
  readonly h: number;
  readonly x: number;
  readonly w: number;
}

function recordStall(): FillRect[] {
  const ctx = createFakeCanvas(540, 960).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rects: FillRect[] = [];
  ctx.fillRect = (x, y, w, h) => {
    rects.push({ color: String(ctx.fillStyle), x, y, w, h });
  };
  drawMarketStall(
    ctx as CanvasRenderingContext2D,
    marketStallGeometry(
      {
        index: 0,
        x: 270,
        y: 400,
        w: 160,
        h: 160,
        hitW: 160,
        hitH: 160,
        page: 0,
        role: "target",
      },
      { x: 16, y: 250, w: 508, h: 400 }
    )
  );
  return rects;
}

describe("GT-031: mái quầy đọc ra là một mái (BR-E031-13)", () => {
  it("không sọc nào trùng màu nền giấy, hai màu sọc khác nhau", () => {
    const stripes = recordStall().filter((r) => STRIPE_COLORS.has(r.color));
    const colors = new Set(stripes.map((s) => s.color));
    expect(colors.has(m.paper)).toBe(false);
    expect(colors.size).toBe(2);
  });
});

describe("GT-031: giá không bị thanh quầy đè (BR-E031-13)", () => {
  it("chữ giá nằm hẳn trên thanh quầy ở mọi khung", () => {
    for (const frame of FRAMES) {
      const fixture = GT031_FIXTURES[0];
      if (!fixture) {
        throw new Error("Thiếu fixture");
      }
      const space = deriveLogicSpace(frame.w, frame.h);
      const cssPerLogic = frame.w / space.w;
      const session = new GT031Session(fixture.content, fixture.difficulty, 1);
      const zones = computeZonesForSession(
        { logicW: space.w, logicH: space.h, ageBand: "4-5", cssPerLogic },
        session
      );
      session.prepareRound(
        "4-5",
        space,
        zones.stage,
        zones.tray ?? undefined,
        cssPerLogic
      );
      const ctx = createFakeCanvas(space.w, space.h).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      const counters: FillRect[] = [];
      const texts: Array<{ y: number; size: number; text: string }> = [];
      ctx.fillRect = (x, y, w, h) => {
        if (String(ctx.fillStyle) === m.woodBorder) {
          counters.push({ color: m.woodBorder, x, y, w, h });
        }
      };
      ctx.fillText = (text, _x, y) => {
        const size = Number(FONT_PX.exec(ctx.font ?? "")?.[1] ?? 0);
        texts.push({ text: String(text), y, size });
      };
      const rs = new RenderSystem();
      session.render(ctx as CanvasRenderingContext2D, rs, 0);
      const price = String(fixture.content.target_amount);
      const label = texts.find((t) => t.text === price);
      expect(label, frame.name).toBeDefined();
      for (const counter of counters) {
        if (label) {
          expect(counter.y, frame.name).toBeGreaterThanOrEqual(
            label.y + label.size
          );
        }
      }
    }
  });
});
