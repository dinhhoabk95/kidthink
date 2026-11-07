import { describe, expect, it, vi } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * Task #313 Phase 3 — GT-029: vật bớt rời nhóm thật (`BR-E029-03`): nhóm còn
 * lại dồn lại, vật bớt nằm ở vùng tách bạch, không chữ "Đã bớt".
 */
function build(): GT029Session {
  const f = GT029_FIXTURES[0];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT029Session(f.content, f.difficulty, 1);
  const space = deriveLogicSpace(964, 628);
  const cssPerLogic = 964 / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "4-5",
    cssPerLogic,
    needsTray: false,
    needsCommit: false,
  });
  session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
  return session;
}

function at(session: GT029Session, id: string) {
  const e = session.getView().entities.find((x) => x.id === id);
  if (!e) {
    throw new Error(`Thiếu ${id}`);
  }
  return e;
}

describe("GT-029 — vật bớt rời nhóm (BR-E029-03)", () => {
  it("bớt vật đầu: các vật còn lại dồn lên, vật bớt sang ô cuối", () => {
    const session = build();
    const before = {
      first: at(session, "apple_1"),
      second: at(session, "apple_2"),
      last: at(session, "apple_5"),
    };
    session.commit({ type: "remove_item", data: { item_id: "apple_1" } });
    const after = {
      first: at(session, "apple_1"),
      second: at(session, "apple_2"),
    };
    // apple_2 dồn vào ô đầu nhóm; apple_1 rời sang ô cuối của lưới.
    expect([after.second.x, after.second.y]).toEqual([
      before.first.x,
      before.first.y,
    ]);
    expect([after.first.x, after.first.y]).toEqual([
      before.last.x,
      before.last.y,
    ]);
    expect(before.second.x).not.toBe(after.second.x);
  });

  it("chạm vào chỗ vật bớt đang nằm thì trả nó về nhóm", () => {
    const session = build();
    session.commit({ type: "remove_item", data: { item_id: "apple_1" } });
    const removed = at(session, "apple_1");
    const action = session.toAction({
      type: "tap",
      x: removed.x,
      y: removed.y,
      timeMs: 0,
    });
    expect(action).toEqual({
      type: "remove_item",
      data: { item_id: "apple_1" },
    });
    session.commit({ type: "remove_item", data: { item_id: "apple_1" } });
    expect(session.getRemovedCount()).toBe(0);
  });

  it("không vẽ chữ 'Đã bớt' trên vật và nhãn view không có chữ đó", () => {
    const session = build();
    session.commit({ type: "remove_item", data: { item_id: "apple_1" } });
    expect(at(session, "apple_1").label ?? "").not.toContain("Đã bớt");
    const ctx = createFakeCanvas(964, 628).getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get context from fake canvas");
    }
    const texts: string[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
      texts.push(text);
    });
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    expect(texts).not.toContain("Đã bớt");
  });

  it("gợi ý trỏ vào ô đang chứa vật chưa bớt", () => {
    const session = build();
    session.commit({ type: "remove_item", data: { item_id: "apple_1" } });
    const hint = session.getHintTargetIndex();
    const hinted = session.getView().entities.find((e) => e.slotIndex === hint);
    expect(hinted?.id).toBe("apple_2");
  });
});
