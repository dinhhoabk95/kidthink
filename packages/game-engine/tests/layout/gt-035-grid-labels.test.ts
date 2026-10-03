import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035Session } from "#src/templates/GT-035/session";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * GT-035: nhãn "RIGHT" dưới ô robot và "ĐÍCH" dưới ô đích chỉ vẽ khi khoảng giữa
 * hai hàng lưới còn chỗ cho dải nhãn. QA 2026-10-03 ở 390x844: layout bỏ dải nhãn
 * vì sân khấu thấp, nhãn vẫn vẽ và bị hàng ô dưới che một phần.
 */
const BAND: AgeBand = "5-6";
const FRAMES = [
  { name: "portrait 330x697", w: 330, h: 697 },
  { name: "điện thoại ngang 610x350", w: 610, h: 350 },
  { name: "máy tính 964x628", w: 964, h: 628 },
] as const;
const GRID_LABELS = new Set(["RIGHT", "LEFT", "UP", "DOWN", "ĐÍCH"]);
const LABEL_TEXT_PX = 14;

interface LabelCall {
  readonly text: string;
  readonly y: number;
}

function renderLabels(session: GT035Session, frame: (typeof FRAMES)[number]) {
  const space = deriveLogicSpace(frame.w, frame.h);
  const cssPerLogic = Math.min(frame.w / space.w, frame.h / space.h);
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: BAND, cssPerLogic },
    session
  );
  session.prepareRound(BAND, space, zones.stage, undefined, cssPerLogic);
  const ctx = createFakeCanvas(space.w, space.h).getContext("2d");
  if (!ctx) {
    throw new Error("không có context");
  }
  const calls: LabelCall[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text, _x, y) => {
    if (GRID_LABELS.has(String(text))) {
      calls.push({ text: String(text), y });
    }
  });
  const rs = new RenderSystem();
  rs.logicSpace = space;
  session.render(ctx as CanvasRenderingContext2D, rs);
  return calls;
}

function overlapsAnyOtherCell(session: GT035Session, call: LabelCall): boolean {
  const { rows, cols } = session.content.grid;
  return session.slots.slice(0, rows * cols).some((slot) => {
    const top = slot.y - slot.hitH / 2;
    const bottom = slot.y + slot.hitH / 2;
    const isOwn = call.y >= slot.y && call.y <= bottom;
    return !isOwn && call.y < bottom && call.y + LABEL_TEXT_PX > top;
  });
}

describe("GT-035 — nhãn ô lưới không đè lên hàng dưới", () => {
  const fixture = GT035_FIXTURES[0];

  it.each(FRAMES)("$name: không nhãn nào chạm ô hàng khác", (frame) => {
    if (!fixture) {
      throw new Error("thiếu fixture GT-035");
    }
    const session = new GT035Session(fixture.content, fixture.difficulty, 0);

    const calls = renderLabels(session, frame);

    expect(calls.filter((call) => overlapsAnyOtherCell(session, call))).toEqual(
      []
    );
  });
});
