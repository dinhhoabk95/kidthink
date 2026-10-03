import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import type { LogicSpace } from "#src/layout/constants";
import {
  computeStageZones,
  type StageZones,
  type ZoneRect,
} from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { RenderSystem } from "#src/systems/render-system";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";
import { GT003OldCoordsTraySession } from "#tests/templates/fixtures/gt-003-tray-old-coords";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return {
    ...actual,
    // Nền cảnh phủ cả canvas là lớp của shell, không phải lệnh vẽ của engine.
    drawSceneBackground: vi.fn(),
  };
});

function firstFixture(): NonNullable<(typeof GT003_FIXTURES)[number]> {
  const fixture = GT003_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT003_FIXTURES[0] must exist");
  }
  return fixture;
}

const FIXTURE = firstFixture();

/** Sai số làm tròn toạ độ khi so một lệnh vẽ với rect vùng. */
const EPSILON_PX = 1;

interface Viewport {
  readonly name: string;
  readonly space: LogicSpace;
  readonly band: AgeBand;
}

const VIEWPORTS: readonly Viewport[] = [
  { name: "landscape 960x540", space: { w: 960, h: 540 }, band: "4-5" },
  {
    name: "landscape 960x540 band 3-4",
    space: { w: 960, h: 540 },
    band: "3-4",
  },
  { name: "portrait 540x960", space: { w: 540, h: 960 }, band: "5-6" },
];

interface DrawRecord {
  readonly name: string;
  readonly rect: ZoneRect;
}

function zonesFor(viewport: Viewport): StageZones {
  return computeStageZones({
    logicW: viewport.space.w,
    logicH: viewport.space.h,
    ageBand: viewport.band,
    cssPerLogic: 1,
    needsTray: true,
    needsCommit: false,
  });
}

function trayOf(zones: StageZones): ZoneRect {
  if (!zones.tray) {
    throw new Error("zones.tray must exist when needsTray is true");
  }
  return zones.tray;
}

function openInZones<T extends GT003Session>(
  session: T,
  viewport: Viewport
): { session: T; zones: StageZones } {
  const zones = zonesFor(viewport);
  session.prepareRound(
    viewport.band,
    viewport.space,
    zones.stage,
    trayOf(zones)
  );
  return { session, zones };
}

function openGT003(viewport: Viewport): {
  session: GT003Session;
  zones: StageZones;
} {
  return openInZones(
    new GT003Session(FIXTURE.content, FIXTURE.difficulty, 1),
    viewport
  );
}

interface AxisTransform {
  readonly sx: number;
  readonly sy: number;
  readonly tx: number;
  readonly ty: number;
}

const IDENTITY_TRANSFORM: AxisTransform = { sx: 1, sy: 1, tx: 0, ty: 0 };

function applyTransform(t: AxisTransform, rect: ZoneRect): ZoneRect {
  const x0 = t.tx + rect.x * t.sx;
  const y0 = t.ty + rect.y * t.sy;
  const x1 = t.tx + (rect.x + rect.w) * t.sx;
  const y1 = t.ty + (rect.y + rect.h) * t.sy;
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0),
  };
}

function intersect(a: ZoneRect, b: ZoneRect): ZoneRect {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  };
}

