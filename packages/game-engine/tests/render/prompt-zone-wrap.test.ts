import { describe, expect, it, vi } from "vitest";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawPromptZone } from "#src/render/prompt-zone";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * QA 2026-10-03: ở 390 px lời dẫn "Bé hãy chọn đúng con mèo nhé!" bị cắt
 * "Bé hãy chọn đúng…" dù vùng lời dẫn cao 96 px CSS đủ hai dòng. Lời dẫn phải
 * ngắt dòng trước khi cắt.
 */
const FONT_PX = /(\d+(?:\.\d+)?)px/;
const PROMPT = "Bé hãy chọn đúng con mèo nhé!";

interface TextCall {
  readonly text: string;
  readonly y: number;
}

function drawWithRecorder(
  logicW: number,
  logicH: number,
  cssPerLogic: number
): TextCall[] {
  const ctx = createFakeCanvas(logicW, logicH).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  const calls: TextCall[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text, _x, y) => {
    calls.push({ text, y });
  });
  const rs = new RenderSystem();
  rs.logicSpace = { w: logicW, h: logicH };
  const zones = computeStageZones({
    logicW,
    logicH,
    ageBand: "5-6",
    cssPerLogic,
    needsTray: false,
    needsCommit: false,
  });
  drawPromptZone(ctx as CanvasRenderingContext2D, rs, zones, {
    promptText: PROMPT,
  });
  return calls.filter((call) => call.text !== "🔊");
}

describe("drawPromptZone — lời dẫn ngắt dòng thay vì cắt", () => {
  it("vùng hẹp: câu hiện đủ trên hai dòng, không có dấu cắt", () => {
    const lines = drawWithRecorder(540, 1140, 0.7).map((call) => call.text);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(PROMPT);
    expect(lines.some((line) => line.endsWith("…"))).toBe(false);
  });

  it("vùng rộng: câu nằm trên một dòng", () => {
    expect(drawWithRecorder(1280, 540, 1).map((call) => call.text)).toEqual([
      PROMPT,
    ]);
  });
});

describe("drawPromptZone — câu dài ở điện thoại 390 px (GT-034)", () => {
  it("câu đề dài xuống tới dòng thứ ba thay vì cắt '…' ở dòng hai", () => {
    const long = "Bé lắng nghe rồi gõ nối tiếp nhịp trống nhé!";
    const logicW = 480;
    const logicH = 1040;
    const ctx = createFakeCanvas(logicW, logicH).getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get context from fake canvas");
    }
    // Phông thật rộng ~0,5 em/ký tự; fake canvas đo hẹp hơn nên ép số đo thực tế.
    vi.spyOn(ctx, "measureText").mockImplementation((text) => {
      const px = Number.parseFloat(FONT_PX.exec(ctx.font)?.[1] ?? "16");
      return { width: text.length * px * 0.5 } as TextMetrics;
    });
    const calls: string[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation((text) => {
      calls.push(text);
    });
    const rs = new RenderSystem();
    rs.logicSpace = { w: logicW, h: logicH };
    const zones = computeStageZones({
      logicW,
      logicH,
      ageBand: "3-4",
      cssPerLogic: 390 / 480,
      needsTray: false,
      needsCommit: false,
    });
    drawPromptZone(ctx as CanvasRenderingContext2D, rs, zones, {
      promptText: long,
    });
    const lines = calls.filter((text) => text !== "🔊");
    expect(lines.join(" ")).toBe(long);
    expect(lines.some((line) => line.endsWith("…"))).toBe(false);
  });
});
