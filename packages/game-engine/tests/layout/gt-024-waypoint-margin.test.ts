import { beforeAll, describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { preloadGameSession } from "#src/index";
import { resolveTouchFloor } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import { GT024Session } from "#src/templates/GT-024/session";
import { fitContentToStage } from "#src/templates/GT-024/stage-fit";
import { legacyGT024FitMargin } from "./fixtures/gt-024-legacy-margin.ts";
import {
  bandsOf,
  canvasBoxOf,
  casesFor,
  createSession,
  placeRound,
  SHELL_VIEWPORTS,
} from "./helpers/shell-frame.ts";

/** D-10/D-11: chấm mốc nằm trọn slate box; gợi ý L3 kéo có độ dài khác 0. */
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const PAD_PX = 8;
beforeAll(async () => {
  await preloadGameSession("GT-024");
});

const TARGET_SCALE = 1.12;
const POP_SCALE = 1.14;

interface Pt {
  readonly x: number;
  readonly y: number;
}

/** Bán kính vẽ lớn nhất: gốc (không nhỏ hơn nửa vùng chạm) x đích x nhịp nháy. */
function maxDrawnRadius(baseRadius: number): number {
  return baseRadius * TARGET_SCALE * POP_SCALE;
}

/** Danh sách chấm có bán kính vẽ tối đa + pad vượt ra ngoài `stage`. */
function overflowingDots(
  points: readonly Pt[],
  stage: ZoneRect,
  radius: number
): number[] {
  const reach = radius + PAD_PX;
  const bad: number[] = [];
  points.forEach((p, i) => {
    if (
      p.x - reach < stage.x ||
      p.x + reach > stage.x + stage.w ||
      p.y - reach < stage.y ||
      p.y + reach > stage.y + stage.h
    ) {
      bad.push(i);
    }
  });
  return bad;
}

function baseRadiusOf(session: GT024Session): number {
  const legible = Math.max(16, Math.ceil(14 * 0.75));
  return Math.max(legible, session.hitHalfPx);
}

describe("GT-024: chấm mốc trọn trong slate box ở khung shell thật", () => {
  for (const viewport of SHELL_VIEWPORTS) {
    for (const band of bandsOf("GT-024", BANDS)) {
      it(`${band}@${viewport.name}: mọi chấm + pad ${PAD_PX} nằm trong stage`, () => {
        const box = canvasBoxOf(viewport, band, "play");
        const cases = casesFor("GT-024", band);
        expect(cases.length).toBeGreaterThan(0);
        for (const c of cases) {
          const session = createSession("GT-024", c.config);
          if (!(session instanceof GT024Session)) {
            throw new Error(`${c.name}: không phải GT024Session`);
          }
          const round = placeRound(session, band, box);
          const radius = maxDrawnRadius(baseRadiusOf(session));
          const bad = overflowingDots(
            session.getScreenWaypoints(),
            round.zones.stage,
            radius
          );
          expect(bad, `${c.name}: chấm tràn ${bad.join(",")}`).toEqual([]);
        }
      });

      it(`${band}@${viewport.name}: gợi ý L3 và getHintTarget kéo độ dài khác 0 khi cur>0`, () => {
        const box = canvasBoxOf(viewport, band, "play");
        for (const c of casesFor("GT-024", band)) {
          const session = createSession("GT-024", c.config);
          if (!(session instanceof GT024Session)) {
            throw new Error(`${c.name}: không phải GT024Session`);
          }
          placeRound(session, band, box);
          const wps = session.getScreenWaypoints();
          const slotMap = session.getSlotOfWaypoint();
          for (let cur = 1; cur < wps.length; cur++) {
            const prev = wps[cur - 1];
            if (!prev) {
              throw new Error("thiếu chấm trước");
            }
            session.dispatch({
              type: "tap",
              x: prev.x,
              y: prev.y,
              timeMs: cur,
            });
            if (session.getCurrentOrderIndex() !== cur) {
              break;
            }
            const target = session.getHintTarget();
            if (target?.kind !== "slot") {
              throw new Error(`${c.name}: cần hint slot`);
            }
            expect(target.index).toBe(slotMap[cur - 1] ?? cur - 1);
            expect(target.toIndex).toBe(slotMap[cur] ?? cur);
            if (slotMap[cur - 1] !== slotMap[cur]) {
              expect(target.index).not.toBe(target.toIndex);
            }
          }
        }
      });
    }
  }
});

describe("GT-024: ca âm, lề cũ floor/2 bị báo tràn", () => {
  it("lề cũ làm ít nhất một chấm tràn ở 360x640", () => {
    const viewport = SHELL_VIEWPORTS[0];
    if (!viewport) {
      throw new Error("thiếu viewport");
    }
    let flagged = 0;
    for (const band of bandsOf("GT-024", BANDS)) {
      const box = canvasBoxOf(viewport, band, "play");
      for (const c of casesFor("GT-024", band)) {
        const session = createSession("GT-024", c.config);
        if (!(session instanceof GT024Session)) {
          continue;
        }
        const round = placeRound(session, band, box);
        const floor = resolveTouchFloor(band, round.scale);
        const shape = session.getScreenWaypoints();
        const fit = fitContentToStage(
          round.zones.stage,
          legacyGT024FitMargin(floor),
          shape
        );
        const pts = shape.map((w) => ({
          x: fit.offsetX + w.x * fit.scale,
          y: fit.offsetY + w.y * fit.scale,
        }));
        flagged += overflowingDots(
          pts,
          round.zones.stage,
          maxDrawnRadius(baseRadiusOf(session))
        ).length;
      }
    }
    expect(flagged).toBeGreaterThan(0);
  });
});
