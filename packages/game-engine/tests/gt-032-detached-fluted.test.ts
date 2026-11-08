import { describe, expect, it, vi } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  drawDetachedWaterColumns,
  liquidCupRect,
} from "#src/render/craft-shapes";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/**
 * L3 của GT-032: cột nước tách khỏi cốc loe phải có diện tích bằng đúng lượng
 * nước ngay từ khung đầu (`progress` 0), không chỉ khi đã xếp cạnh nhau (`BR-E032-13`).
 */
const SLOT: Slot = {
  index: 0,
  x: 300,
  y: 300,
  w: 160,
  h: 200,
  hitW: 160,
  hitH: 200,
  page: 0,
  role: "target",
};

interface Pt {
  readonly x: number;
  readonly y: number;
}

function shoelace(points: readonly Pt[]): number {
  let sum = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    if (q) {
      sum += p.x * q.y - q.x * p.y;
    }
  });
  return Math.abs(sum) / 2;
}

/** Diện tích đa giác `moveTo` + `lineTo` (cột nước dạng hình thang) hoặc ô `roundRect`. */
function columnArea(
  shape: "standard" | "fluted",
  progress: number,
  fillUnits: number
): number {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const points: Pt[] = [];
  const rects: number[][] = [];
  let polygon = false;
  const record = (collect: Pt[]) => (x: number, y: number) => {
    collect.push({ x, y });
  };
  vi.spyOn(ctx, "moveTo").mockImplementation((x: number, y: number) => {
    // moveTo đầu tiên là vạch nền (đường kẻ ngang), bỏ qua; đa giác cột bắt đầu ở moveTo thứ hai.
    if (polygon) {
      points.push({ x, y });
    }
  });
  vi.spyOn(ctx, "lineTo").mockImplementation(record(points));
  vi.spyOn(ctx, "beginPath").mockImplementation(() => {
    polygon = true;
    points.length = 0;
  });
  vi.spyOn(ctx, "roundRect").mockImplementation(
    (x: number, y: number, w: number, h: number) => {
      rects.push([x, y, w, h]);
    }
  );
  drawDetachedWaterColumns(
    ctx as CanvasRenderingContext2D,
    [{ slot: SLOT, shape, capacityUnits: 4, fillUnits }],
    4,
    progress
  );
  const rect = rects.at(-1);
  if (shape === "fluted") {
    return shoelace(points.slice(-4));
  }
  return rect ? (rect[2] ?? 0) * (rect[3] ?? 0) : 0;
}

describe("GT-032 L3: cột nước tách khỏi cốc loe (BR-E032-13)", () => {
  const cup = liquidCupRect(SLOT, "fluted", 4, 4);
  for (const fill of [1, 2, 3]) {
    it(`cốc fluted ${fill}/4: khung đầu có diện tích bằng lượng nước`, () => {
      expect(columnArea("fluted", 0, fill)).toBeCloseTo(
        (cup.w * cup.h * fill) / 4,
        1
      );
    });
  }
  it("cốc thường không đổi: khung đầu là hình chữ nhật diện tích bằng lượng nước", () => {
    const std = liquidCupRect(SLOT, "standard", 4, 4);
    expect(columnArea("standard", 0, 2)).toBeCloseTo(
      (std.w * std.h * 2) / 4,
      1
    );
  });
});
