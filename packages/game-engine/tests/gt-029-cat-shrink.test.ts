import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  CAT_BITE_MS,
  CAT_SLIDE_MS,
  catMouthOpen,
  drawCat,
  groupSlidePose,
} from "#src/render/numeracy-primitives";
import { drawSlotItem } from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSlotItem: vi.fn(actual.drawSlotItem) };
});

vi.mock("#src/render/numeracy-primitives", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/numeracy-primitives")>();
  return { ...actual, drawCat: vi.fn(actual.drawCat) };
});

/** Nhóm còn lại co nhỏ có chuyển động và mèo vẽ vector (`BR-E029-10`, `BR-E029-11`). */
const FIXTURE = GT029_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-029");
}

const STAGE = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
}).stage;

describe("groupSlidePose (hàm thuần)", () => {
  const from = { x: 100, y: 200 };
  const to = { x: 40, y: 80 };

  it("bắt đầu ở ô cũ, kết thúc ở ô mới đúng cỡ", () => {
    expect(groupSlidePose(from, to, 0, false)).toEqual({
      x: 100,
      y: 200,
      scale: 1,
    });
    expect(groupSlidePose(from, to, CAT_SLIDE_MS, false)).toEqual({
      x: 40,
      y: 80,
      scale: 1,
    });
    expect(groupSlidePose(from, to, CAT_SLIDE_MS + 999, false)).toEqual({
      x: 40,
      y: 80,
      scale: 1,
    });
  });

  it("giữa chừng co nhỏ lại rồi nở về cỡ cũ, nằm giữa hai ô", () => {
    const mid = groupSlidePose(from, to, CAT_SLIDE_MS / 2, false);
    expect(mid.scale).toBeLessThan(1);
    expect(mid.scale).toBeGreaterThan(0.7);
    expect(mid.x).toBeLessThan(from.x);
    expect(mid.x).toBeGreaterThan(to.x);
  });

  it("reduced-motion: tới thẳng ô mới, không co", () => {
    expect(groupSlidePose(from, to, 10, true)).toEqual({
      x: 40,
      y: 80,
      scale: 1,
    });
  });

  it("không đổi ô thì đứng yên, không co", () => {
    expect(groupSlidePose(to, to, 50, false)).toEqual({
      x: 40,
      y: 80,
      scale: 1,
    });
  });
});

describe("catMouthOpen (hàm thuần)", () => {
  it("há miệng nhai trong nhịp ngoạm rồi ngậm lại", () => {
    const opens = new Set<boolean>();
    for (let ms = 0; ms < CAT_BITE_MS; ms += 20) {
      opens.add(catMouthOpen(ms, false));
    }
    expect(opens.has(true)).toBe(true);
    expect(opens.has(false)).toBe(true);
    expect(catMouthOpen(CAT_BITE_MS, false)).toBe(false);
    expect(catMouthOpen(CAT_BITE_MS + 500, false)).toBe(false);
  });

  it("chưa ngoạm (elapsed âm) hoặc reduced-motion: miệng ngậm", () => {
    expect(catMouthOpen(-1, false)).toBe(false);
    expect(catMouthOpen(10, true)).toBe(false);
  });
});

describe("drawCat", () => {
  it("vẽ thân mèo bằng vector, miệng há thêm một ellipse", () => {
    const closed = createFakeCanvas(200, 200).getContext("2d");
    const open = createFakeCanvas(200, 200).getContext("2d");
    if (!(closed && open)) {
      throw new Error("Không lấy được context");
    }
    const a = vi.spyOn(closed, "ellipse");
    const b = vi.spyOn(open, "ellipse");
    drawCat(closed as CanvasRenderingContext2D, 100, 100, 40, false);
    drawCat(open as CanvasRenderingContext2D, 100, 100, 40, true);
    expect(a.mock.calls.length).toBeGreaterThan(0);
    expect(b.mock.calls.length).toBe(a.mock.calls.length + 1);
  });
});

function openSession(): GT029Session {
  const session = new GT029Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
  return session;
}

function frame(session: GT029Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawSlotItem).mockClear();
  vi.mocked(drawCat).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

