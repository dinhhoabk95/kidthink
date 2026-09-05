import { describe, expect, it } from "vitest";
import { drawSceneBackground, drawTargetHoverAura } from "#src/render/index.js";
import { RenderSystem } from "#src/systems/render-system";
import { GT002Session } from "#src/templates/GT-002/session";
import { createFakeCanvas } from "./fake-canvas.ts";

describe("Cổng đếm gradient và cache khung hình (BR-ENG-15)", () => {
  it("drawSceneBackground × 60 khung chỉ tạo đúng 2 gradient", () => {
    const rs = new RenderSystem();
    const canvas = createFakeCanvas(1280, 720);
    rs.setupCanvas(canvas as HTMLCanvasElement);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Missing fake context");
    }

    for (let i = 0; i < 60; i++) {
      drawSceneBackground(ctx as CanvasRenderingContext2D, rs);
    }
    expect(ctx.gradientCalls.length).toBe(2);
  });

  it("GT-002 × 60 khung chỉ tạo đúng 16 gradient", () => {
    const rs = new RenderSystem();
    const canvas = createFakeCanvas(1280, 720);
    rs.setupCanvas(canvas as HTMLCanvasElement);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Missing fake context");
    }

    const content = {
      prompt: "Chọn nhiều đáp án",
      target_criterion: "Màu đỏ",
      items: [
        {
          item_id: "1",
          asset: { kind: "emoji" as const, ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "2",
          asset: { kind: "emoji" as const, ref: "🍓" },
          is_correct: true,
        },
        {
          item_id: "3",
          asset: { kind: "emoji" as const, ref: "🍒" },
          is_correct: false,
        },
        {
          item_id: "4",
          asset: { kind: "emoji" as const, ref: "🍌" },
          is_correct: false,
        },
        {
          item_id: "5",
          asset: { kind: "emoji" as const, ref: "🍇" },
          is_correct: false,
        },
        {
          item_id: "6",
          asset: { kind: "emoji" as const, ref: "🍊" },
          is_correct: false,
        },
        {
          item_id: "7",
          asset: { kind: "emoji" as const, ref: "🍋" },
          is_correct: false,
        },
      ],
    };
    const difficulty = {
      distractor_count: 5,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    };
    const session = new GT002Session(content, difficulty);
    session.prepareRound("4-5");

    for (let i = 0; i < 60; i++) {
      session.render(ctx as CanvasRenderingContext2D, rs, i * 16.6);
    }
    expect(ctx.gradientCalls.length).toBe(16);
  });

  it("ca âm A: setupCanvas(canvas khác) giữa chừng vô hiệu hoá cache và tạo lại gradient", () => {
    const rs = new RenderSystem();
    const canvas1 = createFakeCanvas(1280, 720);
    rs.setupCanvas(canvas1 as HTMLCanvasElement);
    const ctx1 = canvas1.getContext("2d");
    if (!ctx1) {
      throw new Error("Missing fake context 1");
    }

    for (let i = 0; i < 30; i++) {
      drawSceneBackground(ctx1 as CanvasRenderingContext2D, rs);
    }
    expect(ctx1.gradientCalls.length).toBe(2);

    const canvas2 = createFakeCanvas(1280, 720);
    rs.setupCanvas(canvas2 as HTMLCanvasElement);
    const ctx2 = canvas2.getContext("2d");
    if (!ctx2) {
      throw new Error("Missing fake context 2");
    }

    for (let i = 0; i < 30; i++) {
      drawSceneBackground(ctx2 as CanvasRenderingContext2D, rs);
    }
    expect(ctx2.gradientCalls.length).toBe(2);
  });

  it("ca âm B: cùng rs nhưng đổi ctx (canvas khác chưa setupCanvas) phải tăng số đếm vì ctx nằm trong khoá", () => {
    const rs = new RenderSystem();
    const canvas1 = createFakeCanvas(1280, 720);
    rs.setupCanvas(canvas1 as HTMLCanvasElement);
    const ctx1 = canvas1.getContext("2d");
    if (!ctx1) {
      throw new Error("Missing fake context 1");
    }

    drawSceneBackground(ctx1 as CanvasRenderingContext2D, rs);
    expect(ctx1.gradientCalls.length).toBe(2);

    const canvas2 = createFakeCanvas(1280, 720);
    const ctx2 = canvas2.getContext("2d");
    if (!ctx2) {
      throw new Error("Missing fake context 2");
    }

    // Cùng rs, cùng kích thước, nhưng ctx khác
    drawSceneBackground(ctx2 as CanvasRenderingContext2D, rs);
    expect(ctx2.gradientCalls.length).toBe(2);
  });

  it("drawTargetHoverAura × 60 khung với phase đổi tạo đúng 60 gradient (không cache)", () => {
    const canvas = createFakeCanvas(1280, 720);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Missing fake context");
    }

    for (let i = 0; i < 60; i++) {
      drawTargetHoverAura(
        ctx as CanvasRenderingContext2D,
        100,
        100,
        50,
        i / 60
      );
    }
    expect(ctx.gradientCalls.length).toBe(60);
  });
});
