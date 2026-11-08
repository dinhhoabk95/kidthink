import { describe, expect, it, vi } from "vitest";
import {
  drawStoryCharacter,
  pickCharacterSpot,
  STORY_CHARACTER_KINDS,
} from "#src/render/craft-shapes";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Nhân vật kể chuyện vẽ vector dùng chung cho các khung chuyện (Task #313 Đợt A). */
const BOUNDS = { x: 0, y: 0, w: 400, h: 300 };

describe("drawStoryCharacter", () => {
  for (const kind of STORY_CHARACTER_KINDS) {
    it(`${kind}: vẽ bằng vector (màu token do cổng BR-ERC-05 giữ)`, () => {
      const ctx = createFakeCanvas(200, 200).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      const ellipse = vi.spyOn(ctx, "ellipse");
      drawStoryCharacter(ctx as CanvasRenderingContext2D, kind, 100, 100, 60);
      expect(ellipse.mock.calls.length).toBeGreaterThan(0);
    });
  }

  it("mỗi nhân vật vẽ khác nhau (chuỗi lời gọi ellipse không trùng)", () => {
    const sigs = new Set<string>();
    for (const kind of STORY_CHARACTER_KINDS) {
      const ctx = createFakeCanvas(200, 200).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      const ellipse = vi.spyOn(ctx, "ellipse");
      drawStoryCharacter(ctx as CanvasRenderingContext2D, kind, 100, 100, 60);
      sigs.add(JSON.stringify(ellipse.mock.calls));
    }
    expect(sigs.size).toBe(STORY_CHARACTER_KINDS.length);
  });
});

describe("pickCharacterSpot", () => {
  it("không có vật nào thì lấy góc trên-phải, trong khung", () => {
    const spot = pickCharacterSpot(BOUNDS, [], 40);
    expect(spot).not.toBeNull();
    if (spot) {
      expect(spot.cx + 20).toBeLessThanOrEqual(BOUNDS.w);
      expect(spot.cy - 20).toBeGreaterThanOrEqual(0);
      expect(spot.cx).toBeGreaterThan(BOUNDS.w / 2);
    }
  });

  it("góc bị vùng chạm chiếm thì chuyển sang góc khác, không chồng", () => {
    const blocked = { x: 300, y: 0, w: 100, h: 100 };
    const spot = pickCharacterSpot(BOUNDS, [blocked], 40);
    expect(spot).not.toBeNull();
    if (spot) {
      const overlaps =
        spot.cx + 20 > blocked.x &&
        spot.cx - 20 < blocked.x + blocked.w &&
        spot.cy + 20 > blocked.y &&
        spot.cy - 20 < blocked.y + blocked.h;
      expect(overlaps).toBe(false);
    }
  });

  it("cả bốn góc bị chiếm hoặc khung quá hẹp thì null", () => {
    const all = [{ x: 0, y: 0, w: 400, h: 300 }];
    expect(pickCharacterSpot(BOUNDS, all, 40)).toBeNull();
    expect(pickCharacterSpot({ x: 0, y: 0, w: 30, h: 30 }, [], 40)).toBeNull();
  });
});
