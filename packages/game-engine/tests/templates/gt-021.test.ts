import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it, vi } from "vitest";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { RenderSystem } from "#src/systems/render-system";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures";
import { GT021Session } from "#src/templates/GT-021/session";

import { createFakeCanvas } from "../gates/fake-canvas.ts";

describe("GT-021 — dung sai chạm, nhãn đọc và đối xứng qua trục (BR-E021)", () => {
  const fixture = GT021_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-021 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT021Session {
    const session = new GT021Session(content, difficulty, 1);
    session.prepareRound("4-5");
    return session;
  }

  it("chạm lệch tâm trong dung sai 24px (TAP_TOLERANCE_PX) vào mảnh chọn và ô đích vẫn trúng", () => {
    const session = buildSession();
    const targetDef = content.target_slots[0];
    if (!targetDef) {
      throw new Error("Thiếu target_slots[0]");
    }
    const optIdx = content.options.findIndex(
      (o) => o.asset_ref === targetDef.expected_asset_ref
    );
    const sourceSlot = session.sourceSlots[optIdx];
    const targetSlot = session.targetSlots[0];
    if (!(sourceSlot && targetSlot)) {
      throw new Error("Thiếu sourceSlot hoặc targetSlot");
    }

    const srcOffset = sourceSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const tgtOffset = targetSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;

    session.dispatch({
      type: "tap",
      x: sourceSlot.x,
      y: sourceSlot.y + srcOffset,
      timeMs: 10,
    });
    expect(session.getStagedItemId()).toBe(content.options[optIdx]?.item_id);

    const res = session.dispatch({
      type: "tap",
      x: targetSlot.x,
      y: targetSlot.y + tgtOffset,
      timeMs: 20,
    });
    expect(res?.valid).toBe(true);
  });

  it("chạm vào ô mẫu tham chiếu (role neutral) không tính là lượt trả lời", () => {
    const session = buildSession();
    const neutralEntity = session
      .getView()
      .entities.find((e) => e.role === "neutral");
    if (!neutralEntity) {
      throw new Error("Thiếu neutralEntity");
    }

    const action = session.toAction({
      type: "tap",
      x: neutralEntity.x,
      y: neutralEntity.y,
      timeMs: 0,
    });
    expect(action).toBeNull();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("getView() cung cấp ID duy nhất và spokenLabel cho mẫu tham chiếu cùng lựa chọn", () => {
    const session = buildSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const neutralEntity = view.entities.find((e) => e.role === "neutral");
    const ref0 = content.reference_pattern[0];
    const expectedRefName =
      ref0?.asset.kind === "emoji"
        ? getByGlyph(ref0.asset.ref)?.name
        : undefined;
    expect(neutralEntity?.spokenLabel).toBe(expectedRefName);
    expect(neutralEntity?.hitShape).toBe("square");

    const sourceEntity = view.entities.find((e) => e.role === "source");
    const opt0 = content.options[0];
    const expectedOptName =
      opt0?.asset.kind === "emoji"
        ? getByGlyph(opt0.asset.ref)?.name
        : undefined;
    expect(sourceEntity?.spokenLabel).toBe(expectedOptName);
  });
});

describe("GT-021 — nửa phản chiếu vẽ lật gương thật (BR-E021-05)", () => {
  function flipCalls(axis: "vertical" | "horizontal"): {
    before: number[][];
    after: number[][];
  } {
    const fixture = GT021_FIXTURES[0];
    if (!fixture) {
      throw new Error("Fixture GT-021 not found");
    }
    const session = new GT021Session(
      { ...fixture.content, axis },
      fixture.difficulty,
      1
    );
    session.prepareRound("4-5");
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get context from fake canvas");
    }
    const calls: number[][] = [];
    vi.spyOn(ctx, "scale").mockImplementation((x, y) => {
      calls.push([x, y]);
    });
    const rs = new RenderSystem();
    session.render(ctx as CanvasRenderingContext2D, rs, 0);
    const isFlip = ([x, y]: number[]) => x === -1 || y === -1;
    const before = calls.filter(isFlip);
    const target = fixture.content.target_slots[0];
    const opt = fixture.content.options.find(
      (o) => o.asset_ref === target?.expected_asset_ref
    );
    if (!(target && opt)) {
      throw new Error("Thiếu ô đích hoặc mảnh đúng");
    }
    session.onPlaceOption(opt.item_id, target.slot_id);
    calls.length = 0;
    session.render(ctx as CanvasRenderingContext2D, rs, 16);
    return { before, after: calls.filter(isFlip) };
  }

  it("trục dọc: vật ở ô đích lật trái-phải, ô trống không lật", () => {
    const { before, after } = flipCalls("vertical");
    expect(before).toEqual([]);
    expect(after).toEqual([[-1, 1]]);
  });

  it("trục ngang: vật ở ô đích lật trên-dưới", () => {
    expect(flipCalls("horizontal").after).toEqual([[1, -1]]);
  });
});