function slotOf(id: string): { x: number; y: number; w: number } | undefined {
  const call = vi.mocked(drawSlotItem).mock.calls.find((c) => c[3].id === id);
  return call ? { x: call[2].x, y: call[2].y, w: call[2].w } : undefined;
}

describe("GT-029: nhóm còn lại co nhỏ và trượt (BR-E029-10)", () => {
  it("vật đứng yên ở ô khi chưa bớt gì: đúng cỡ ô", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 0);
    const first = FIXTURE.content.initial_items[0];
    expect(first && slotOf(first.item_id)?.w).toBe(session.slots[0]?.w);
  });

  it("bớt một vật: các vật còn lại trượt về ô mới và co nhỏ giữa chừng, rồi đúng ô", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    const items = FIXTURE.content.initial_items;
    const [first, second] = items;
    if (!(first && second)) {
      throw new Error("Thiếu vật");
    }
    session.commit({ type: "remove_item", data: { item_id: first.item_id } });
    // vật thứ hai dồn về ô 0 sau khi vật đầu bị bớt
    const target = session.slots[0];
    const start = session.slots[1];
    if (!(target && start)) {
      throw new Error("Thiếu slot");
    }
    frame(session, rs, 1000 + CAT_SLIDE_MS / 2);
    const mid = slotOf(second.item_id);
    expect(mid).toBeDefined();
    expect(mid?.w).toBeLessThan(start.w);
    expect(mid?.x).not.toBe(target.x);
    frame(session, rs, 1000 + CAT_SLIDE_MS + 50);
    const done = slotOf(second.item_id);
    expect(done?.x).toBe(target.x);
    expect(done?.y).toBe(target.y);
    expect(done?.w).toBe(target.w);
  });

  it("reduced-motion: vật dồn thẳng về ô mới ngay khung đầu", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 1000);
    const [first, second] = FIXTURE.content.initial_items;
    if (!(first && second)) {
      throw new Error("Thiếu vật");
    }
    session.commit({ type: "remove_item", data: { item_id: first.item_id } });
    frame(session, rs, 1050);
    const target = session.slots[0];
    expect(slotOf(second.item_id)?.x).toBe(target?.x);
    expect(slotOf(second.item_id)?.w).toBe(target?.w);
  });

  it("vùng chạm (slots) không đổi theo hoạt ảnh", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    const first = FIXTURE.content.initial_items[0];
    if (first) {
      session.commit({ type: "remove_item", data: { item_id: first.item_id } });
    }
    frame(session, rs, 1100);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});

describe("GT-029: mèo ngoạm khi bớt (BR-E029-11)", () => {
  it("chưa bớt gì: mèo có mặt, miệng ngậm", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 0);
    const calls = vi.mocked(drawCat).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[4]).toBe(false);
  });

  it("vừa bớt một vật: mèo há miệng trong nhịp ngoạm theo đồng hồ khung", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    const first = FIXTURE.content.initial_items[0];
    if (!first) {
      throw new Error("Thiếu vật");
    }
    session.commit({ type: "remove_item", data: { item_id: first.item_id } });
    const seen = new Set<boolean>();
    for (let ms = 0; ms < CAT_BITE_MS; ms += 20) {
      frame(session, rs, 1000 + ms);
      seen.add(vi.mocked(drawCat).mock.calls[0]?.[4] ?? false);
    }
    expect(seen.has(true)).toBe(true);
    frame(session, rs, 1000 + CAT_BITE_MS + 100);
    expect(vi.mocked(drawCat).mock.calls[0]?.[4]).toBe(false);
  });

  it("hoàn lại một vật (bỏ bớt) thì mèo không ngoạm", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    const first = FIXTURE.content.initial_items[0];
    if (!first) {
      throw new Error("Thiếu vật");
    }
    session.commit({ type: "remove_item", data: { item_id: first.item_id } });
    frame(session, rs, 3000);
    session.commit({ type: "remove_item", data: { item_id: first.item_id } });
    frame(session, rs, 3040);
    expect(vi.mocked(drawCat).mock.calls[0]?.[4]).toBe(false);
  });
});