/** Ghi mọi lệnh vẽ có toạ độ của một khung hình thành hộp bao. */
function recordDraws(session: GT003Session): DrawRecord[] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  const records: DrawRecord[] = [];
  // Chỉ theo dõi dời và co giãn — primitive vẽ quanh tâm slot bằng
  // `translate` + `scale`, toạ độ thô của chúng là toạ độ cục bộ.
  // Vùng cắt (`clip` sau `rect`) cũng thuộc trạng thái save/restore: nét tràn
  // ra ngoài vùng cắt không thành pixel nên chỉ phần giao mới tính.
  let transform: AxisTransform = IDENTITY_TRANSFORM;
  let clipRect: ZoneRect | null = null;
  let pendingRect: ZoneRect | null = null;
  const stack: { transform: AxisTransform; clipRect: ZoneRect | null }[] = [];
  vi.spyOn(ctx, "save").mockImplementation(() => {
    stack.push({ transform, clipRect });
  });
  vi.spyOn(ctx, "restore").mockImplementation(() => {
    const state = stack.pop();
    transform = state?.transform ?? IDENTITY_TRANSFORM;
    clipRect = state?.clipRect ?? null;
  });
  vi.spyOn(ctx, "rect").mockImplementation((x, y, w, h) => {
    pendingRect = applyTransform(transform, { x, y, w, h });
  });
  vi.spyOn(ctx, "clip").mockImplementation(() => {
    clipRect = pendingRect;
  });
  vi.spyOn(ctx, "translate").mockImplementation((dx, dy) => {
    transform = {
      ...transform,
      tx: transform.tx + dx * transform.sx,
      ty: transform.ty + dy * transform.sy,
    };
  });
  vi.spyOn(ctx, "scale").mockImplementation((kx, ky) => {
    transform = { ...transform, sx: transform.sx * kx, sy: transform.sy * ky };
  });
  const push = (name: string, x: number, y: number, w = 0, h = 0) => {
    const drawn = applyTransform(transform, { x, y, w, h });
    records.push({ name, rect: clipRect ? intersect(drawn, clipRect) : drawn });
  };
  vi.spyOn(ctx, "roundRect").mockImplementation((x, y, w, h) =>
    push("roundRect", x, y, w, h)
  );
  vi.spyOn(ctx, "fillRect").mockImplementation((x, y, w, h) =>
    push("fillRect", x, y, w, h)
  );
  vi.spyOn(ctx, "strokeRect").mockImplementation((x, y, w, h) =>
    push("strokeRect", x, y, w, h)
  );
  vi.spyOn(ctx, "arc").mockImplementation((x, y, r) =>
    push("arc", x - r, y - r, 2 * r, 2 * r)
  );
  vi.spyOn(ctx, "fillText").mockImplementation((_text, x, y) =>
    push("fillText", x, y)
  );
  vi.spyOn(ctx, "moveTo").mockImplementation((x, y) => push("moveTo", x, y));
  vi.spyOn(ctx, "lineTo").mockImplementation((x, y) => push("lineTo", x, y));

  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  return records;
}

function isRectInside(inner: ZoneRect, outer: ZoneRect): boolean {
  return (
    inner.x >= outer.x - EPSILON_PX &&
    inner.y >= outer.y - EPSILON_PX &&
    inner.x + inner.w <= outer.x + outer.w + EPSILON_PX &&
    inner.y + inner.h <= outer.y + outer.h + EPSILON_PX
  );
}

function isSameRect(a: ZoneRect, b: ZoneRect): boolean {
  return (
    Math.abs(a.x - b.x) <= EPSILON_PX &&
    Math.abs(a.y - b.y) <= EPSILON_PX &&
    Math.abs(a.w - b.w) <= EPSILON_PX &&
    Math.abs(a.h - b.h) <= EPSILON_PX
  );
}

function slotBox(slot: Slot): ZoneRect {
  return {
    x: slot.x - slot.w / 2,
    y: slot.y - slot.h / 2,
    w: slot.w,
    h: slot.h,
  };
}

/** Mảnh của dock gỗ: `roundRect` trải đúng bề ngang khay (mặt dock, tấm đáy). */
function isDockPiece(draw: DrawRecord, tray: ZoneRect): boolean {
  return (
    draw.name === "roundRect" &&
    Math.abs(draw.rect.x - tray.x) <= EPSILON_PX &&
    Math.abs(draw.rect.w - tray.w) <= EPSILON_PX
  );
}

