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
const PROMPT = "Bé hãy chọn đúng con mèo nhé!";

interface TextCall {
  readonly text: string;
  readonly y: number;
}

function drawWithRecorder(logicW: number): TextCall[] {
  const ctx = createFakeCanvas(logicW, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  const calls: TextCall[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text, _x, y) => {
    calls.push({ text, y });
  });
  const rs = new RenderSystem();
  rs.logicSpace = { w: logicW, h: 540 };
  const zones = computeStageZones({
    logicW,
    logicH: 540,
    ageBand: "3-4",
    cssPerLogic: 0.7,
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
    const lines = drawWithRecorder(540).map((call) => call.text);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(PROMPT);
    expect(lines.some((line) => line.endsWith("…"))).toBe(false);
  });

  it("vùng rộng: câu nằm trên một dòng", () => {
    expect(drawWithRecorder(1280).map((call) => call.text)).toEqual([PROMPT]);
  });
});
