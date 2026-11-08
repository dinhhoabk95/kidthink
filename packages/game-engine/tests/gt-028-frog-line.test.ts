import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { splitCaption } from "#src/layout/slot-fit";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawStepGroupIcon,
  FROG_HOP_MS,
  frogHopPose,
  frogLineLayout,
  stepGroupUnitCount,
} from "#src/render/number-line";
import { RenderSystem } from "#src/systems/render-system";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Tia số + ếch nhảy, nhóm theo `step` (`BR-E028-08`, `BR-E028-09`). */
const FIXTURE = GT028_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-028");
}

const STAGE = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
}).stage;
const CAPTION = splitCaption(STAGE).caption;
/** Trục dài theo số vật, không theo đích (`BR-E028-08`). */
const TICKS = FIXTURE.content.items.length;

describe("frogLineLayout (hàm thuần)", () => {
  it("có đủ mốc 0..N, tăng dần, nằm trong dải nhãn", () => {
    const l = frogLineLayout(CAPTION, TICKS);
    expect(l.tickXs).toHaveLength(TICKS + 1);
    for (let i = 1; i < l.tickXs.length; i++) {
      expect(l.tickXs[i]).toBeGreaterThan(l.tickXs[i - 1] ?? 0);
    }
    expect(l.tickXs[0]).toBeGreaterThanOrEqual(CAPTION.x);
    expect(l.overflowX).toBeLessThanOrEqual(CAPTION.x + CAPTION.w);
    expect(l.lineY).toBeGreaterThanOrEqual(CAPTION.y);
    expect(l.lineY).toBeLessThanOrEqual(CAPTION.y + CAPTION.h);
    expect(l.frogSize).toBeGreaterThanOrEqual(18);
  });
});

describe("frogHopPose (hàm thuần)", () => {
  const layout = frogLineLayout(CAPTION, TICKS);

  it("đứng đúng mốc khi chưa nhảy hoặc nhảy xong", () => {
    const rest = frogHopPose(layout, 1, 1, 0, false);
    expect(rest.x).toBe(layout.tickXs[1]);
    const done = frogHopPose(layout, 1, 2, FROG_HOP_MS, false);
    expect(done.x).toBe(layout.tickXs[2]);
    expect(done.y).toBe(rest.y);
  });

  it("giữa cú nhảy ếch ở giữa hai mốc và nhấc lên khỏi trục", () => {
    const mid = frogHopPose(layout, 1, 2, FROG_HOP_MS / 2, false);
    const a = layout.tickXs[1] ?? 0;
    const b = layout.tickXs[2] ?? 0;
    expect(mid.x).toBeGreaterThan(a);
    expect(mid.x).toBeLessThan(b);
    expect(mid.y).toBeLessThan(frogHopPose(layout, 1, 1, 0, false).y);
  });

  it("nhảy lùi (hoàn tác) cũng đi về mốc trước", () => {
    const back = frogHopPose(layout, 3, 2, FROG_HOP_MS, false);
    expect(back.x).toBe(layout.tickXs[2]);
  });

  it("vượt mốc cuối dừng ở chỗ ngoài mút, không trùng mốc cuối", () => {
    const over = frogHopPose(layout, TICKS, TICKS + 1, FROG_HOP_MS, false);
    expect(over.x).toBe(layout.overflowX);
    expect(over.x).not.toBe(layout.tickXs[TICKS]);
    const far = frogHopPose(layout, TICKS + 1, TICKS + 5, FROG_HOP_MS, false);
    expect(far.x).toBe(layout.overflowX);
  });

  it("reduced-motion: tới thẳng mốc cuối, không nhấc lên", () => {
    const p = frogHopPose(layout, 1, 2, 10, true);
    expect(p.x).toBe(layout.tickXs[2]);
    expect(p.y).toBe(frogHopPose(layout, 1, 1, 0, false).y);
  });
});

