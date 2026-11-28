import { describe, expect, it, vi } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  trafficLampGlow,
  trafficLightBox,
  trafficStimulusSlot,
} from "#src/render/container-shapes";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Đèn giao thông thật thay cho kích thích trần (`BR-E026-12`, `BR-E026-04`). */
const RGBA_PATTERN = /rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/;
const RED_RGB = "192, 5, 0";
const GREEN_RGB = "46, 204, 113";

const fixture = GT026_FIXTURES.find((f) => !f.difficulty.untimed);
if (!fixture) {
  throw new Error("Timed fixture missing");
}
const { content, difficulty } = fixture;

function open(): { session: GT026Session; rs: RenderSystem } {
  const space = deriveLogicSpace(1024, 640);
  const cssPerLogic = 1024 / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic,
    needsTray: false,
    needsCommit: false,
  });
  const session = new GT026Session(content, difficulty, 3);
  session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
  session.commit({ type: "start_trials", data: {} });
  const rs = new RenderSystem();
  rs.logicSpace = space;
  return { session, rs };
}

/** Mức sáng cao nhất của mỗi màu đèn trong một khung (độ mờ của lần tô). */
function litAlpha(
  session: GT026Session,
  rs: RenderSystem,
  timeMs: number
): { red: number; green: number } {
  const ctx = createFakeCanvas(1024, 640).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const seen = { red: 0, green: 0 };
  vi.spyOn(ctx, "fill").mockImplementation(() => {
    const style = String(ctx.fillStyle);
    const match = RGBA_PATTERN.exec(style);
    if (!match) {
      return;
    }
    const rgb = `${match[1]}, ${match[2]}, ${match[3]}`;
    const a = Number(match[4]);
    if (rgb === RED_RGB) {
      seen.red = Math.max(seen.red, a);
    } else if (rgb === GREEN_RGB) {
      seen.green = Math.max(seen.green, a);
    }
  });
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return seen;
}

describe("GT-026: đèn giao thông (BR-E026-12)", () => {
  it("màu đèn dùng token, không hex tự chế", () => {
    expect(designTokens.colors.montessori.coral).toBe("#c00500");
    expect(designTokens.colors.montessori.emeraldBright).toBe("#2ecc71");
  });

  it("lượt go bật đèn xanh, lượt nogo bật đèn đỏ", () => {
    const { session, rs } = open();
    expect(session.getCurrentTrial()?.kind).toBe("go");
    litAlpha(session, rs, 1000);
    const go = litAlpha(session, rs, 1400);
    expect(go.green).toBe(1);
    expect(go.red).toBeLessThan(0.3);

    const nogoIndex = content.trials.findIndex((t) => t.kind === "nogo");
    for (let i = 0; i < nogoIndex; i++) {
      session.onTapStimulus();
      // qua nhịp nghỉ để tới kích thích kế tiếp
      session.update(difficulty.isi_ms + 1);
    }
    expect(session.getCurrentTrial()?.kind).toBe("nogo");
    litAlpha(session, rs, 5000);
    const nogo = litAlpha(session, rs, 5400);
    expect(nogo.red).toBe(1);
    expect(nogo.green).toBeLessThan(0.3);
  });

  it("cổng cử chỉ đóng thì không vẽ đèn nào — không báo trước đáp án (BR-E026-04)", () => {
    const { session, rs } = open();
    session.setInputOpen(false);
    expect(litAlpha(session, rs, 1000)).toEqual({ red: 0, green: 0 });
  });

  it("trong nhịp nghỉ giữa hai kích thích không có đèn nào (BR-E026-04)", () => {
    const { session, rs } = open();
    session.onTapStimulus();
    expect(session.getState()).not.toBe("stimulus");
    expect(litAlpha(session, rs, 1000)).toEqual({ red: 0, green: 0 });
  });

  it("đèn sáng dần khi bật, và reduced-motion sáng đủ ngay", () => {
    const { session, rs } = open();
    litAlpha(session, rs, 1000);
    const early = litAlpha(session, rs, 1050);
    expect(early.green).toBeGreaterThan(0.18);
    expect(early.green).toBeLessThan(1);
    expect(litAlpha(session, rs, 1400).green).toBe(1);

    const reduced = open();
    reduced.rs.reducedMotion = true;
    expect(litAlpha(reduced.session, reduced.rs, 2000).green).toBe(1);
  });
});

describe("GT-026: hình học đèn (hàm thuần)", () => {
  const slot: Slot = {
    index: 0,
    x: 400,
    y: 300,
    w: 240,
    h: 240,
    hitW: 240,
    hitH: 240,
    page: 0,
    role: "source",
  };

  it("đèn và vật kích thích không chồng nhau và cùng nằm trong ô", () => {
    const light = trafficLightBox(slot);
    const stim = trafficStimulusSlot(slot);
    expect(light.x).toBeGreaterThanOrEqual(slot.x - slot.w / 2);
    expect(light.x + light.w).toBeLessThan(stim.x - stim.w / 2);
    expect(stim.x + stim.w / 2).toBeLessThanOrEqual(slot.x + slot.w / 2);
  });

  it("độ sáng: 0 lúc bật, 1 sau 220 ms, reduced-motion luôn 1", () => {
    expect(trafficLampGlow(0, false)).toBe(0);
    expect(trafficLampGlow(110, false)).toBeCloseTo(0.5, 5);
    expect(trafficLampGlow(220, false)).toBe(1);
    expect(trafficLampGlow(0, true)).toBe(1);
  });
});