function unionRect(draws: readonly DrawRecord[]): ZoneRect | null {
  if (draws.length === 0) {
    return null;
  }
  const left = Math.min(...draws.map((d) => d.rect.x));
  const top = Math.min(...draws.map((d) => d.rect.y));
  const right = Math.max(...draws.map((d) => d.rect.x + d.rect.w));
  const bottom = Math.max(...draws.map((d) => d.rect.y + d.rect.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * Vi phạm khay của một khung hình: khay không vẽ đúng `zones.tray`, hoặc có
 * lệnh vẽ rơi ra ngoài cả sân khấu lẫn khay (`BR-PSZ-01`).
 */
function collectTrayViolations(
  session: GT003Session,
  zones: StageZones
): string[] {
  const tray = trayOf(zones);
  const draws = recordDraws(session);
  const violations: string[] = [];
  const dock = unionRect(draws.filter((d) => isDockPiece(d, tray)));
  if (!(dock && isSameRect(dock, tray))) {
    violations.push(`không có khay vẽ đúng zones.tray ${JSON.stringify(tray)}`);
  }
  for (const d of draws) {
    if (!(isRectInside(d.rect, zones.stage) || isRectInside(d.rect, tray))) {
      violations.push(
        `${d.name} ${JSON.stringify(d.rect)} ngoài sân khấu và khay`
      );
    }
  }
  return violations;
}

describe("GT-003 — khay chung (Task #277 S5, BR-PSZ-01)", () => {
  it("khai needsTray để shell cấp zones.tray", () => {
    const session = new GT003Session(FIXTURE.content, FIXTURE.difficulty, 1);
    expect(session.needsTray).toBe(true);
  });

  for (const viewport of VIEWPORTS) {
    describe(viewport.name, () => {
      it("vẽ khay đúng zones.tray và không vẽ ra ngoài sân khấu và khay", () => {
        const { session, zones } = openGT003(viewport);
        expect(collectTrayViolations(session, zones)).toEqual([]);
      });

      it("mọi slot nguồn nằm trọn trong khay", () => {
        const { session, zones } = openGT003(viewport);
        const tray = trayOf(zones);
        expect(session.sourceSlots).toHaveLength(FIXTURE.content.items.length);
        for (const slot of session.sourceSlots) {
          expect(isRectInside(slotBox(slot), tray)).toBe(true);
        }
      });

      it("đích chứa nằm trọn trong sân khấu", () => {
        const { session, zones } = openGT003(viewport);
        const box = session.getContainerBox();
        if (!box) {
          throw new Error("container box must exist");
        }
        const boxRect = {
          x: box.x - box.w / 2,
          y: box.y - box.h / 2,
          w: box.w,
          h: box.h,
        };
        expect(isRectInside(boxRect, zones.stage)).toBe(true);
      });
    });
  }

  it("ca âm: khay vẽ ở toạ độ cũ thì phép kiểm báo vi phạm", () => {
    const viewport = VIEWPORTS[0];
    if (!viewport) {
      throw new Error("viewport must exist");
    }
    const { session, zones } = openInZones(
      new GT003OldCoordsTraySession(FIXTURE.content, FIXTURE.difficulty, 1),
      viewport
    );
    expect(collectTrayViolations(session, zones).length).toBeGreaterThan(0);
  });
});

describe("GT-003 — kéo từ khay vào sân khấu và tap-tap fallback (BR-ENG-06)", () => {
  const viewport: Viewport = {
    name: "landscape band 3-4",
    space: { w: 960, h: 540 },
    band: "3-4",
  };

  function correctSlot(session: GT003Session): Slot {
    const index = session.displayItems.findIndex((i) => i.is_correct);
    const slot = session.sourceSlots[index];
    if (!slot) {
      throw new Error("source slot of a correct item must exist");
    }
    return slot;
  }

  function containerCenter(session: GT003Session): { x: number; y: number } {
    const box = session.getContainerBox();
    if (!box) {
      throw new Error("container box must exist");
    }
    return { x: box.x, y: box.y };
  }

  it("kéo vật đúng từ khay thả vào đích trên sân khấu: action hợp lệ", () => {
    const { session } = openGT003(viewport);
    const from = correctSlot(session);
    const to = containerCenter(session);
    const result = session.dispatch({
      type: "drop",
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      timeMs: 100,
    });
    expect(result?.valid).toBe(true);
  });

  it("chạm vật trong khay rồi chạm đích: cùng kết quả với kéo thả", () => {
    const { session } = openGT003(viewport);
    const from = correctSlot(session);
    const to = containerCenter(session);

    session.dispatch({ type: "tap", x: from.x, y: from.y, timeMs: 10 });
    expect(session.getStagedItemId()).not.toBeNull();

    const result = session.dispatch({
      type: "tap",
      x: to.x,
      y: to.y,
      timeMs: 20,
    });
    expect(result?.valid).toBe(true);
    expect(session.getPlacements().size).toBe(1);
  });
});