describe("stepGroupUnitCount / drawStepGroupIcon", () => {
  it("2 là đôi tất, 5 là bàn tay, 10 là bó que tính", () => {
    expect(stepGroupUnitCount(2)).toBe(2);
    expect(stepGroupUnitCount(5)).toBe(5);
    expect(stepGroupUnitCount(10)).toBe(10);
  });

  it.each([2, 5, 10] as const)(
    "step %i vẽ đúng số đơn vị (roundRect)",
    (step) => {
      const ctx = createFakeCanvas(300, 300).getContext("2d");
      if (!ctx) {
        throw new Error("Không lấy được context");
      }
      const spy = vi.spyOn(ctx, "roundRect");
      drawStepGroupIcon(ctx as CanvasRenderingContext2D, 100, 100, 40, step);
      expect(spy).toHaveBeenCalledTimes(stepGroupUnitCount(step));
    }
  );
});

function frameEllipses(
  session: GT028Session,
  rs: RenderSystem,
  timeMs: number
): number[][] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const calls: number[][] = [];
  vi.spyOn(ctx, "ellipse").mockImplementation(
    (x: number, y: number, rx: number, ry: number) => {
      calls.push([x, y, rx, ry]);
    }
  );
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return calls;
}

function openSession(): GT028Session {
  const session = new GT028Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
  return session;
}

describe("GT-028: session vẽ ếch trên tia số (BR-E028-08)", () => {
  const layout = frogLineLayout(CAPTION, TICKS);

  it("chưa chạm: ếch đứng ở mốc 0", () => {
    const session = openSession();
    const rest = frogHopPose(layout, 0, 0, 0, false);
    const ellipses = frameEllipses(session, new RenderSystem(), 0);
    expect(ellipses.some(([x, y]) => x === rest.x && y === rest.y)).toBe(true);
  });

  it("chạm một vật: ếch nhảy sang mốc 1 theo đồng hồ khung, rồi đứng ở mốc 1", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frameEllipses(session, rs, 1000);
    const first = FIXTURE.content.items[0];
    if (!first) {
      throw new Error("Thiếu vật");
    }
    // vật bày theo hoán vị: chạm vật bất kỳ qua id
    session.onTapItem(first.item_id);
    const mid = frogHopPose(layout, 0, 1, FROG_HOP_MS / 2, false);
    const during = frameEllipses(session, rs, 1000 + FROG_HOP_MS / 2);
    expect(during.some(([x, y]) => x === mid.x && y === mid.y)).toBe(true);
    const end = frogHopPose(layout, 0, 1, FROG_HOP_MS, false);
    const after = frameEllipses(session, rs, 1000 + FROG_HOP_MS + 50);
    expect(after.some(([x, y]) => x === end.x && y === end.y)).toBe(true);
  });

  it("reduced-motion: giữa chừng ếch đã ở mốc cuối", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frameEllipses(session, rs, 1000);
    const first = FIXTURE.content.items[0];
    if (!first) {
      throw new Error("Thiếu vật");
    }
    session.onTapItem(first.item_id);
    const end = frogHopPose(layout, 0, 1, FROG_HOP_MS, true);
    const during = frameEllipses(session, rs, 1000 + 50);
    expect(during.some(([x, y]) => x === end.x && y === end.y)).toBe(true);
  });

  it("trục không lộ số lần cần nhảy: mốc cuối ứng với số vật, không với target_total / step", () => {
    // Fixture có số vật khác số lần cần nhảy, nên các ca vị trí ếch ở trên (đo
    // đúng toạ độ theo `frogLineLayout(CAPTION, số vật)`) sẽ đỏ nếu trục quay về
    // chia theo đích.
    expect(TICKS).not.toBe(FIXTURE.content.target_total / FIXTURE.content.step);
    const session = openSession();
    session.onTapItem(FIXTURE.content.items[0]?.item_id ?? "");
    const ellipses = frameEllipses(session, new RenderSystem(), FROG_HOP_MS);
    const atOne = frogHopPose(layout, 0, 1, FROG_HOP_MS, false);
    expect(ellipses.some(([x, y]) => x === atOne.x && y === atOne.y)).toBe(
      true
    );
  });

  it("tia số không chứa chữ cái và không in số đích (BR-E028-05, BR-E028-12: chỉ +n, cờ thay số đích)", () => {
    const session = openSession();
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    const texts: string[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
      texts.push(t);
    });
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    expect(texts).toContain(`+${FIXTURE.content.step}`);
    expect(texts).not.toContain(String(FIXTURE.content.target_total));
  });
});
