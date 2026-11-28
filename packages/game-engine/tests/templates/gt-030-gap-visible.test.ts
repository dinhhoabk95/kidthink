import { describe, expect, it } from "vitest";
import { touchFloorOf } from "#src/layout/touch-floor";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";
import { SOURCE_SLOT, STRIP_SLOT } from "#src/templates/GT-030/zone-layout";

/**
 * Task #313 Phase 3 — GT-030: ô đặt không vẽ sẵn (không lộ đáp số), thả lệch
 * quá dung sai thì đơn vị không bám và khe/chồng hiện ra (`BR-E030-05`, `BR-E030-06`).
 */
const found = GT030_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT030Session {
  const session = new GT030Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

/** Một ô đơn vị trên dải đo: cạnh `w` bằng bề dài dải chia số đơn vị. */
function unitSlot(session: GT030Session): { w: number } {
  const strip = session.slots[STRIP_SLOT];
  if (!strip) {
    throw new Error("Thiếu dải đo");
  }
  return { w: strip.w / f.content.object.length_in_units };
}

function dropGesture(session: GT030Session, dx: number) {
  const source = session.slots[SOURCE_SLOT];
  const next = session.getNextCellCenter();
  if (!(source && next)) {
    throw new Error("Thiếu slot");
  }
  return {
    type: "drop" as const,
    fromX: source.x,
    fromY: source.y,
    toX: next.x + dx,
    toY: next.y,
    timeMs: 10,
  };
}

function dropAt(session: GT030Session, dx: number, dy = 0) {
  const source = session.slots[SOURCE_SLOT];
  const next = session.getNextCellCenter();
  if (!(source && next)) {
    throw new Error("Thiếu slot");
  }
  return session.dispatch({
    type: "drop",
    fromX: source.x,
    fromY: source.y,
    toX: next.x + dx,
    toY: next.y + dy,
    timeMs: 10,
  });
}

describe("GT-030 — không vẽ sẵn số ô (BR-E030-05)", () => {
  it("view chỉ có đơn vị đã đặt và tối đa một mép kế tiếp, không đủ L ô", () => {
    const session = build();
    const cells = session
      .getView()
      .entities.filter((e) => e.id === "measure_strip");
    expect(cells.length).toBeLessThanOrEqual(1);
    dropAt(session, 0);
    dropAt(session, 0);
    const after = session
      .getView()
      .entities.filter((e) => e.id === "measure_strip");
    expect(after.length).toBeLessThanOrEqual(3);
    expect(after.length).toBeLessThan(f.content.object.length_in_units);
  });
});

describe("GT-030 — khe và chồng lấn nhìn thấy được (BR-E030-06)", () => {
  it("thả sát mép kế tiếp thì bám dính và đặt", () => {
    const session = build();
    const verdict = dropAt(session, 2);
    expect(verdict?.valid).toBe(true);
    expect(session.getPlacedUnitsCount()).toBe(1);
  });

  it("thả lệch 0,4 x sàn chạm thì engine tự căn và đặt đơn vị (BR-ENG-19)", () => {
    const session = build();
    const floor = touchFloorOf("5-6");
    for (const dx of [-0.4 * floor, 0.4 * floor]) {
      const s = build();
      expect(s.dispatch(dropGesture(s, dx))?.valid).toBe(true);
      expect(s.getPlacedUnitsCount()).toBe(1);
    }
    expect(session.getPlacedUnitsCount()).toBe(0);
  });

  it("thả chồng lên một đơn vị: không căn, vạch chồng vẫn hiện (RETRY)", () => {
    const session = build();
    const verdict = session.dispatch(
      dropGesture(session, -unitSlot(session).w)
    );
    expect(verdict?.valid).toBe(false);
    expect(session.getPlacedUnitsCount()).toBe(0);
  });

  it("thả hở quá dung sai: không bám, báo nhẹ, khe hiện ra", () => {
    const session = build();
    const next = unitSlot(session);
    if (!next) {
      throw new Error("Thiếu slot");
    }
    const verdict = dropAt(session, next.w * 0.6);
    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.getPlacedUnitsCount()).toBe(0);
    expect(session.getGapFlash()?.kind).toBe("gap");
  });

  it("thả chồng lấn quá dung sai: không bám, khe loại chồng", () => {
    const session = build();
    dropAt(session, 0);
    const next = unitSlot(session);
    if (!next) {
      throw new Error("Thiếu slot");
    }
    const verdict = dropAt(session, -next.w * 0.6);
    expect(verdict?.valid).toBe(false);
    expect(session.getPlacedUnitsCount()).toBe(1);
    expect(session.getGapFlash()?.kind).toBe("overlap");
  });

  it("khe tự tắt sau một nhịp", () => {
    const session = build();
    const next = unitSlot(session);
    if (!next) {
      throw new Error("Thiếu slot");
    }
    dropAt(session, next.w * 0.6);
    session.update(2000);
    expect(session.getGapFlash()).toBeNull();
  });

  it("chạm khay rồi chạm mép kế tiếp (lối thay thế) luôn đặt đúng chỗ", () => {
    const session = build();
    const source = session.slots[SOURCE_SLOT];
    if (!source) {
      throw new Error("Thiếu slot");
    }
    const verdict = session.dispatch({
      type: "tap",
      x: source.x,
      y: source.y,
      timeMs: 5,
    });
    expect(verdict?.valid).toBe(true);
    expect(session.getPlacedUnitsCount()).toBe(1);
  });
});
