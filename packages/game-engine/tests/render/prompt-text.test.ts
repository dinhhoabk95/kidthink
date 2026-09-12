import { describe, expect, it } from "vitest";
import { wrapPromptText } from "#src/render/shared-render.js";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

describe("Prompt text wrapping (BR-ERC-15)", () => {
  const getCanvasContext = (): CanvasRenderingContext2D => {
    const fake = createFakeCanvas(960, 540);
    const ctx = fake.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get context from fake canvas");
    }
    return ctx as CanvasRenderingContext2D;
  };

  it("short prompt stays on a single line", () => {
    const ctx = getCanvasContext();
    const prompt = "Chọn số 5";
    const lines = wrapPromptText(ctx, prompt, 300);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("Chọn số 5");
  });

  it("long prompt of 60 Vietnamese characters wraps into multiple lines without overflowing maxLineWidth (T2.4)", () => {
    const ctx = getCanvasContext();
    const prompt =
      "Bé hãy chọn nhóm có số lượng chấm tròn tương ứng với thẻ số";
    expect(prompt.length).toBeGreaterThanOrEqual(58);

    // maxLineWidth = 250px (at 10px/char, ~25 chars per line)
    const lines = wrapPromptText(ctx, prompt, 250);
    expect(lines.length).toBeGreaterThanOrEqual(2);

    // Verify each line does not overflow maxLineWidth
    for (const line of lines) {
      expect(ctx.measureText(line).width).toBeLessThanOrEqual(250);
    }
  });

  it("handles empty text safely", () => {
    const ctx = getCanvasContext();
    expect(wrapPromptText(ctx, "", 300)).toEqual([]);
  });

  it("negative test: line wider than maxLineWidth without wrapping would exceed threshold (T2.5)", () => {
    const ctx = getCanvasContext();
    const prompt =
      "Bé hãy chọn nhóm có số lượng chấm tròn tương ứng với thẻ số";
    const unwrappedWidth = ctx.measureText(prompt).width;
    const maxLineWidth = 250;

    // The unwrapped single-line width exceeds maxLineWidth
    expect(unwrappedWidth).toBeGreaterThan(maxLineWidth);

    // Wrapped lines must strictly be within maxLineWidth
    const lines = wrapPromptText(ctx, prompt, maxLineWidth);
    for (const line of lines) {
      expect(ctx.measureText(line).width).toBeLessThanOrEqual(maxLineWidth);
    }
  });
});
