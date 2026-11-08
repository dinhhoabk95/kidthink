import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawIsometricModel } from "#src/render/board-shapes";
import {
  drawStoryCharacterInStage,
  placeStoryCharacter,
  STORY_CHARACTER_SIZE_PX,
} from "#src/render/craft-shapes";
import type { SceneBox } from "#src/render/types";
import { RenderSystem } from "#src/systems/render-system";
import { GT017_FIXTURES } from "#src/templates/GT-017/fixtures.js";
import { BlockStackSession } from "#src/templates/GT-017/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawStoryCharacterInStage: vi.fn(actual.drawStoryCharacterInStage),
  };
});

vi.mock("#src/render/board-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/board-shapes")>();
  return { ...actual, drawIsometricModel: vi.fn(actual.drawIsometricModel) };
});

/** Hải Ly ở góc trống, không che mô hình khối trẻ cần đếm (`BR-E017-06`). */
type Fixture = (typeof GT017_FIXTURES)[number];

function openSession(fixture: Fixture): BlockStackSession {
  const session = new BlockStackSession(fixture.content, fixture.difficulty, 0);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    stageRows: session.stageRowCount,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    zones.stage,
    zones.tray ?? undefined
  );
  return session;
}

function frame(session: BlockStackSession): void {
  vi.mocked(drawStoryCharacterInStage).mockClear();
  vi.mocked(drawIsometricModel).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
}

function overlaps(
  cx: number,
  cy: number,
  half: number,
  box: SceneBox
): boolean {
  return (
    cx + half > box.x &&
    cx - half < box.x + box.w &&
    cy + half > box.y &&
    cy - half < box.y + box.h
  );
}

describe("GT-017: Hải Ly (BR-E017-06)", () => {
  it("mọi fixture: vẽ đúng một Hải Ly, trước mô hình khối và không chồng hộp vẽ mô hình", () => {
    for (const fixture of GT017_FIXTURES) {
      const session = openSession(fixture);
      frame(session);
      const calls = vi.mocked(drawStoryCharacterInStage).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0]?.[1]).toBe("beaver");
      const charOrder =
        vi.mocked(drawStoryCharacterInStage).mock.invocationCallOrder[0] ?? 0;
      const modelOrder =
        vi.mocked(drawIsometricModel).mock.invocationCallOrder[0] ?? 0;
      expect(charOrder).toBeLessThan(modelOrder);
      const modelBox = vi.mocked(drawIsometricModel).mock.calls[0]?.[1];
      const spot = placeStoryCharacter(calls[0]?.[2], session.slots);
      if (!(modelBox && spot)) {
        throw new Error(
          `Thiếu mô hình hoặc góc trống: ${fixture.content.prompt}`
        );
      }
      expect(
        overlaps(spot.cx, spot.cy, STORY_CHARACTER_SIZE_PX / 2, modelBox)
      ).toBe(false);
    }
  });

  it("vẽ nhân vật không đổi vùng chạm hay góc xoay mô hình", () => {
    for (const fixture of GT017_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      const rotation = session.rotateModel("cw");
      frame(session);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
      expect(session.getCurrentRotation()).toBe(rotation);
    }
  });
});
